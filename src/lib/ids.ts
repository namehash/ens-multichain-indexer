import type { Event } from "ponder:registry";
import type { Address, Hex } from "viem";

export const makeResolverId = (node: Hex, address: Address) => [address, node].join("-");

export const makeEventId = (event: Event, transferIndex?: number) =>
  [event.block.number.toString(), event.log.logIndex.toString(), transferIndex?.toString()]
    .filter(Boolean)
    .join("-");
