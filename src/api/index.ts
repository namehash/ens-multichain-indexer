import { ponder } from "ponder:registry";

import { graphql as ponderGraphQL } from "ponder";
import { graphql as subgraphGraphQL } from "./middleware";

// use ponder middleware at root
ponder.use("/", ponderGraphQL());

// use our custom graphql middleware at /subgraph
ponder.use("/subgraph", subgraphGraphQL());
