import { deepMergeRecursive } from "./src/lib/helpers";
import { type IntersectionOf, getActivePlugins } from "./src/lib/plugin-helpers";
import * as baseEthPlugin from "./src/plugins/base.eth/ponder.config";
import * as ethPlugin from "./src/plugins/eth/ponder.config";
import * as lineaEthPlugin from "./src/plugins/linea.eth/ponder.config";

// list of all available plugins
// any of them can be activated in the runtime
const plugins = [baseEthPlugin, ethPlugin, lineaEthPlugin] as const;

// intersection of all available plugin configs to support correct typechecking
// of the indexing handlers
type AllPluginConfigs = IntersectionOf<(typeof plugins)[number]["config"]>;

// Activates the indexing handlers of activated plugins and
// returns the intersection of their combined config.
function getActivePluginConfigs(): AllPluginConfigs {
  const activePlugins = getActivePlugins(plugins);

  // load indexing handlers from the active plugins into the runtime
  activePlugins.forEach((plugin) => plugin.activate());

  const config = activePlugins
    .map((plugin) => plugin.config)
    .reduce((acc, val) => deepMergeRecursive(acc, val), {} as AllPluginConfigs);

  return config as AllPluginConfigs;
}

// The type of the default export is the intersection of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default getActivePluginConfigs();
