import { onchainTable, relations } from "ponder";
import type { Address } from "viem";

export const domain = onchainTable("domains", (t) => ({
  // The namehash of the name
  id: t.hex().primaryKey(),
  // The human readable name, if known. Unknown portions replaced with hash in square brackets (eg, foo.[1234].eth)
  name: t.text(),
  // The human readable label name (imported from CSV), if known
  labelName: t.text("label_name"),
  // keccak256(labelName)
  labelhash: t.hex(),
  // The namehash (id) of the parent name
  parentId: t.hex(),

  // The number of subdomains
  subdomainCount: t.integer("subdomain_count").notNull().default(0),

  // Address logged from current resolver, if any
  resolvedAddressId: t.hex("resolved_address_id"),

  // The resolver that controls the domain's settings
  resolverId: t.text(),

  // The time-to-live (TTL) value of the domain's records
  ttl: t.bigint(),

  // Indicates whether the domain has been migrated to a new registrar
  isMigrated: t.boolean("is_migrated").notNull().default(false),
  // The time when the domain was created
  createdAt: t.bigint("created_at").notNull(),

  // The account that owns the domain
  ownerId: t.hex("owner_id").notNull(),
  // The account that owns the ERC721 NFT for the domain
  registrantId: t.hex("registrant_id"),
  // The account that owns the wrapped domain
  wrappedOwnerId: t.hex("wrapped_owner_id"),

  // The expiry date for the domain, from either the registration, or the wrapped domain if PCC is burned
  expiryDate: t.bigint("expiry_date"),

  // "The events associated with the domain"
  // events: [DomainEvent!]! @derivedFrom(field: "domain")
}));

export const domainRelations = relations(domain, ({ one, many }) => ({
  resolvedAddress: one(account, {
    fields: [domain.resolvedAddressId],
    references: [account.id],
  }),
  owner: one(account, {
    fields: [domain.ownerId],
    references: [account.id],
  }),
  parent: one(domain, {
    fields: [domain.parentId],
    references: [domain.id],
  }),
  resolver: one(resolver, {
    fields: [domain.resolverId],
    references: [resolver.id],
  }),
  subdomains: many(domain, { relationName: "parent" }),
  registrant: one(account, {
    fields: [domain.registrantId],
    references: [account.id],
  }),
  wrappedOwner: one(account, {
    fields: [domain.wrappedOwnerId],
    references: [account.id],
  }),

  // The wrapped domain associated with the domain
  wrappedDomain: one(wrappedDomain, {
    fields: [domain.id],
    references: [wrappedDomain.domainId],
  }),

  // The registration associated with the domain
  registration: one(registration, {
    fields: [domain.id],
    references: [registration.domainId],
  }),
}));

export const account = onchainTable("accounts", (t) => ({
  id: t.hex().primaryKey(),
}));

export const accountRelations = relations(account, ({ many }) => ({
  // account has many domains
  domains: many(domain),
  // TODO: has many wrapped domains
  // TODO: has many registrations
}));

export const resolver = onchainTable("resolvers", (t) => ({
  // The unique identifier for this resolver, which is a concatenation of the domain namehash and the resolver address
  id: t.text().primaryKey(),
  // The domain that this resolver is associated with
  domainId: t.hex("domain_id").notNull(),
  // The address of the resolver contract
  address: t.hex().notNull().$type<Address>(),

  // The current value of the 'addr' record for this resolver, as determined by the associated events
  addrId: t.hex("addr_id"),
  // The content hash for this resolver, in binary format
  contentHash: t.text("content_hash"),
  // The set of observed text record keys for this resolver
  // NOTE: we avoid .notNull.default([]) to match subgraph behavior
  texts: t.text().array(),
  // The set of observed SLIP-44 coin types for this resolver
  // NOTE: we avoid .notNull.default([]) to match subgraph behavior
  coinTypes: t.bigint("coin_types").array(),

  // TODO: has many events
}));

export const resolverRelations = relations(resolver, ({ one }) => ({
  addr: one(account, {
    fields: [resolver.addrId],
    references: [account.id],
  }),
  domain: one(domain, {
    fields: [resolver.domainId],
    references: [domain.id],
  }),
}));

export const registration = onchainTable("registrations", (t) => ({
  // The unique identifier of the registration
  id: t.hex().primaryKey(),
  // The domain name associated with the registration
  domainId: t.hex("domain_id").notNull(),
  // The registration date of the domain
  registrationDate: t.bigint("registration_date").notNull(),
  // The expiry date of the domain
  expiryDate: t.bigint("expiry_date").notNull(),
  // The cost associated with the domain registration
  cost: t.bigint(),
  // The account that registered the domain
  registrantId: t.hex("registrant_id").notNull(),
  // The human-readable label name associated with the domain registration
  labelName: t.text(),

  // The events associated with the domain registration
  // TODO: events
}));

export const registrationRelations = relations(registration, ({ one }) => ({
  domain: one(domain, {
    fields: [registration.domainId],
    references: [domain.id],
  }),
  registrant: one(account, {
    fields: [registration.registrantId],
    references: [account.id],
  }),
}));

export const wrappedDomain = onchainTable("wrapped_domains", (t) => ({
  // The unique identifier for each instance of the WrappedDomain entity
  id: t.hex().primaryKey(),
  // The domain that is wrapped by this WrappedDomain
  domainId: t.hex("domain_id").notNull(),
  // The expiry date of the wrapped domain
  expiryDate: t.bigint("expiry_date").notNull(),
  // The number of fuses remaining on the wrapped domain
  fuses: t.integer().notNull(),
  // The account that owns this WrappedDomain
  ownerId: t.hex("owner_id").notNull(),
  // The name of the wrapped domain
  name: t.text(),
}));

export const wrappedDomainRelations = relations(wrappedDomain, ({ one }) => ({
  domain: one(domain, {
    fields: [wrappedDomain.domainId],
    references: [domain.id],
  }),
  owner: one(account, {
    fields: [wrappedDomain.ownerId],
    references: [account.id],
  }),
}));
