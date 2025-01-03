import {
  activate as activateBase,
  config as baseConfig,
} from "./src/ponder-ens-plugins/eth.base/ponder.config";
import {
  activate as activateEth,
  config as ethereumConfig,
} from "./src/ponder-ens-plugins/eth/ponder.config";

type AllConfigs = typeof ethereumConfig & typeof baseConfig;

// here we export only a single 'plugin's config, by type it as every config
// this makes all of the mapping types happy at typecheck-time, but only the relevant
// config is run at runtime
export default ((): AllConfigs => {
  switch (process.env.INDEX_ENS_ROOT_NODE) {
    case ".eth":
      activateEth();
      return ethereumConfig as AllConfigs;
    case ".base.eth":
      activateBase();
      return baseConfig as AllConfigs;
    default:
      throw new Error(`Unsupported INDEX_ENS_ROOT_NODE: ${process.env.INDEX_ENS_ROOT_NODE}`);
  }
})();
