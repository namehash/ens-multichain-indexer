# ENSNode

> a multichain ENS indexer, powered by Ponder

## Quick start

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
  - It's recommended you install Node.js through [nvm](https://github.com/nvm-sh/nvm) (see link for installation instructions).
  - To ensure you're running the expected version of Node.js run `nvm install` in the root of the repository (after you clone it).
  - Node.js will automatically install `corepack`. You should also ensure Corepack is enabled by running `corepack enable`.
- [pnpm](https://pnpm.io/)
  - Run `npm install -g pnpm` or see [other installation options](https://pnpm.io/installation).
  - To ensure you're running the expected version of pnpm run `corepack use pnpm` in the root of the repository (after you clone it).

### Run the indexer

Clone this repository:
```
git clone git@github.com:namehash/ens-multichain-indexer.git
cd ens-multichain-indexer
```

Install dependencies:
```
pnpm install
```

Configure for your local environment:
```
cp .env.local.example .env.local
```
then review the docs inside your .env.local file for configuration instructions.

- `ACTIVE_PLUGIN` — set the plugin name you’d like to activate (`eth`, `base.eth`, or `linea.eth`). The activated plugin determines which contracts and chains are indexed. Currently only a single plugin can be activated at a time. Soon we will remove this constraint to allow multiple plugins to be activated concurrently.
- `RPC_URL_*` — optional, but you can use private ones to speed the syncing process up
- `DATABASE_SCHEMA` is arbitrary, with the limitations mentioned in the linked documentation
- `DATABASE_URL` is your postgres database connection string

Once your `.env.local` is configured, launch the indexer by running:
- `pnpm ponder dev` for development mode,
- `pnpm ponder start` for production mode.

To learn more about those commands, go to https://ponder.sh/docs/api-reference/ponder-cli#dev

## Overview

### `eth` plugin

estimated backfill time @ 50rps = 24-36 hours on M1 Macbook (~10x speedup)

### goals

> an optimized, multichain ens indexer that the community loves and integrates

- ease of deployment for indiviudals to run their own infra
- faster, more efficient, easier to use and deploy implementation
- v1 — **high confidence in subgraph equivalency**
  - 1:1 equivalency of results for queries via ensjs
    - 100% ensjs, ens-app-v3 test suites passing
    - should 'just work', following [this documentation](https://github.com/ensdomains/ensjs/blob/main/docs/basics/custom-subgraph-uris.md)
  - ensjs equivalency confirmed via [ens-subgraph-transition-tools](https://github.com/namehash/ens-subgraph-transition-tools)
- v2 — **optimized multichain indexer w/ unified namespace**
  - true multichain indexing (mainnet, base, linea, etc)
  - flattened, unified, multichain namespace
  - support key ens-app-v3 and wallet ENS funtions via optimized resolvers & PRs
  - high quality human-readable (healed) list of names by owner, necessary for many UX
  - (possible) continued backwards compatibility with subgraph
  - support indexing subset of data, i.e. only domains under parent node

#### next up

- [ ] confirm all the schema relations are configured correctly
- [ ] integrate rainbow tables for label healing
  - load the table dump into pglite (or just postgres) & query synchronously to match existing behavior
  - https://github.com/graphprotocol/ens-rainbow
- [ ] subgraph graphql implementation within ponder
  - [ ] implement subgraph-style pagination api
  - [ ] support the well-known queries in `GRAPHQL.md`
  - [ ] support collection queries as well, to power `snapshot-eq`
- [ ] CI/CD with indexing?
  - more recent endlbock for gut checks
- [ ] better understand reverse resolution & how that pertains to L2 primary names and impacts the future schema, etc

### notes

- eth registry is ERC721, has many controllers (), no knowledge of pricing — delegated to registrar controllers
- eth old registry & new registry migration due to security issue, new then fallback to old, therefore ignore all old evens on domains that have been seen by new registry

### ENSIP Ideas

- unable to automatically identify subname registries via onchain event, CCIP standard dosn't include any info about data source, so we'll need to encode manually for now
- ENSIP - shared interface for subdomain registrars
- ENSIP — standard for how a resolver on L1 can (optionally) emit an event specifying contract on an L2 that it proxies records from
  - optional, in the popular case of L2-managed subnames
  - removes centralized dependency on the CCIP Gateway
  - flaky test experience with .cb.id name gateway
  - also helps indexer discovery
