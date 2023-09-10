import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  DeploymentInfo: defineTable({
    deploymentName: v.string(),
    deploymentKey: v.string(),
    deploymentSecret: v.string(),
    dashboardUrl: v.string(),

    identifier: v.union(v.null(), v.string()),
    previewUrl: v.union(v.null(), v.string()),

    lastUpdatedTime: v.number(),
  }),
});
