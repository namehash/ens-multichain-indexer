import { type Hex, concat, keccak256, namehash, toHex } from "viem";

// TODO: pull from ens utils lib or something
export const NAMEHASH_ZERO = namehash("");
export const NAMEHASH_ETH = namehash("eth");
export const NAMEHASH_BASE_ETH = namehash("base.eth");

// TODO: this should probably be a part of some ens util lib
export const makeSubnodeNamehash = (node: Hex, label: Hex) => keccak256(concat([node, label]));

// https://github.com/wevm/viem/blob/main/src/utils/ens/encodeLabelhash.ts
export const encodeLabelhash = (hash: Hex): `[${string}]` => `[${hash.slice(2)}]`;

export const tokenIdToLabel = (tokenId: bigint) => toHex(tokenId, { size: 32 });

// https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L68
const INVALID_CHARACTER_CODES_IN_LABEL = new Set([0, 46, 91, 93]);
export const isLabelValid = (name: string) => {
  if (!name) return false;

  for (let i = 0; i < name.length; i++) {
    if (INVALID_CHARACTER_CODES_IN_LABEL.has(name.charCodeAt(i))) return false;
  }

  return true;
};
