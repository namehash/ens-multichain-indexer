// TODO: change the chainId to the root node value (i.e. namehash("base.eth"))
export function createNs<Domain extends EnsRootDomain>(domain: Domain) {
  /** Creates a name-spaced contract name */
  return function ns<ContractName extends string>(
    contractName: ContractName,
  ): NsReturnType<ContractName, Domain> {
    return `${domain}/${contractName}` as NsReturnType<ContractName, Domain>;
  };
}

export type NsReturnType<
  ContractName extends string,
  Domain extends EnsRootDomain,
> = `${Domain}/${ContractName}`;

export const EnsRootDomains = ["/eth", "/eth/base"] as const;

export type EnsRootDomain = (typeof EnsRootDomains)[number];
