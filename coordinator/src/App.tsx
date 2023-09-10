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
  };
}) {
  const reset = useMutation(api.deployments.reset);
  return (
    <tr>
      <td>{deployment.deploymentName}</td>
      <td>{deployment.identifier}</td>
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

  const addNew = useMutation(api.deployments.add);
  const handleClick = async () => {
    await addNew({
      deploymentKey,
      deploymentName,
      deploymentSecret,
    });
    setDeploymentName("");
    setDeploymentKey("");
    setDeploymentSecret("");
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
      <div>{`${deployments.unclaimed.length} free preview deployments`}</div>
      <div>
        <div>{`${deployments.claimed.length} claimed preview deployments`}</div>
        <table>
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
      <AddNew />
    </div>
  );
}

export default App;
