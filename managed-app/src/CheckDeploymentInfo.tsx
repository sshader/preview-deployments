import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Ensure this UI is talking to the correct backend
// Wrap any part of the app that talks to Convex in this (e.g. right below the ConvexProvider)
export default function CheckDeploymentInfo({
  children,
}: {
  children: React.ReactNode;
}) {
  const check = useQuery(api.checkInfo.default, {
    identifier: import.meta.env.VITE_DEPLOYMENT_IDENTIFIER ?? "",
    hash: import.meta.env.VITE_DEPLOYMENT_HASH ?? "",
  });
  if (check?.error) {
    throw new Error(check.error);
  }
  return <>{children}</>;
}
