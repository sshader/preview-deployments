import "./App.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState } from "react";

function PreviewDeployment({
  deployment,
}: {
  deployment: {
    _id: Id<"DeploymentInfo">;
    deploymentName: string;
    identifier: string | null;
    lastUpdatedTime: number;
    dashboardUrl: string;
    previewUrl: string | null;
  };
}) {
  const reset = useMutation(api.deployments.reset);
  return (
    <tr>
      <td>
        <a href={deployment.dashboardUrl} target="_blank">
          {deployment.deploymentName}
        </a>
      </td>
      <td>
        <a href={deployment.previewUrl!} target="_blank">
          {deployment.identifier}
        </a>
      </td>
      <td>{new Date(deployment.lastUpdatedTime).toLocaleString()}</td>
      <td>
        <button onClick={() => void reset({ id: deployment._id })}>
          Reset
        </button>
      </td>
    </tr>
  );
}

function AddNew() {
  const [deploymentName, setDeploymentName] = useState("");
  const [deploymentKey, setDeploymentKey] = useState("");
  const [deploymentSecret, setDeploymentSecret] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState("");

  const addNew = useMutation(api.deployments.add);
  const handleClick = async () => {
    await addNew({
      deploymentKey,
      deploymentName,
      deploymentSecret,
      dashboardUrl,
    });
    setDeploymentName("");
    setDeploymentKey("");
    setDeploymentSecret("");
    setDashboardUrl("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <input
        placeholder={"Deployment name..."}
        value={deploymentName}
        onChange={(event) => setDeploymentName(event.target.value)}
      ></input>
      <input
        placeholder={"Deployment key..."}
        value={deploymentKey}
        onChange={(event) => setDeploymentKey(event.target.value)}
      ></input>
      <input
        placeholder={"Deployment secret..."}
        value={deploymentSecret}
        onChange={(event) => setDeploymentSecret(event.target.value)}
      ></input>
      <input
        placeholder={"Dashboard URL..."}
        value={dashboardUrl}
        onChange={(event) => setDashboardUrl(event.target.value)}
      ></input>
      <button onClick={() => void handleClick()}>Add new deployment</button>
    </div>
  );
}

function App() {
  const deployments = useQuery(api.deployments.list);

  if (deployments == undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h1>{`Free preview deployments: ${deployments.unclaimed.length}`}</h1>
      <div>
        <h1>{`Claimed preview deployments: ${deployments.claimed.length}`}</h1>
        <table style={{ width: "80vw" }}>
          <tr>
            <th>Deployment name</th>
            <th>Branch name</th>
            <th>Last updated</th>
          </tr>
          {deployments.claimed.map((d) => {
            return <PreviewDeployment deployment={d} />;
          })}
        </table>
      </div>
      <div>
        <h1>Add new preview deployment:</h1>
        <AddNew />
      </div>
    </div>
  );
}

export default App;
