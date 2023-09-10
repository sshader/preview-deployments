import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("maybeClear", { hours: 1 }, internal.deployments.maybeClear);

export default crons;
