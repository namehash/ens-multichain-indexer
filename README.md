# ens-multichain indexer

> powered by ponder

estimated backfill time @ 50rps = 24-36 hours on M1 Macbook (~10x speedup)

### goals

> an optimized, multichain ens indexer that the community loves and integrates

- ease of deployment for indiviudals to run their own infra
- faster, more efficient, easier to use and deploy implementation
- v1 — **high confidence in subgraph equivalency**
  - 1:1 equivalency of results as compared to subgraph
    - matching the ~10 well-defined graphql queries
    - 100% ensjs, ens-app-v3 test suites passing
    - should 'just work', following [this documentation](https://github.com/ensdomains/ensjs/blob/main/docs/basics/custom-subgraph-uris.md)
  - dataset equivalency via subgraph dump diffs
  - query equivalency via proxy diff tool
- v2 — **optimized multichain indexer w/ unified namespace**
  - true multichain indexing (mainnet, base, linea, etc)
  - flattened, unified, multichain namespace
  - support key ens-app-v3 and wallet ENS funtions via optimized resolvers & PRs
  - high quality human-readable (healed) list of names by owner necessary for many UX
  - (possible) continued backwards compatibility with subgraph
  - support indexing subset of data, i.e. only domains under parent node

### todo

- [ ] document the graphql queries/fragments the ponder custom indexer needs to implement
  - [ ] collection queries to support scraper
  - [ ] well-known queries
  - [ ] document verification architecture implementation
- [ ] gut check results of resolver index against subgraph up to block 12m
- [x] implement ethRegistry
- [ ] implement nameWrapper
- [ ] ? implement upserts in nameWrapper to support later startblocks for testing?
#### known bugs

- [ ] there's an account `0x` in the database, which is definitely a bug — perhaps all addresses should go through `viem/getAddress` before being handled (presumably ponder did this inthe background...)
- [ ] root domain is not migrated, probably should be

#### next up

- [ ] implement checkpointing for faster devx
- [ ] implement/verify nameWrapper
- [ ] confirm all the schema relations are configured correctly
- [ ] better understand reverse resolution & how that pertains to L2 primary names and impacts the future schema, etc
- [ ] subgraph graphql implementation within ponder
  - [ ] implement subgraph-style pagination api
  - [ ] support the well-known queries below
  - [ ] support collection queries as well, to power scraping diff tool
- [ ] CI/CD with indexing?
  - more recent endlbock for gut checks
- [ ] there's an account `0x` in the database, which is definitely a bug — perhaps all addresses should go through `viem/getAddress` before being handled (presumably ponder did this inthe background...)
- [ ] run the relevant tests from ensjs against our indexer to increase confidence
  - probably requires a fork of ensjs, update the publicClient instantiation, and scope tests to that dir
- [ ] integrate rainbow tables for label healing
  - load the table dump into pglite (or just postgres) & query synchronously to match existing behavior
  - https://github.com/graphprotocol/ens-rainbow
- [ ] implement CI/CD
  - likely best to wait until historical log cache is speedy

## confidence

a strategy to obtain confidence in the ponder implementation, since subgraph is percieved as source of truth

1. first implement subgraph 1:1, noting any improvements along the way
2. find those 10 key queries from ensjs & ens-app-v3 and write a script that can query the subgraph for those 10 queries at n different blockheights for m different relevant nodes, saving those snapshots to disk
3. a diff script that executes the same queries against ponder and compares the results
4. once we have that script fully passing we can branch the codebase and start refactoring the indexing logic.
5. if we'd like to maintain 1:1 consistency we can ensure that any changes still pass that diff script, or we can decide to deviate from that datamodel and design the api from scratch, perhaps to match the new schema more closely

## well-known queries

### from ensjs

- [`getDecodedName`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getDecodedName.ts) — Gets the full name for a name with unknown labels from the subgraph
  - basically: attempts to heal any encoded labels in a provided name using the subgraph
  - if name is fully decoded, return
  - split name into `n` labels
  - for all encoded labels (`[label]`), find all domains by `id`
    - hilariously this queries subgraph with `n` `domains(first: 1, where: { id: $label })` queries
  - also queries `domain(id: namehash(name))` but i'm not sure why, as it effectively duplicates the above label queries
  - in our ideal indexer, this query is replaced with a single `domain(id: namehash(name))` because the api would handle the full extent of the healing logic
- [`getNameHistory`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNameHistory.ts)
  - basically just all the events associated with a name
- [`getNamesForAddress`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNamesForAddress.ts)
  - gets all names related to an address via address=registrant,address=owner,address=wrappedOwner,address=resolvedAddress
  - supports `searchString`
  - supports filter by (current) expiry, by reverse records, by 'empty' domains
  - supports order by expiry date, name, labelName, createdAt
  - [expiryDate order by](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/filters.ts#L707) is an absolutely insane construction
  - supports pagination by constructing additional where clauses to exclude previous results
- [`getSubgraphRecords`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getSubgraphRecords.ts) — Gets the records for a name from the subgraph
  - pretty straightforward, allows querying by specific resolver id
- [`getSubgraphRegistrant`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getSubgraphRegistrant.ts) — Gets the name registrant from the subgraph.
  - only supports eth 2ld
- [`getSubnames`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getSubnames.ts) — Gets the subnames for a name
  - supports `searchString`
  - supports filter by (current) expiry, by 'empty' domains
  - supports order by expiry date, name, labelName, createdAt
  - supports pagination by constructing additional where clauses to exclude previous results

### from ens-app-v3

- [`useResolverExists`](https://github.com/ensdomains/ens-app-v3/blob/328692ae832618f8143916c143b7e4cb9e520811/src/hooks/useResolverExists.ts#L27) — straightforward resolver existence check
- [`useRegistrationData`](https://github.com/ensdomains/ens-app-v3/blob/328692ae832618f8143916c143b7e4cb9e520811/src/hooks/useRegistrationData.ts#L31) — registration by id and nameRegistered events


### notes

confidence-building options

1. postgres dump diff tool
  - could host ponder/graph-node dumps for people to verify on their own
2. rip everything from thge subgraph at block `n` and use as a snapshot, do the same to ponder & diff
3. proxies diff tool + run well-known apps to capture live queries & diff in realtime
4. fully passing ensjs & ens-app-v3 test suite against our indexer is a requirement

- unable to automatically identify subname registries via onchain event, CCIP standard dosn't include any info about data source, so we'll need to encode manually for now
- ENSIP - shared interface for subdomain registrars
- ENSIP — standard for how a resolver on L1 can (optionally) emit an event specifying contract on an L2 that it proxies records from
  - optional, in the popular case of L2-managed subnames
  - removes centralized dependency on the CCIP Gateway
  - flaky test experience with .cb.id name gateway
  - also helps indexer discovery

- eth registry is ERC721, has many controllers (), no knowledge of pricing — delegated to registrar controllers
- eth old registry & new registry migration due to security issue, new then fallback to old, therefore ignore all old evens on domains that have been seen by new registry


## improvement notes

### architecture

```
┌──────────────────────────────────────────┐
│                   API                    │
└──────────┬──────────────┬────────────────┘
           │              │                │
┌──────────▼─┐  ┌────────▼───┐  ┌────────▼────────┐
│   Ponder   │  │ Label Heal │  │    CCIP Read    │
└────────────┘  └────────────┘  └─────────────────┘
```

basically an API server that stitches together these data sources to enable the more realtime/dynamic aspects of this data. label healing information changes all the time, CCIP reads are off-chain data, etc. the api layer implements a cache for both the label healing and ccip read sources for performant loads but relatively fresh reads


## label healing service

this service would ideally run its own ponder indexer that tracks healed labels emitted on-chain, as well as other data sources (rainbow tables, etc) and provides those as an api. it should

- tracks on-chain sources of healed names
- embeds existing rainbow tables
- embeds/tracks/sources any other source of healed names
- ignores any healed name with a null byte
  - TL;DR: postgres doesn't store null bytes, so should ignore any healed labels that include a null byte
  - https://ens.mirror.xyz/9GN77d-MqGvRypm72FcwgxlUnPSuKWhG3rWxddHhRwM
- stores a list of all possible healed names, regardless of normalization status
- (cron? on-demand?) iterate all yet-normalized names in the db, if is normalized, store in rainbow table of `hash -> healed`
- provide rainbowtable lookups to api service

this structure is because normalization changes over time, so set of valid healed names changes over time. any normalized name will never become invalid (in theory), so once added the the rainbow table it can live there forever. if this assumption is every incorrect, once can triviually re-index the healed names list to generate the rainbowtable

## indexer improvement notes

the 'empty' domains should be handled more accurately, depending on how important serving empty domains is for people.

- `Domain#subdomainCount` could/should be a computed property by count(children of parent)
  - removes need to recursively update parent records during domain delete
  - removes need to increment during domain creation
  - new impl likely needs to exclude 'empty' domains (see registry notes for context)

various resources use both null and zeroAddress to indicate emptiness, this is horrible and creates numerous checks like [this](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNamesForAddress.ts#L255) where they check for `!== NULL && !== zeroAddress`

### ens indexing plugin

l2 ens deployments are very similar — write plugin to make configuring source addresses easy and pass node that domains in these handlers are implicitly parented to (assuming that l2 deployments make nodes against the NAMEHASH_ZERO i.e. every name is basically a 2LD)

### registry

- in `Registry:NewOwner`, the event emits `node` and `label`, `node` should be named `parent` and the computed subnode should be named `node` or `domain`
- empty domains aren't actually deleted from the index, but if a domain is empty the parent's subdomain count is reduced appropriately. options:
  1. if historical info not important (still available by blockheight queries), domains should be deleted, and `subdomainCount` computed with a simple count query
  2. if domain existance is necesssary, make `subdomainCount` computed with a where clause to exclude 'empty' domains
  3. if filters against subdomainCount are necessary, maybe the current logic works just fine

### label healing

label healing should be implemented outside of the indexer (see architecture above). this means removing the relevant fields (`name`, `labelName`) from the indexing schema and removing the label healing code in `Registry.ts`

iff filters against the healed name need to be supported, the cache can be persisted to the same postgres to support performant joins against indexer data

### resolver

- the local `Resolver` resource should be keyed by `CAIP-10 ID`, not pairwise ala subgraph, to match on-chain datamodel
  - the handlers should persist all keys and values emitted by the resolver in `Records`
  - the `Record` model stores (`node`, `key`, `value`) and is keyed by (`resolverId`, `node`, `key`)
  - on active resolver change, simply point the domain's `resolverId` to the resolver's address
  - any domain's records are computed through the current `resolverId` and querying

any resolver that implements the CCIP Read standard will have to have its records implemented at the API layer which can stitch the indexed data with realtime offchain data via CCIP Reads. if we don't want to implement the CCIP Read proxy as part of this unified api, the api should know if a Resolver defers to CCIP and communicate that effectively in the response so that clients can do it themselves.

in the subgraph implementation, resolver handlers must upsert resolvers because people can set records etc for a node that has not (yet) specified this resolver as active, meaning the create in `Registry:NewResolver` has yet to fire. in the ideal scenario, this lookup is keyed only by `(chainId, address)` and we can use pure updates instead of an upsert

### registrar

the subgraph implements all of the BaseRegistrar, EthRegistrarController, and EthRegistrarControllerOld logic together

### api

- the subgraph schema has a few fields an `Account` but clients probably only want the account's address, so we might as well just store the string there instead of making it a reference. clients incur some effort flattening the returned strucutre: https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNameHistory.ts#L223

