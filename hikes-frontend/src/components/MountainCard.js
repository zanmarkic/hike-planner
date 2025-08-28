import { Link } from "react-router-dom";

export default function MountainCard({ mountain }) {
  return (
    <div style={{ border: "1px solid black", margin: "10px", padding: "10px" }}>
      <h2>
        <Link to={`/mountain/${mountain.name}`}>{mountain.name}</Link>
      </h2>
      <p>{mountain.height} m</p>
    </div>
  );
}
