import { ponder } from "ponder:registry";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
  setup,
} from "../../../handlers/Registry";
import { ns } from "../ponder.config";

export default function () {
  ponder.on(ns("Registry:setup"), setup);
  ponder.on(ns("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(ns("Registry:NewResolver"), handleNewResolver);
  ponder.on(ns("Registry:NewTTL"), handleNewTTL);
  ponder.on(ns("Registry:Transfer"), handleTransfer);
}
