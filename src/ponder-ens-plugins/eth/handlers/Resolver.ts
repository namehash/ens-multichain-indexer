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
import { ns } from "../ponder.config";

export default function () {
  // Old registry handlers
  ponder.on(ns("OldRegistryResolvers:AddrChanged"), handleAddrChanged);
  ponder.on(ns("OldRegistryResolvers:AddressChanged"), handleAddressChanged);
  ponder.on(ns("OldRegistryResolvers:NameChanged"), handleNameChanged);
  ponder.on(ns("OldRegistryResolvers:ABIChanged"), handleABIChanged);
  ponder.on(ns("OldRegistryResolvers:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    ns(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    ns(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(ns("OldRegistryResolvers:ContenthashChanged"), handleContenthashChanged);
  ponder.on(ns("OldRegistryResolvers:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(ns("OldRegistryResolvers:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(ns("OldRegistryResolvers:VersionChanged"), handleVersionChanged);
  ponder.on(ns("OldRegistryResolvers:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(ns("OldRegistryResolvers:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(ns("OldRegistryResolvers:DNSZonehashChanged"), handleDNSZonehashChanged);

  // New registry handlers
  ponder.on(ns("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(ns("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(ns("Resolver:NameChanged"), handleNameChanged);
  ponder.on(ns("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(ns("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    ns("Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)"),
    handleTextChanged,
  );
  ponder.on(
    ns(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(ns("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(ns("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(ns("Resolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(ns("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(ns("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(ns("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(ns("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
