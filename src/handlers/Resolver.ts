import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { Log } from "ponder";
import { Hex } from "viem";
import { upsertAccount, upsertResolver } from "../lib/db-helpers";
import { hasNullByte, uniq } from "../lib/helpers";
import { makeResolverId } from "../lib/ids";

export async function handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: {
    args: { node: Hex; a: Hex };
    log: Log;
  };
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
  const domain = await context.db.find(schema.domain, { id: node });
  if (domain?.resolverId === id) {
    await context.db.update(schema.domain, { id: node }).set({ resolvedAddress: address });
  }

  // TODO: log ResolverEvent
}

export async function handleAddressChanged({
  context,
  event,
}: {
  context: Context;
  event: {
    args: { node: Hex; coinType: bigint; newAddress: Hex };
    log: Log;
  };
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
    .update(schema.resolver, { id })
    .set({ coinTypes: uniq([...resolver.coinTypes, coinType]) });

  // TODO: log ResolverEvent
}

export async function handleNameChanged({
  context,
  event,
}: {
  context: Context;
  event: {
    args: { node: Hex; name: string };
    log: Log;
  };
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
  event: {
    args: { node: Hex };
    log: Log;
  };
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
  event: {
    args: { node: Hex };
    log: Log;
  };
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
  event: {
    args: { node: Hex; indexedKey: string; key: string; value?: string };
    log: Log;
  };
}) {
  const { node, key } = event.args;
  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert new key
  await context.db.update(schema.resolver, { id }).set({ texts: uniq([...resolver.texts, key]) });

  // TODO: log ResolverEvent
}

export async function handleContenthashChanged({
  context,
  event,
}: {
  context: Context;
  event: {
    args: { node: Hex; hash: Hex };
    log: Log;
  };
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
  event: {
    args: {
      node: Hex;
      interfaceID: Hex;
      implementer: Hex;
    };
    log: Log;
  };
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
  event: {
    args: {
      node: Hex;
      owner: Hex;
      target: Hex;
      isAuthorised: boolean;
    };
    log: Log;
  };
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
  event: {
    args: {
      node: Hex;
      newVersion: bigint;
    };
    log: Log;
  };
}) {
  // a version change nulls out the resolver
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const domain = await context.db.find(schema.domain, { id: node });
  if (!domain) throw new Error("domain expected");

  // materialize the Domain's resolvedAddress field
  if (domain.resolverId === id) {
    await context.db.update(schema.domain, { id: node }).set({ resolvedAddress: null });
  }

  // clear out the resolver's info
  await context.db.update(schema.resolver, { id }).set({
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
  event: {
    args: {
      node: Hex;
      name: Hex;
      resource: number;
      record: Hex;
    };
  };
}) {
  // subgraph ignores
}

export async function handleDNSRecordDeleted({
  context,
  event,
}: {
  context: Context;
  event: {
    args: {
      node: Hex;
      name: Hex;
      resource: number;
      record?: Hex;
    };
  };
}) {
  // subgraph ignores
}

export async function handleDNSZonehashChanged({
  context,
  event,
}: {
  context: Context;
  event: {
    args: {
      node: Hex;
      zonehash: Hex;
    };
  };
}) {
  // subgraph ignores
}
