import { ContractConfig, createConfig, factory, mergeAbis } from "ponder";
import { http, getAbiItem } from "viem";

import { linea } from "viem/chains";
import { blockConfig, rpcEndpointUrl, rpcMaxRequestsPerSecond } from "../../lib/helpers";
import { createPluginNamespace } from "../../lib/plugin-helpers";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController } from "./abis/EthRegistrarController";
import { NameWrapper } from "./abis/NameWrapper";
import { Registry } from "./abis/Registry";
import { Resolver } from "./abis/Resolver";

export const ownedName = "linea.eth";

export const pluginNamespace = createPluginNamespace(ownedName);

// constrain indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
const START_BLOCK: ContractConfig["startBlock"] = undefined;
const END_BLOCK: ContractConfig["endBlock"] = undefined;

export const config = createConfig({
  networks: {
    linea: {
      chainId: linea.id,
      transport: http(rpcEndpointUrl(linea.id)),
      maxRequestsPerSecond: rpcMaxRequestsPerSecond(linea.id),
    },
  },
  contracts: {
    [pluginNamespace("Registry")]: {
      network: "linea",
      abi: Registry,
      address: "0x50130b669B28C339991d8676FA73CF122a121267",
      ...blockConfig(START_BLOCK, 6682888, END_BLOCK),
    },
    [pluginNamespace("Resolver")]: {
      network: "linea",
      abi: Resolver,
      // NOTE: this indexes every event ever emitted that looks like this
      filter: {
        event: [
          "AddrChanged",
          "AddressChanged",
          "NameChanged",
          "ABIChanged",
          "PubkeyChanged",
          "TextChanged",
          "ContenthashChanged",
          "InterfaceChanged",
          "VersionChanged",
          "DNSRecordChanged",
          "DNSRecordDeleted",
          "DNSZonehashChanged",
        ],
      },
      ...blockConfig(START_BLOCK, 6682888, END_BLOCK),
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "linea",
      abi: BaseRegistrar,
      address: "0x6e84390dCc5195414eC91A8c56A5c91021B95704",
      ...blockConfig(START_BLOCK, 6682892, END_BLOCK),
    },
    [pluginNamespace("EthRegistrarController")]: {
      network: "linea",
      abi: EthRegistrarController,
      address: "0xDb75Db974B1F2bD3b5916d503036208064D18295",
      ...blockConfig(START_BLOCK, 6682978, END_BLOCK),
    },
    [pluginNamespace("NameWrapper")]: {
      network: "linea",
      abi: NameWrapper,
      address: "0xA53cca02F98D590819141Aa85C891e2Af713C223",
      ...blockConfig(START_BLOCK, 6682956, END_BLOCK),
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
