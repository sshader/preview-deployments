import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import CheckDeploymentInfo from "./CheckDeploymentInfo.tsx";
CheckDeploymentInfo;

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <CheckDeploymentInfo>
        <App />
      </CheckDeploymentInfo>
    </ConvexProvider>
  </React.StrictMode>
);
