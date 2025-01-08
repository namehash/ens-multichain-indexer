import { createConfig, factory, mergeAbis } from "ponder";
import { http, getAbiItem } from "viem";

import { mainnet } from "viem/chains";
import { createPluginNamespace } from "../../lib/plugin-helpers";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController } from "./abis/EthRegistrarController";
import { EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
import { LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { NameWrapper } from "./abis/NameWrapper";
import { Registry } from "./abis/Registry";
import { Resolver } from "./abis/Resolver";

const RESOLVER_ABI = mergeAbis([LegacyPublicResolver, Resolver]);

export const ownedSubname = "eth";

export const pluginNamespace = createPluginNamespace(ownedSubname);

export const config = createConfig({
  networks: {
    mainnet: {
      chainId: mainnet.id,
      transport: http(process.env[`RPC_URL_${mainnet.id}`]),
    },
  },
  contracts: {
    [pluginNamespace("RegistryOld")]: {
      network: "mainnet",
      abi: Registry,
      address: "0x314159265dd8dbb310642f98f50c066173c1259b",
      startBlock: 3327417,
    },
    [pluginNamespace("Registry")]: {
      network: "mainnet",
      abi: Registry,
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
      startBlock: 9380380,
    },
    [pluginNamespace("OldRegistryResolvers")]: {
      network: "mainnet",
      abi: RESOLVER_ABI,
      address: factory({
        address: "0x314159265dd8dbb310642f98f50c066173c1259b",
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: 9380380,
    },
    [pluginNamespace("Resolver")]: {
      network: "mainnet",
      abi: RESOLVER_ABI,
      address: factory({
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: 9380380,
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "mainnet",
      abi: BaseRegistrar,
      address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
      startBlock: 9380410,
    },
    [pluginNamespace("EthRegistrarControllerOld")]: {
      network: "mainnet",
      abi: EthRegistrarControllerOld,
      address: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
      startBlock: 9380471,
    },
    [pluginNamespace("EthRegistrarController")]: {
      network: "mainnet",
      abi: EthRegistrarController,
      address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
      startBlock: 16925618,
    },
    [pluginNamespace("NameWrapper")]: {
      network: "mainnet",
      abi: NameWrapper,
      address: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
      startBlock: 16925608,
    },
  },
});

export async function activate() {
  const ponderIndexingModules = await Promise.all([
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
  ]);

  ponderIndexingModules.map((m) => m.default());
}
