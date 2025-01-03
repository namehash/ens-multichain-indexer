import { ponder } from "ponder:registry";
import { makeRegistryHandlers } from "../../../handlers/Registrar";
import { NAMEHASH_BASE_ETH } from "../../../lib/ens-helpers";
import { ns } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
} = makeRegistryHandlers(NAMEHASH_BASE_ETH);

export default function () {
  ponder.on(ns("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(ns("BaseRegistrar:NameRenewed"), handleNameRenewed);

  // Base's BaseRegistrar uses `id` instead of `tokenId`
  ponder.on(ns("BaseRegistrar:Transfer"), async ({ context, event }) => {
    return await handleNameTransferred({
      context,
      args: {
        ...event.args,
        tokenId: event.args.id,
      },
    });
  });

  ponder.on(ns("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    return handleNameRegisteredByController({
      context,
      args: {
        ...event.args,
        cost: 0n,
      },
    });
  });

  ponder.on(ns("RegistrarController:NameRegistered"), async ({ context, event }) => {
    return handleNameRegisteredByController({
      context,
      args: {
        ...event.args,
        cost: 0n,
      },
    });
  });

  ponder.on(ns("RegistrarController:NameRenewed"), async ({ context, event }) => {
    return handleNameRenewedByController({
      context,
      args: {
        ...event.args,
        cost: 0n,
      },
    });
  });
}
