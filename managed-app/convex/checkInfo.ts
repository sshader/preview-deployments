import { v } from "convex/values";
import { query } from "./_generated/server";
import { PreviewInfoTableName } from "./schema";

export default query({
  args: {
    identifier: v.string(),
    hash: v.string(),
  },
  handler: async (ctx, args) => {
    const previewInfo = await ctx.db.query(PreviewInfoTableName).first();
    if (previewInfo === null) {
      // This isn't a preview instance so just return
      return { success: "success" };
    }
    if (previewInfo.identifier !== args.identifier) {
      return {
        error: "This deployment isn't configured to preview this branch",
      };
    } else if (previewInfo.hash !== args.hash) {
      return {
        error:
          "This deployment is configured to preview this branch, but not this hash",
      };
    } else if (previewInfo.status !== "ready") {
      return {
        error: "This deployment isn't ready for preview yet.",
      };
    }
    return { success: "success" };
  },
});
