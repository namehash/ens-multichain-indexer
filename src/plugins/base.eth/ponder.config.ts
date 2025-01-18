import { type ContractConfig, createConfig, factory } from "ponder";
import { http } from "viem";
import { base } from "viem/chains";

import { blockConfig, rpcEndpointUrl, rpcMaxRequestsPerSecond } from "../../lib/helpers";
import { createPluginNamespace } from "../../lib/plugin-helpers";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EarlyAccessRegistrarController } from "./abis/EARegistrarController";
import { L2Resolver } from "./abis/L2Resolver";
import { RegistrarController } from "./abis/RegistrarController";
import { Registry } from "./abis/Registry";

export const ownedName = "base.eth" as const;

export const pluginNamespace = createPluginNamespace(ownedName);

// constrain indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
const START_BLOCK: ContractConfig["startBlock"] = undefined;
const END_BLOCK: ContractConfig["endBlock"] = undefined;

export const config = createConfig({
  networks: {
    base: {
      chainId: base.id,
      transport: http(rpcEndpointUrl(base.id)),
      maxRequestsPerSecond: rpcMaxRequestsPerSecond(base.id),
    },
  },
  contracts: {
    [pluginNamespace("Registry")]: {
      network: "base",
      abi: Registry,
      address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
      ...blockConfig(START_BLOCK, 17571480, END_BLOCK),
    },
    [pluginNamespace("Resolver")]: {
      network: "base",
      abi: L2Resolver,
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
      ...blockConfig(START_BLOCK, 17571480, END_BLOCK),
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "base",
      abi: BaseRegistrar,
      address: "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a",
      ...blockConfig(START_BLOCK, 17571486, END_BLOCK),
    },
    [pluginNamespace("EARegistrarController")]: {
      network: "base",
      abi: EarlyAccessRegistrarController,
      address: "0xd3e6775ed9b7dc12b205c8e608dc3767b9e5efda",
      ...blockConfig(START_BLOCK, 17575699, END_BLOCK),
    },
    [pluginNamespace("RegistrarController")]: {
      network: "base",
      abi: RegistrarController,
      address: "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5",
      ...blockConfig(START_BLOCK, 18619035, END_BLOCK),
    },
  },
});

export async function activate() {
  const ponderIndexingModules = await Promise.all([
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
  ]);

  ponderIndexingModules.map((m) => m.default());
}
