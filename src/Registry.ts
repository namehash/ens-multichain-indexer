import { type Context, type Event, ponder } from "ponder:registry";
import { resolvers } from "ponder:schema";
import { domains } from "ponder:schema";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { type Hex, zeroAddress } from "viem";
import { NAMEHASH_ZERO, makeSubnodeNamehash } from "./lib/ens-helpers";
import { makeResolverId } from "./lib/ids";
import { upsertAccount } from "./lib/upserts";

// a domain is migrated iff it exists and isMigrated is set to true, otherwise it is not
async function isDomainMigrated(context: Context, node: Hex) {
  const domain = await context.db.find(domains, { id: node });
  return domain?.isMigrated ?? false;
}

function isDomainEmpty(domain: typeof domains.$inferSelect) {
  return (
    domain.resolverId === null && domain.ownerId === zeroAddress && domain.subdomainCount === 0
  );
}

// a more accurate name for the following function
// https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L64
async function recursivelyRemoveEmptyDomainFromParentSubdomainCount(context: Context, node: Hex) {
  const domain = await context.db.find(domains, { id: node });
  if (!domain) throw new Error(`Domain not found: ${node}`);

  if (isDomainEmpty(domain) && domain.parentId !== null) {
    // decrement parent's subdomain count
    await context.db
      .update(domains, { id: domain.parentId })
      .set((row) => ({ subdomainCount: row.subdomainCount - 1 }));

    // recurse to parent
    return recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, domain.parentId);
  }
}

async function _handleTransfer({
  context,
  event,
}: {
  context: Context;
  event: Event<"Registry:Transfer">;
}) {
  const { node, owner } = event.args;

  // ensure owner account
  await upsertAccount(context, owner);

  // ensure domain & update owner
  await context.db
    .insert(domains)
    .values([{ id: node, ownerId: owner, createdAt: event.block.timestamp }])
    .onConflictDoUpdate({ ownerId: owner });

  // garbage collect newly 'empty' domain iff necessary
  if (owner === zeroAddress) {
    await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
  }

  // TODO: log DomainEvent
}

const _handleNewOwner =
  (isMigrated: boolean) =>
  async ({
    context,
    event,
  }: {
    context: Context;
    event: Event<"Registry:NewOwner">;
  }) => {
    const { label, node, owner } = event.args;

    const subnode = makeSubnodeNamehash(node, label);

    // ensure owner
    await upsertAccount(context, owner);

    // note that we set isMigrated so that if this domain is being interacted with on the new registry, its migration status is set here
    let domain = await context.db.find(domains, { id: subnode });
    if (domain) {
      // if the domain already exists, this is just an update of the owner record (& isMigrated)
      await context.db.update(domains, { id: domain.id }).set({ ownerId: owner, isMigrated });
    } else {
      // otherwise create the domain
      domain = await context.db.insert(domains).values({
        id: subnode,
        ownerId: owner,
        parentId: node,
        createdAt: event.block.timestamp,
        isMigrated,
      });

      // and increment parent subdomainCount
      await context.db
        .update(domains, { id: node })
        .set((row) => ({ subdomainCount: row.subdomainCount + 1 }));
    }

    // if the domain doesn't yet have a name, construct it here
    if (!domain.name) {
      const parent = await context.db.find(domains, { id: node });

      // TODO: implement sync rainbow table lookups
      // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L111
      const labelName = encodeLabelhash(label);
      const name = parent?.name ? `${labelName}.${parent.name}` : labelName;

      await context.db.update(domains, { id: domain.id }).set({ name, labelName });
    }

    // garbage collect newly 'empty' domain iff necessary
    if (owner === zeroAddress) {
      await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, domain.id);
    }
  };

async function _handleNewTTL({
  context,
  event,
}: {
  context: Context;
  event: Event<"Registry:NewTTL">;
}) {
  const { node, ttl } = event.args;

  // TODO: handle the edge case in which the domain no longer exists?
  // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L215
  // NOTE: i'm not sure this needs to be here, as domains are never deleted (??)
  await context.db.update(domains, { id: node }).set({ ttl });

  // TODO: log DomainEvent
}

async function _handleNewResolver({
  context,
  event,
}: {
  context: Context;
  event: Event<"Registry:NewResolver">;
}) {
  const { node, resolver: resolverAddress } = event.args;

  // if zeroing out a domain's resolver, remove the reference instead of tracking a zeroAddress Resolver
  // NOTE: old resolver resources are kept for event logs
  if (event.args.resolver === zeroAddress) {
    await context.db.update(domains, { id: node }).set({ resolverId: null });

    // garbage collect newly 'empty' domain iff necessary
    await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
  } else {
    // otherwise upsert the resolver
    const resolverId = makeResolverId(node, resolverAddress);

    const resolver = await context.db
      .insert(resolvers)
      .values({
        id: resolverId,
        domainId: event.args.node,
        address: event.args.resolver,
      })
      .onConflictDoNothing();

    // update the domain to point to it, and denormalize the eth addr
    await context.db
      .update(domains, { id: node })
      .set({ resolverId, resolvedAddress: resolver?.addrId });
  }

  // TODO: log DomainEvent
}

// setup on old registry
ponder.on("RegistryOld:setup", async ({ context }) => {
  // ensure we have an account for the zeroAddress
  await upsertAccount(context, zeroAddress);

  // ensure we have a root Domain, owned by the zeroAddress
  await context.db.insert(domains).values({
    id: NAMEHASH_ZERO,
    ownerId: zeroAddress,
    createdAt: 0n,
    isMigrated: false,
  });
});

// old registry functions are proxied to the current handlers
// iff the domain has not yet been migrated
ponder.on("RegistryOld:NewOwner", async ({ context, event }) => {
  const node = makeSubnodeNamehash(event.args.node, event.args.label);
  const isMigrated = await isDomainMigrated(context, node);
  if (isMigrated) return;
  return _handleNewOwner(false)({ context, event });
});

ponder.on("RegistryOld:NewResolver", async ({ context, event }) => {
  // NOTE: the subgraph makes an exception for the root node here
  // but i don't know that that's necessary, as in ponder our root node starts out
  // unmigrated and once the NewOwner event is emitted by the new registry,
  // the root will be considered migrated
  // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L246

  // otherwise, only handle iff not migrated
  const isMigrated = await isDomainMigrated(context, event.args.node);
  if (isMigrated) return;
  return _handleNewResolver({ context, event });
});

ponder.on("RegistryOld:NewTTL", async ({ context, event }) => {
  const isMigrated = await isDomainMigrated(context, event.args.node);
  if (isMigrated) return;
  return _handleNewTTL({ context, event });
});

ponder.on("RegistryOld:Transfer", async ({ context, event }) => {
  const isMigrated = await isDomainMigrated(context, event.args.node);
  if (isMigrated) return;
  return _handleTransfer({ context, event });
});

ponder.on("Registry:NewOwner", _handleNewOwner(true));
ponder.on("Registry:NewResolver", _handleNewResolver);
ponder.on("Registry:NewTTL", _handleNewTTL);
ponder.on("Registry:Transfer", _handleTransfer);
