import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/claim",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const sk = new URL(request.url).searchParams.get("sk");
    if (sk !== process.env.SECRET_KEY) {
      return new Response("Invalid secret key", { status: 403 });
    }
    const body: { identifier: string; previewUrl: string } =
      await request.json();
    const result = await ctx.runMutation(internal.deployments.claim, {
      identifier: body.identifier,
      previewUrl: `https://${body.previewUrl}`,
    });
    if (result === null) {
      return new Response("no instance available", { status: 400 });
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
});

export default http;
