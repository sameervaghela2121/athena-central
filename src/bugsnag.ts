import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import React from "react";

// Initialize Bugsnag
Bugsnag.start({
  apiKey: "01c0734d1092b784892e4d41699ff895", // Store API key in .env
  plugins: [new BugsnagPluginReact()],
});

// Create Bugsnag Error Boundary
const bugsnagReact = Bugsnag.getPlugin("react");
export const BugsnagErrorBoundary = bugsnagReact
  ? bugsnagReact.createErrorBoundary(React)
  : React.Fragment;
