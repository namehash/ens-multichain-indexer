import { createConfig, factory } from "ponder";
import { http, getAbiItem } from "viem";
import { base } from "viem/chains";

import { NsReturnType, createNs } from "../../lib/plugins";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EarlyAccessRegistrarController } from "./abis/EARegistrarController";
import { L2Resolver } from "./abis/L2Resolver";
import { RegistrarController } from "./abis/RegistrarController";
import { Registry } from "./abis/Registry";

const rootDomain = "/eth/base" as const;
export const ns = createNs(rootDomain);
export type NsType<T extends string> = NsReturnType<T, typeof rootDomain>;

const REGISTRY_ADDRESS = "0xb94704422c2a1e396835a571837aa5ae53285a95";
const REGISTRY_START_BLOCK = 17571480;

const BASE_REGISTRAR_ADDRESS = "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a";
const BASE_REGISTRAR_START_BLOCK = 17571486;

const REGISTRAR_CONTROLLER_ADDRESS =
  "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";
const REGISTRAR_CONTROLLER_START_BLOCK = 18619035;

const EA_REGISTRAR_CONTROLLER_ADDRESS =
  "0xd3e6775ed9b7dc12b205c8e608dc3767b9e5efda";
const EA_REGISTRAR_CONTROLLER_START_BLOCK = 17575699;

const REVERSE_REGISTRAR_ADDRESS = "0x79ea96012eea67a83431f1701b3dff7e37f9e282";
const REVERSE_REGISTRAR_START_BLOCK = 17571485;

const L1_RESOLVER_ADDRESS = "0xde9049636F4a1dfE0a64d1bFe3155C0A14C54F31";
const L1_RESOLVER_START_BLOCK = 20420641;

const L2_RESOLVER_ADDRESS = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";
const L2_RESOLVER_START_BLOCK = 17575714;

export const config = createConfig({
  networks: {
    base: {
      chainId: base.id,
      transport: http(process.env[`PONDER_RPC_URL_${base.id}`]),
    },
  },
  contracts: {
    [ns("Registry")]: {
      network: "base",
      abi: Registry,
      address: REGISTRY_ADDRESS,
      startBlock: REGISTRY_START_BLOCK,
    },
    [ns("Resolver")]: {
      network: "base",
      abi: L2Resolver,
      address: factory({
        address: L2_RESOLVER_ADDRESS,
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: L2_RESOLVER_START_BLOCK,
    },
    [ns("BaseRegistrar")]: {
      network: "base",
      abi: BaseRegistrar,
      address: BASE_REGISTRAR_ADDRESS,
      startBlock: BASE_REGISTRAR_START_BLOCK,
    },
    [ns("EARegistrarController")]: {
      network: "base",
      abi: EarlyAccessRegistrarController,
      address: EA_REGISTRAR_CONTROLLER_ADDRESS,
      startBlock: EA_REGISTRAR_CONTROLLER_START_BLOCK,
    },
    [ns("RegistrarController")]: {
      network: "base",
      abi: RegistrarController,
      address: REGISTRAR_CONTROLLER_ADDRESS,
      startBlock: REGISTRAR_CONTROLLER_START_BLOCK,
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
