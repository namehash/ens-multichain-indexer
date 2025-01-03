import { ponder } from "ponder:registry";
import { makeRegistryHandlers } from "../../../handlers/Registrar";
import { NAMEHASH_ETH } from "../../../lib/ens-helpers";
import { ns } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
} = makeRegistryHandlers(NAMEHASH_ETH);

export default function () {
  ponder.on(ns("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(ns("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(ns("BaseRegistrar:Transfer"), async ({ context, event }) => {
    return await handleNameTransferred({ context, args: event.args });
  });

  ponder.on(ns("EthRegistrarControllerOld:NameRegistered"), async ({ context, event }) => {
    // the old registrar controller just had `cost` param
    return await handleNameRegisteredByController({ context, args: event.args });
  });
  ponder.on(ns("EthRegistrarControllerOld:NameRenewed"), async ({ context, event }) => {
    return await handleNameRenewedByController({ context, args: event.args });
  });

  ponder.on(ns("EthRegistrarController:NameRegistered"), async ({ context, event }) => {
    // the new registrar controller uses baseCost + premium to compute cost
    return await handleNameRegisteredByController({
      context,
      args: {
        ...event.args,
        cost: event.args.baseCost + event.args.premium,
      },
    });
  });
  ponder.on(ns("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    return await handleNameRenewedByController({ context, args: event.args });
  });
}
