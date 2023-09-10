import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";

export const claim = internalMutation({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const existingDeploymentOrNull = await ctx.db
      .query("DeploymentInfo")
      .filter((q) => q.eq(q.field("identifier"), args.identifier))
      .unique();
    if (existingDeploymentOrNull !== null) {
      await ctx.db.patch(existingDeploymentOrNull._id, {
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
    const instanceInfo = await ctx.db.get(args.id);
    if (instanceInfo === null) {
      throw new Error("Couldn't find InstanceInfo");
    }
    await ctx.scheduler.runAfter(0, internal.deployments.resetAction, {
      id: args.id,
      instanceName: instanceInfo.deploymentName,
      deploymentKey: instanceInfo.deploymentKey,
      deploymentSecret: instanceInfo.deploymentSecret,
    });
  },
});

export const markReset = internalMutation({
  args: { id: v.id("DeploymentInfo") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      identifier: null,
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
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("DeploymentInfo", {
      ...args,
      identifier: null,
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
        identifier: deployment.identifier,
        lastUpdatedTime: deployment.lastUpdatedTime,
        deploymentName: deployment.deploymentName,
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
