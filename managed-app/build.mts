import { JSONValue } from "convex/values";
import { execSync } from "node:child_process";

const makeConvexRequest = async (args: {
  deploymentName: string;
  deploymentSecret: string;
  endpoint: string;
  body: JSONValue;
}) => {
  const url = new URL(
    `https://${args.deploymentName}.convex.site/${args.endpoint}`
  );
  url.searchParams.append("sk", args.deploymentSecret);
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args.body),
    headers: { "content-type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${await response.text()}`);
  }
  return response;
};

const buildForPreview = async () => {
  console.info("Claiming deployment");
  const identifier = process.env.VERCEL_GIT_COMMIT_REF;
  const hash = process.env.VERCEL_GIT_COMMIT_SHA;
  const previewUrl = process.env.VERCEL_BRANCH_URL;
  const claimResponse = await makeConvexRequest({
    deploymentName: process.env.CONVEX_COORDINATOR_DEPLOYMENT_NAME!,
    deploymentSecret: process.env.CONVEX_COORDINATOR_SECRET_KEY!,
    body: {
      identifier,
      previewUrl,
    },
    endpoint: "claim",
  });

  const claimedDeploymentInfo: {
    deploymentName: string;
    deploymentKey: string;
    deploymentSecret: string;
  } = await claimResponse.json();
  const { deploymentName, deploymentKey, deploymentSecret } =
    claimedDeploymentInfo;

  console.info(`Setting up instance ${deploymentName}`);
  await makeConvexRequest({
    deploymentName,
    deploymentSecret,
    body: { identifier, hash },
    endpoint: "setup",
  });

  console.info(`Deploying convex functions to ${deploymentName}`);
  execSync(
    `CONVEX_DEPLOYMENT='${deploymentName}' CONVEX_DEPLOY_KEY='${deploymentKey}' npx convex deploy`
  );

  console.info(`Setting up seed data on ${deploymentName}`);
  await makeConvexRequest({
    deploymentName,
    deploymentSecret,
    body: {},
    endpoint: "seed",
  });

  console.log("Building frontend");
  execSync(
    `CONVEX_URL='https://${deploymentName}.convex.cloud' DEPLOYMENT_IDENTIFIER='${process.env.VERCEL_GIT_COMMIT_REF}' DEPLOYMENT_HASH='${process.env.VERCEL_GIT_COMMIT_SHA}' vite build`
  );
};

const main = async () => {
  if (process.env.VERCEL_ENV === "preview") {
    await buildForPreview();
  } else if (process.env.VERCEL_ENV === "production") {
    execSync("npx convex deploy && vite build");
  } else {
    throw new Error(`Unhandled Vercel environment: ${process.env.VERCEL_ENV}`);
  }
};

main();
