import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { Block } from "ponder";
import { type Hex, namehash } from "viem";
import { upsertAccount, upsertRegistration } from "../lib/db-helpers";
import { isLabelIndexable, makeSubnodeNamehash, tokenIdToLabel } from "../lib/subname-helpers";

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

/**
 * A factory function that returns Ponder indexing handlers for a specified subname.
 */
export const makeRegistrarHandlers = (ownedName: `${string}eth`) => {
  const ownedSubnameNode = namehash(ownedName);

  async function setNamePreimage(context: Context, name: string, label: Hex, cost: bigint) {
    if (!isLabelIndexable(name)) return;

    const node = makeSubnodeNamehash(ownedSubnameNode, label);
    const domain = await context.db.find(schema.domain, { id: node });

    // encode the runtime assertion here https://github.com/ensdomains/ens-subgraph/blob/master/src/ethRegistrar.ts#L101
    if (!domain) throw new Error("domain expected in setNamePreimage but not found");

    if (domain.labelName !== name) {
      await context.db
        .update(schema.domain, { id: node })
        .set({ labelName: name, name: `${name}.${ownedName}` });
    }

    await context.db.update(schema.registration, { id: label }).set({ labelName: name, cost });
  }

  return {
    get ownedSubnameNode() {
      return ownedSubnameNode;
    },

    async handleNameRegistered({
      context,
      event,
    }: {
      context: Context;
      event: {
        block: Block;
        args: { id: bigint; owner: Hex; expires: bigint };
      };
    }) {
      const { id, owner, expires } = event.args;

      await upsertAccount(context, owner);

      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(ownedSubnameNode, label);

      // TODO: materialze labelName via rainbow tables ala Registry.ts
      const labelName = undefined;

      await upsertRegistration(context, {
        id: label,
        domainId: node,
        registrationDate: event.block.timestamp,
        expiryDate: expires,
        registrantId: owner,
        labelName,
      });

      await context.db.update(schema.domain, { id: node }).set({
        registrantId: owner,
        expiryDate: expires + GRACE_PERIOD_SECONDS,
        labelName,
      });

      // TODO: log Event
    },

    async handleNameRegisteredByController({
      context,
      args: { name, label, cost },
    }: {
      context: Context;
      args: { name: string; label: Hex; cost: bigint };
    }) {
      await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewedByController({
      context,
      args: { name, label, cost },
    }: {
      context: Context;
      args: { name: string; label: Hex; cost: bigint };
    }) {
      await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewed({
      context,
      event,
    }: {
      context: Context;
      event: {
        args: { id: bigint; expires: bigint };
      };
    }) {
      const { id, expires } = event.args;

      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(ownedSubnameNode, label);

      await context.db.update(schema.registration, { id: label }).set({ expiryDate: expires });

      await context.db
        .update(schema.domain, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // TODO: log Event
    },

    async handleNameTransferred({
      context,
      args: { tokenId, to },
    }: {
      context: Context;
      args: {
        tokenId: bigint;
        from: Hex;
        to: Hex;
      };
    }) {
      await upsertAccount(context, to);

      const label = tokenIdToLabel(tokenId);
      const node = makeSubnodeNamehash(ownedSubnameNode, label);

      const registration = await context.db.find(schema.registration, { id: label });
      if (!registration) return;

      await context.db.update(schema.registration, { id: label }).set({ registrantId: to });

      await context.db.update(schema.domain, { id: node }).set({ registrantId: to });

      // TODO: log Event
    },
  };
};
