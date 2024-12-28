import { createConfig, factory, mergeAbis } from "ponder";
import { http, getAbiItem } from "viem";

import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController } from "./abis/EthRegistrarController";
import { EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
import { LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { NameWrapper } from "./abis/NameWrapper";
import { Registry } from "./abis/Registry";
import { Resolver } from "./abis/Resolver";

const NAME_WRAPPER_START_BLOCK = 16925608;

const END_BLOCK = NAME_WRAPPER_START_BLOCK - 1;

const RESOLVER_ABI = mergeAbis([LegacyPublicResolver, Resolver]);

const REGISTRY_OLD_ADDRESS = "0x314159265dd8dbb310642f98f50c066173c1259b";
const REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

const BASE_REGISTRAR_ADDRESS = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
const ETH_REGISTRAR_CONTROLLER_OLD_ADDRESS = "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5";
const ETH_REGISTRAR_CONTROLLER_ADDRESS = "0x253553366Da8546fC250F225fe3d25d0C782303b";
const NAME_WRAPPER_ADDRESS = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
  },
  contracts: {
    RegistryOld: {
      network: "mainnet",
      abi: Registry,
      address: REGISTRY_OLD_ADDRESS,
      startBlock: 3327417,
      endBlock: END_BLOCK,
    },
    Registry: {
      network: "mainnet",
      abi: Registry,
      address: REGISTRY_ADDRESS,
      startBlock: 9380380,
      endBlock: END_BLOCK,
    },
    OldRegistryResolvers: {
      network: "mainnet",
      abi: RESOLVER_ABI,
      address: factory({
        address: REGISTRY_OLD_ADDRESS,
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: 9380380,
      endBlock: END_BLOCK,
    },
    Resolver: {
      network: "mainnet",
      abi: RESOLVER_ABI,
      address: factory({
        address: REGISTRY_ADDRESS,
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: 9380380,
      endBlock: END_BLOCK,
    },
    BaseRegistrar: {
      network: "mainnet",
      abi: BaseRegistrar,
      address: BASE_REGISTRAR_ADDRESS,
      startBlock: 9380410,
      endBlock: END_BLOCK,
    },
    EthRegistrarControllerOld: {
      network: "mainnet",
      abi: EthRegistrarControllerOld,
      address: ETH_REGISTRAR_CONTROLLER_OLD_ADDRESS,
      startBlock: 9380471,
      endBlock: END_BLOCK,
    },
    EthRegistrarController: {
      network: "mainnet",
      abi: EthRegistrarController,
      address: ETH_REGISTRAR_CONTROLLER_ADDRESS,
      startBlock: Math.min(16925618, END_BLOCK),
      endBlock: END_BLOCK,
    },
    NameWrapper: {
      network: "mainnet",
      abi: NameWrapper,
      address: NAME_WRAPPER_ADDRESS,
      startBlock: Math.min(16925608, END_BLOCK),
      endBlock: END_BLOCK,
    },
  },
});
