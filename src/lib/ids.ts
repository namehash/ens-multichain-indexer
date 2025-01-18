import type { Event } from "ponder:registry";
import type { Address, Hex } from "viem";

// NOTE: subgraph uses lowercase address here, viem provides us checksummed, so we lowercase it
export const makeResolverId = (address: Address, node: Hex) =>
  [address.toLowerCase(), node].join("-");

// https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L5
// produces `blocknumber-logIndex` or `blocknumber-logindex-transferindex`
export const makeEventId = (event: Event, transferIndex?: number) =>
  [event.block.number.toString(), event.log.logIndex.toString(), transferIndex?.toString()]
    .filter(Boolean)
    .join("-");
