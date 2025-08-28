import { useState } from "react";
import { HikeWizard } from "../components/HikeWizard"; // dodamo, ko naredimo wizard

export default function MountainDetails({ mountain }) {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{mountain.name}</h1>
      <p>Višina: {mountain.height} m</p>
      <p>Težavnost: {mountain.difficulty}</p>

      {/* Gumb za začetek organizacije */}
      <button
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        onClick={() => setShowWizard(true)}
      >
        Pomagaj organizirati
      </button>

      {/* Prikaži wizard */}
      {showWizard && <HikeWizard />}
    </div>

    
  );
}