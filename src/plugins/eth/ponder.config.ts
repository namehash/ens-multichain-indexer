import { ContractConfig, createConfig, mergeAbis } from "ponder";
import { http } from "viem";

import { mainnet } from "viem/chains";
import { blockConfig, rpcEndpointUrl, rpcMaxRequestsPerSecond } from "../../lib/helpers";
import { createPluginNamespace } from "../../lib/plugin-helpers";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController } from "./abis/EthRegistrarController";
import { EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
import { LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { NameWrapper } from "./abis/NameWrapper";
import { Registry } from "./abis/Registry";
import { Resolver } from "./abis/Resolver";

const RESOLVER_ABI = mergeAbis([LegacyPublicResolver, Resolver]);

export const ownedName = "eth";

export const pluginNamespace = createPluginNamespace(ownedName);

// constrain indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
const START_BLOCK: ContractConfig["startBlock"] = undefined;
const END_BLOCK: ContractConfig["endBlock"] = 21_000_000;

const REGISTRY_OLD_ADDRESS = "0x314159265dd8dbb310642f98f50c066173c1259b";
const REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

export const config = createConfig({
  networks: {
    mainnet: {
      chainId: mainnet.id,
      transport: http(rpcEndpointUrl(mainnet.id)),
      maxRequestsPerSecond: rpcMaxRequestsPerSecond(mainnet.id),
    },
  },
  contracts: {
    [pluginNamespace("RegistryOld")]: {
      network: "mainnet",
      abi: Registry,
      address: REGISTRY_OLD_ADDRESS,
      ...blockConfig(START_BLOCK, 3327417, END_BLOCK),
    },
    [pluginNamespace("Registry")]: {
      network: "mainnet",
      abi: Registry,
      address: REGISTRY_ADDRESS,
      ...blockConfig(START_BLOCK, 9380380, END_BLOCK),
    },
    [pluginNamespace("Resolver")]: {
      network: "mainnet",
      abi: RESOLVER_ABI,
      // NOTE: this indexes every event ever emitted that looks like this
      filter: {
        event: [
          "AddrChanged",
          "AddressChanged",
          "NameChanged",
          "ABIChanged",
          "PubkeyChanged",
          "TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
          "TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
          "ContenthashChanged",
          "InterfaceChanged",
          "AuthorisationChanged",
          "VersionChanged",
          "DNSRecordChanged",
          "DNSRecordDeleted",
          "DNSZonehashChanged",
        ],
      },
      ...blockConfig(START_BLOCK, 3327417, END_BLOCK),
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "mainnet",
      abi: BaseRegistrar,
      address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
      ...blockConfig(START_BLOCK, 9380410, END_BLOCK),
    },
    [pluginNamespace("EthRegistrarControllerOld")]: {
      network: "mainnet",
      abi: EthRegistrarControllerOld,
      address: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
      ...blockConfig(START_BLOCK, 9380471, END_BLOCK),
    },
    [pluginNamespace("EthRegistrarController")]: {
      network: "mainnet",
      abi: EthRegistrarController,
      address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
      ...blockConfig(START_BLOCK, 16925618, END_BLOCK),
    },
    [pluginNamespace("NameWrapper")]: {
      network: "mainnet",
      abi: NameWrapper,
      address: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
      ...blockConfig(START_BLOCK, 16925608, END_BLOCK),
    },
  },
});

export async function activate() {
  const ponderIndexingModules = await Promise.all([
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ]);

  ponderIndexingModules.map((m) => m.default());
}
