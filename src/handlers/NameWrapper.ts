import { type Context, type Event, type EventNames, ponder } from "ponder:registry";
import { domains, wrappedDomains } from "ponder:schema";
import { type Address, type Hex, stringToBytes } from "viem";
import { bigintMax } from "../lib/helpers";
import { makeEventId } from "../lib/ids";
import {
  ETH_NODE,
  checkPccBurned,
  decodeDNSPacketBytes,
  tokenIdToLabel,
} from "../lib/subname-helpers";
import { upsertAccount } from "../lib/upserts";

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
  event: Event<EventNames>,
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
export async function handleNameWrapped({
  context,
  event,
}: {
  context: Context;
  event: {
    args: {
      node: Hex;
      owner: Hex;
      fuses: number;
      expiry: bigint;
      name: string;
    };
  };
}) {
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
}

export async function handleNameUnwrapped({
  context,
  event,
}: {
  context: Context;
  event: {
    args: {
      node: Hex;
      owner: Hex;
    };
  };
}) {
  const { node, owner } = event.args;

  await upsertAccount(context, owner);

  await context.db.update(domains, { id: node }).set((domain) => ({
    // https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L123
    ...(domain.expiryDate && domain.parentId !== ETH_NODE && { expiryDate: null }),
    ownerId: owner,
  }));

  // TODO: log NameUnwrapped
}

export async function handleFusesSet({
  context,
  event,
}: {
  context: Context;
  event: {
    args: {
      node: Hex;
      fuses: number;
    };
  };
}) {
  const { node, fuses } = event.args;

  // NOTE: subgraph does an implicit ignore if no WrappedDomain record.
  // we will be more explicit and update logic if necessary
  await context.db.update(wrappedDomains, { id: node }).set({ fuses });
}

export async function handleExpiryExtended({
  context,
  event,
}: {
  context: Context;
  event: {
    args: {
      node: Hex;
      expiry: bigint;
    };
  };
}) {
  const { node, expiry } = event.args;

  // NOTE: subgraph does an implicit ignore if no WrappedDomain record.
  // we will be more explicit and update logic if necessary
  await context.db.update(wrappedDomains, { id: node }).set({ expiryDate: expiry });

  // materialize the domain's expiryDate
  await materializeDomainExpiryDate(context, node);

  // TODO: log ExpiryExtended
}

export async function handleTransferSingle({
  context,
  event,
}: {
  context: Context;
  event: Event<EventNames> & {
    args: {
      id: bigint;
      to: Hex;
    };
  };
}) {
  return await handleTransfer(context, event, makeEventId(event, 0), event.args.id, event.args.to);
}

export async function handleTransferBatch({
  context,
  event,
}: {
  context: Context;
  event: Event<EventNames> & {
    args: {
      ids: readonly bigint[];
      to: Hex;
    };
  };
}) {
  for (const [i, id] of event.args.ids.entries()) {
    await handleTransfer(context, event, makeEventId(event, i), id, event.args.to);
  }
}