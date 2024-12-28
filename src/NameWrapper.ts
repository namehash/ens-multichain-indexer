import { type Context, type Event, ponder } from "ponder:registry";
import { domains, wrappedDomains } from "ponder:schema";
import { type Address, type Hex, stringToBytes } from "viem";
import {
  NAMEHASH_ETH,
  checkPccBurned,
  decodeDNSPacketBytes,
  tokenIdToLabel,
} from "./lib/ens-helpers";
import { bigintMax } from "./lib/helpers";
import { makeEventId } from "./lib/ids";
import { upsertAccount } from "./lib/upserts";

// if the wrappedDomain in question has pcc burned (?) and a higher (?) expiry date, update the domain's expiryDate
async function materializeDomainExpiryDate(context: Context, node: Hex) {
  const wrappedDomain = await context.db.find(wrappedDomains, { id: node });
  if (!wrappedDomain) throw new Error(`Expected WrappedDomain(${node})`);

  // ignore if pcc not burned
  if (!checkPccBurned(wrappedDomain.fuses)) return;

  // update the domain's expiry to the greater of the two
  await context.db.update(domains, { id: node }).set((domain) => ({
    expiryDate: bigintMax(domain.expiryDate ?? 0n, wrappedDomain.expiryDate),
  }));
}

async function handleTransfer(
  context: Context,
  event: Event<"NameWrapper:TransferSingle"> | Event<"NameWrapper:TransferBatch">,
  eventId: string,
  tokenId: bigint,
  to: Address,
) {
  await upsertAccount(context, to);
  const node = tokenIdToLabel(tokenId);

  // TODO: remove this if it never fires: subgraph upserts domain but shouldn't be necessary
  const domain = await context.db.find(domains, { id: node });
  if (!domain) {
    console.log("NameWrapper:handleTransfer called before domain existed");
    console.table({ ...event.args, node });
  }

  // upsert the WrappedDomain, only changing owner iff exists
  await context.db
    .insert(wrappedDomains)
    .values({
      id: node,
      ownerId: to,
      domainId: node,

      // placeholders until we get the NameWrapped event
      expiryDate: 0n,
      fuses: 0,
    })
    .onConflictDoUpdate({
      ownerId: to,
    });

  // TODO: log WrappedTransfer
}

ponder.on("NameWrapper:NameWrapped", async ({ context, event }) => {
  const { node, owner, fuses, expiry } = event.args;

  await upsertAccount(context, owner);

  // decode the name emitted by NameWrapper
  const [label, name] = decodeDNSPacketBytes(stringToBytes(event.args.name));

  // upsert the healed name iff valid
  if (label) {
    await context.db.update(domains, { id: node }).set({ labelName: label, name });
  }

  // update the WrappedDomain that was created in handleTransfer
  await context.db.update(wrappedDomains, { id: node }).set({
    name,
    expiryDate: expiry,
    fuses,
  });

  // materialize wrappedOwner relation
  await context.db.update(domains, { id: node }).set({ wrappedOwnerId: owner });

  // materialize domain expiryDate
  await materializeDomainExpiryDate(context, node);

  // TODO: log NameWrapped
});

ponder.on("NameWrapper:NameUnwrapped", async ({ context, event }) => {
  const { node, owner } = event.args;

  await upsertAccount(context, owner);

  await context.db.update(domains, { id: node }).set((domain) => ({
    // https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L123
    ...(domain.expiryDate && domain.parentId !== NAMEHASH_ETH && { expiryDate: null }),
    ownerId: owner,
  }));

  // TODO: log NameUnwrapped
});

ponder.on("NameWrapper:FusesSet", async ({ context, event }) => {
  const { node, fuses } = event.args;

  // NOTE: subgraph does an implicit ignore if no WrappedDomain record.
  // we will be more explicit and update logic if necessary
  await context.db.update(wrappedDomains, { id: node }).set({ fuses });

  // materialize domain's expiryDate
  await materializeDomainExpiryDate(context, node);

  // TODO: log FusesSet
});

ponder.on("NameWrapper:ExpiryExtended", async ({ context, event }) => {
  const { node, expiry } = event.args;

  // NOTE: subgraph does an implicit ignore if no WrappedDomain record.
  // we will be more explicit and update logic if necessary
  await context.db.update(wrappedDomains, { id: node }).set({ expiryDate: expiry });

  // materialize the domain's expiryDate
  await materializeDomainExpiryDate(context, node);

  // TODO: log ExpiryExtended
});

ponder.on("NameWrapper:TransferSingle", async ({ context, event }) => {
  return await handleTransfer(context, event, makeEventId(event, 0), event.args.id, event.args.to);
});

ponder.on("NameWrapper:TransferBatch", async ({ context, event }) => {
  for (const [i, id] of event.args.ids.entries()) {
    await handleTransfer(context, event, makeEventId(event, i), id, event.args.to);
  }
});
