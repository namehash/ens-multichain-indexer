import { ponder } from "ponder:registry";
import {
  handleABIChanged,
  handleAddrChanged,
  handleAddressChanged,
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
  // New registry handlers
  ponder.on(ns("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(ns("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(ns("Resolver:NameChanged"), handleNameChanged);
  ponder.on(ns("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(ns("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(ns("Resolver:TextChanged"), handleTextChanged);
  ponder.on(ns("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(ns("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(ns("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(ns("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(ns("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(ns("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
