# preview-deployments

This is a way of building vercel preview deployments for Convex apps.

To set up preview deployments for a Convex app called `my-app` we'll need the following:

- A Convex project running `my-app`
- A Coordinator deployment (running the code `coordinator`)
- A pool of deployments to use for previews (e.g. a separate project called `my-app-previews`)

One way to set this up would be creating the `my-app-previews` project, using the dev deployments for previews
and using the prod deployment as the coordinator.

## How it works

This works by configuring the vercel build command to ask the Coordinator for a Convex deployment chosen from the pool of preview deployments.

The Coordinator interacts with the Convex preview deployments by calling HTTP endpoints with a secret key (stored by the Coordinator) and using the deploy key (also stored by the Coordinator) to `npx convex deploy`.

The number of preview deployments running at a given time is limited by the total size of the pool. Deployments can be freed up for use by running the `reset` mutation (or from the Coordinator UI).

Convex deployments in the pool get reused across branches, but get wiped of all their data, pushed with new code, and seeded with initial data.

Additionally, we ensure that a preview UI never runs against a Convex backend running a different version of code (e.g. from opening an old preview link when the Convex deployment has been reset).

## How to set up

### Coordinator:

- `npx convex deploy` the code in `coordinator` to a Convex deployment (e.g. the prod deployment in `my-apps-preview`)
- [optional] Host the UI for managing this, or just use the Convex dashboard
- Generate an unguessable key (e.g. uuid, random string) and set an env variable called `SECRET_KEY`

### `my-app`:

The `my-app` codebase should be modified to support a few operations. An example of how to do this is in `managed-app`:

- Add a `PreviewInfo` table to the schema
- Add a `checkInfo` query
- Add `CheckDeploymentInfo` at the root of the app
- Add the functions in `seed.ts` to clear data and add new seed data
- Add the HTTP endpoints in `http.ts` gated by a secret key
- Add a build script similar to `build.mts`

### Vercel:

Under Settings > Environment Variables:

- Set the `CONVEX_COORDINATOR_DEPLOYMENT_NAME` and `CONVEX_COORDINATOR_SECRET_KEY` variables to the Coordinator's deployment name and secret key for _preview only_
- Ensure no other Convex environment variables are set for preview
- Ensure Vercel system environment variables are exposed

Under Settings > General:

- Override the build command to run the `build.mts` script
  (e.g. `ts-node --esm build.mts`)

### Adding deployments:

To add a preview deployment to the pool of preview deployments:

- Push the `my-app` codebase to a Convex instance (e.g. `npx convex dev --configure` and selecting an instance in `my-app-previews`)
- In the dashboard (`npx convex dashboard`), generate a deploy key for the instance.
- Generate an unguessable secret key and set it as the `SECRET_KEY` environment variable
- Add a document to the `PreviewInfo` table: `{ identifier: null, hash: null, status: "unclaimed" }`
- Add a document to the _Coordinator_ deployment (either from the custom UI or in the dashboard) -- use the deployment name, deployment key, and secret key
