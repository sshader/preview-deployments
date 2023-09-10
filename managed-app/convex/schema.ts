import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Table name can be changed as desired
export const PreviewInfoTableName = "PreviewInfo";
export const previewInfoDef = {
  [PreviewInfoTableName]: defineTable({
    identifier: v.union(v.null(), v.string()),
    hash: v.union(v.null(), v.string()),
    status: v.union(
      v.literal("unclaimed"),
      v.literal("setting up"),
      v.literal("ready"),
      v.literal("tearing down")
    ),
  }),
};

export default defineSchema({
  // all other tables
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
  ...previewInfoDef,
});
