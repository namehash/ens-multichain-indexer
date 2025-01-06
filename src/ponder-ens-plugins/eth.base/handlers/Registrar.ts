import { ponder } from "ponder:registry";
import { domains } from "ponder:schema";
import { makeRegistryHandlers } from "../../../handlers/Registrar";
import { makeSubnodeNamehash, tokenIdToLabel } from "../../../lib/ens-helpers";
import { upsertAccount } from "../../../lib/upserts";
import { baseName, ns } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
  baseNameNode,
} = makeRegistryHandlers(baseName);

export default function () {
  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  ponder.on(ns("BaseRegistrar:NameRegisteredWithRecord"), async ({ context, event }) =>
    handleNameRegistered({ context, event }),
  );

  ponder.on(ns("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    // base has 'preminted' names via Registrar#registerOnly, which explicitly does not update Registry.
    // this breaks a subgraph assumption, as it expects a domain to exist (via Registry:NewOwner) before
    // any Registrar:NameRegistered events. in the future we will likely happily upsert domains, but
    // in order to avoid prematurely drifting from subgraph equivalancy, we upsert the domain here,
    // allowing the base indexer to progress.
    const { id, owner } = event.args;
    const label = tokenIdToLabel(id);
    const node = makeSubnodeNamehash(baseNameNode, label);
    await upsertAccount(context, owner);
    await context.db
      .insert(domains)
      .values({
        id: node,
        ownerId: owner,
        createdAt: event.block.timestamp,
      })
      .onConflictDoNothing();

    // after ensuring the domain exists, continue with the standard handler
    return handleNameRegistered({ context, event });
  });
  ponder.on(ns("BaseRegistrar:NameRenewed"), handleNameRenewed);

  // Base's BaseRegistrar uses `id` instead of `tokenId`
  ponder.on(ns("BaseRegistrar:Transfer"), async ({ context, event }) => {
    return await handleNameTransferred({
      context,
      args: { ...event.args, tokenId: event.args.id },
    });
  });

  ponder.on(ns("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    return handleNameRegisteredByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });

  ponder.on(ns("RegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    return handleNameRegisteredByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });

  ponder.on(ns("RegistrarController:NameRenewed"), async ({ context, event }) => {
    return handleNameRenewedByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });
}
