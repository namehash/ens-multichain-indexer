import { type Context, ponder } from "ponder:registry";
import { domains } from "ponder:schema";
import { type Hex } from "viem";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
  setup,
} from "../../../handlers/Registry";
import { makeSubnodeNamehash } from "../../../lib/ens-helpers";
import { ns } from "../ponder.config";

// a domain is migrated iff it exists and isMigrated is set to true, otherwise it is not
async function isDomainMigrated(context: Context, node: Hex) {
  const domain = await context.db.find(domains, { id: node });
  return domain?.isMigrated ?? false;
}

export default function () {
  ponder.on(ns("RegistryOld:setup"), setup);

  // old registry functions are proxied to the current handlers
  // iff the domain has not yet been migrated
  ponder.on(ns("RegistryOld:NewOwner"), async ({ context, event }) => {
    const node = makeSubnodeNamehash(event.args.node, event.args.label);
    const isMigrated = await isDomainMigrated(context, node);
    if (isMigrated) return;
    return handleNewOwner(false)({ context, event });
  });

  ponder.on(ns("RegistryOld:NewResolver"), async ({ context, event }) => {
    // NOTE: the subgraph makes an exception for the root node here
    // but i don't know that that's necessary, as in ponder our root node starts out
    // unmigrated and once the NewOwner event is emitted by the new registry,
    // the root will be considered migrated
    // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L246

    // otherwise, only handle iff not migrated
    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleNewResolver({ context, event });
  });

  ponder.on(ns("RegistryOld:NewTTL"), async ({ context, event }) => {
    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleNewTTL({ context, event });
  });

  ponder.on(ns("RegistryOld:Transfer"), async ({ context, event }) => {
    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleTransfer({ context, event });
  });

  ponder.on(ns("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(ns("Registry:NewResolver"), handleNewResolver);
  ponder.on(ns("Registry:NewTTL"), handleNewTTL);
  ponder.on(ns("Registry:Transfer"), handleTransfer);
}
