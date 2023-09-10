import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import schema, { PreviewInfoTableName } from "./schema";
import { TableNames } from "./_generated/dataModel";

export const addSeedData = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    await ctx.db.insert("tasks", {
      text: "Incomplete task",
      isCompleted: false,
    });
    await ctx.db.insert("tasks", {
      text: "Complete task",
      isCompleted: true,
    });
    const previewInfo = await ctx.db.query(PreviewInfoTableName).first();
    if (previewInfo !== null) {
      await ctx.db.patch(previewInfo._id, {
        status: "ready",
      });
    }
  },
});

export const clearData = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    // Clear all tables except PreviewInfoTableName
    for (const table of Object.keys(schema.tables)) {
      if (table === PreviewInfoTableName) {
        continue;
      }
      const docs = await ctx.db.query(table as TableNames).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }
    const previewInfo = await ctx.db.query(PreviewInfoTableName).first();
    if (previewInfo !== null && previewInfo.status === "tearing down") {
      await ctx.db.patch(previewInfo._id, {
        status: "unclaimed",
      });
    }
  },
});

export const updatePreviewInfoForClaim = internalMutation({
  args: {
    identifier: v.string(),
    hash: v.string(),
  },
  handler: async (ctx, args) => {
    const previewInfo = await ctx.db.query(PreviewInfoTableName).unique();
    if (previewInfo === null) {
      throw new Error("No preview info on preview instance");
    }
    if (previewInfo.identifier === args.identifier) {
      await ctx.db.patch(previewInfo._id, {
        hash: args.hash,
        status: "setting up",
      });
    } else {
      if (
        previewInfo.identifier !== null ||
        previewInfo.status !== "unclaimed"
      ) {
        throw new Error("Trying to claim instance that is already claimed");
      }
      await ctx.db.patch(previewInfo._id, {
        identifier: args.identifier,
        hash: args.hash,
        status: "setting up",
      });
    }
  },
});

export const resetPreviewInfo = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const previewInfo = await ctx.db.query(PreviewInfoTableName).unique();
    if (previewInfo === null) {
      throw new Error("No preview info on preview instance");
    }
    await ctx.db.patch(previewInfo._id, {
      identifier: null,
      hash: null,
      status: "tearing down",
    });
  },
});
