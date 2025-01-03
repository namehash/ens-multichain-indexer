import { type Context, type Event } from "ponder:registry";
import { domains, resolvers } from "ponder:schema";
import { base, mainnet } from "viem/chains";
import { hasNullByte, uniq } from "../lib/helpers";
import { makeResolverId } from "../lib/ids";
import { NsReturnType } from "../lib/plugins";
import { upsertAccount, upsertResolver } from "../lib/upserts";

type NsType<T extends string> = NsReturnType<T, "/eth">;

// there is a legacy resolver abi with different TextChanged events.
// luckily the subgraph doesn't care about the value parameter so we can use a union
// to unify the codepath
type AnyTextChangedEvent =
  | Event<
      NsType<"Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)">
    >
  | Event<
      NsType<"Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)">
    >
  | Event<NsReturnType<"Resolver:TextChanged", "/eth/base">>
  | Event<
      NsType<"OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)">
    >
  | Event<
      NsType<"OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)">
    >;

export async function handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:AddrChanged">>;
}) {
  const { a: address, node } = event.args;
  await upsertAccount(context, address);

  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    addrId: address,
  });

  // materialize the resolved add to the domain iff this resolver is active
  const domain = await context.db.find(domains, { id: node });
  if (domain?.resolverId === id) {
    await context.db.update(domains, { id: node }).set({ resolvedAddress: address });
  }

  // TODO: log ResolverEvent
}

export async function handleAddressChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:AddressChanged">>;
}) {
  const { node, coinType, newAddress } = event.args;
  await upsertAccount(context, newAddress);

  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert the new coinType
  await context.db
    .update(resolvers, { id })
    .set({ coinTypes: uniq([...resolver.coinTypes, coinType]) });

  // TODO: log ResolverEvent
}

export async function handleNameChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:NameChanged">>;
}) {
  const { node, name } = event.args;
  if (hasNullByte(name)) return;

  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

export async function handleABIChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:ABIChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

export async function handlePubkeyChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:PubkeyChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

export async function handleTextChanged({
  context,
  event,
}: {
  context: Context;
  event: AnyTextChangedEvent;
}) {
  const { node, key } = event.args;
  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert new key
  await context.db.update(resolvers, { id }).set({ texts: uniq([...resolver.texts, key]) });

  // TODO: log ResolverEvent
}

export async function handleContenthashChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:ContenthashChanged">>;
}) {
  const { node, hash } = event.args;
  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    contentHash: hash,
  });

  // TODO: log ResolverEvent
}

export async function handleInterfaceChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:InterfaceChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

export async function handleAuthorisationChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:AuthorisationChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

export async function handleVersionChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:VersionChanged">>;
}) {
  // a version change nulls out the resolver
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const domain = await context.db.find(domains, { id: node });
  if (!domain) throw new Error("domain expected");

  // materialize the Domain's resolvedAddress field
  if (domain.resolverId === id) {
    await context.db.update(domains, { id: node }).set({ resolvedAddress: null });
  }

  // clear out the resolver's info
  await context.db.update(resolvers, { id }).set({
    addrId: null,
    contentHash: null,
    coinTypes: [],
    texts: [],
  });

  // TODO: log ResolverEvent
}

export async function handleDNSRecordChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:DNSRecordChanged">>;
}) {
  // subgraph ignores
}

export async function handleDNSRecordDeleted({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:DNSRecordDeleted">>;
}) {
  // subgraph ignores
}

export async function handleDNSZonehashChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:DNSZonehashChanged">>;
}) {
  // subgraph ignores
}
