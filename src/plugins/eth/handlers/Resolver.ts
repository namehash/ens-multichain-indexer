import { ponder } from "ponder:registry";
import {
  handleABIChanged,
  handleAddrChanged,
  handleAddressChanged,
  handleAuthorisationChanged,
  handleContenthashChanged,
  handleDNSRecordChanged,
  handleDNSRecordDeleted,
  handleDNSZonehashChanged,
  handleInterfaceChanged,
  handleNameChanged,
  handlePubkeyChanged,
  handleTextChanged,
  handleVersionChanged,
} from "../../../handlers/Resolver";
import { pluginNamespace } from "../ponder.config";

export default function () {
  ponder.on(pluginNamespace("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(pluginNamespace("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(pluginNamespace("Resolver:NameChanged"), handleNameChanged);
  ponder.on(pluginNamespace("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(pluginNamespace("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    pluginNamespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    pluginNamespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(pluginNamespace("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(pluginNamespace("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(pluginNamespace("Resolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(pluginNamespace("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(pluginNamespace("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(pluginNamespace("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(pluginNamespace("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
