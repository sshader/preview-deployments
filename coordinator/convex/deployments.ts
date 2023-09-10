import { v } from "convex/values";
import {
  MutationCtx,
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const claim = internalMutation({
  args: {
    identifier: v.string(),
    previewUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existingDeploymentOrNull = await ctx.db
      .query("DeploymentInfo")
      .filter((q) => q.eq(q.field("identifier"), args.identifier))
      .unique();
    if (existingDeploymentOrNull !== null) {
      await ctx.db.patch(existingDeploymentOrNull._id, {
        previewUrl: args.previewUrl,
        lastUpdatedTime: Date.now(),
      });
      return {
        deploymentName: existingDeploymentOrNull.deploymentName,
        deploymentKey: existingDeploymentOrNull.deploymentKey,
        deploymentSecret: existingDeploymentOrNull.deploymentSecret,
      };
    }
    const availableDeployment = await ctx.db
      .query("DeploymentInfo")
      .filter((q) => q.eq(q.field("identifier"), null))
      .first();
    if (availableDeployment === null) {
      // No deployment available
      return null;
    }
    await ctx.db.patch(availableDeployment._id, {
      identifier: args.identifier,
      previewUrl: args.previewUrl,
      lastUpdatedTime: Date.now(),
    });
    return {
      deploymentName: availableDeployment.deploymentName,
      deploymentKey: availableDeployment.deploymentKey,
      deploymentSecret: availableDeployment.deploymentSecret,
    };
  },
});

export const reset = mutation({
  args: {
    id: v.id("DeploymentInfo"),
  },
  handler: async (ctx, args) => {
    return resetImpl(ctx, args.id);
  },
});

export const resetImpl = async (ctx: MutationCtx, id: Id<"DeploymentInfo">) => {
  const instanceInfo = await ctx.db.get(id);
  if (instanceInfo === null) {
    throw new Error("Couldn't find InstanceInfo");
  }
  await ctx.scheduler.runAfter(0, internal.deployments.resetAction, {
    id,
    instanceName: instanceInfo.deploymentName,
    deploymentKey: instanceInfo.deploymentKey,
    deploymentSecret: instanceInfo.deploymentSecret,
  });
};

export const markReset = internalMutation({
  args: { id: v.id("DeploymentInfo") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      identifier: null,
      previewUrl: null,
      lastUpdatedTime: Date.now(),
    });
  },
});

export const resetAction = internalAction({
  args: {
    id: v.id("DeploymentInfo"),
    instanceName: v.string(),
    deploymentKey: v.string(),
    deploymentSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const url = new URL(`https://${args.instanceName}.convex.site/reset`);
    url.searchParams.append("sk", args.deploymentSecret);
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Failed to reset instance: ${await response.text()}`);
    }
    await ctx.runMutation(internal.deployments.markReset, { id: args.id });
  },
});

export const add = mutation({
  args: {
    deploymentName: v.string(),
    deploymentKey: v.string(),
    deploymentSecret: v.string(),
    dashboardUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("DeploymentInfo", {
      ...args,
      identifier: null,
      previewUrl: null,
      lastUpdatedTime: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx, _args) => {
    const deployments = await ctx.db.query("DeploymentInfo").collect();
    const unclaimed = [];
    const claimed = [];
    deployments.sort((a, b) => a.lastUpdatedTime - b.lastUpdatedTime);
    for (const deployment of deployments) {
      const redacted = {
        _id: deployment._id,

        deploymentName: deployment.deploymentName,
        dashboardUrl: deployment.dashboardUrl,

        identifier: deployment.identifier,
        previewUrl: deployment.previewUrl,

        lastUpdatedTime: deployment.lastUpdatedTime,
      };
      if (deployment.identifier === null) {
        unclaimed.push(redacted);
      } else {
        claimed.push(redacted);
      }
    }
    return {
      claimed,
      unclaimed,
    };
  },
});

export const maybeClear = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const unclaimed = await ctx.db
      .query("DeploymentInfo")
      .filter((q) => q.eq(q.field("identifier"), null))
      .first();
    if (unclaimed !== null) {
      return;
    }
    const deployments = await ctx.db.query("DeploymentInfo").collect();
    deployments.sort((a, b) => b.lastUpdatedTime - a.lastUpdatedTime);
    const leastRecentlyUpdated = deployments[0];
    return resetImpl(ctx, leastRecentlyUpdated._id);
  },
});
