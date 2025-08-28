import { useState } from "react";

export function HikeWizard() {
  const [step, setStep] = useState(1);
  const [numPeople, setNumPeople] = useState(1);
  const [sleepOver, setSleepOver] = useState(null);
  const [hut, setHut] = useState("");
  const [route, setRoute] = useState("");
  const [transport, setTransport] = useState("");

  // Dummy podatki
  const huts = ["Koča pri Triglavskih jezerih", "Vodnikov dom", "Planika"];
  const routes = ["Pot 1 (3h)", "Pot 2 (4h)", "Pot 3 (5h)"];

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      {/* Korak 1: koliko ljudi */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Koliko ljudi gre na pohod?</h2>
          <input
            type="number"
            value={numPeople}
            min={1}
            max={20}
            className="border p-2 rounded w-24"
            onChange={(e) => setNumPeople(e.target.value)}
          />
          <button
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setStep(2)}
          >
            Naprej
          </button>
        </div>
      )}

      {/* Korak 2: spanje */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Ali želite prespati v koči?</h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            onClick={() => {
              setSleepOver(true);
              setStep(3);
            }}
          >
            Da
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setSleepOver(false);
              setStep(4);
            }}
          >
            Ne
          </button>
        </div>
      )}

      {/* Korak 3: izbira koče */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Izberite kočo</h2>
          <select
            className="border p-2 rounded"
            onChange={(e) => setHut(e.target.value)}
          >
            <option value="">-- izberite --</option>
            {huts.map((h, i) => (
              <option key={i} value={h}>{h}</option>
            ))}
          </select>
          <button
            disabled={!hut}
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setStep(4)}
          >
            Naprej
          </button>
        </div>
      )}

      {/* Korak 4: izbira poti */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Izberite pot</h2>
          <select
            className="border p-2 rounded"
            onChange={(e) => setRoute(e.target.value)}
          >
            <option value="">-- izberite --</option>
            {routes.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select>
          <button
            disabled={!route}
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setStep(5)}
          >
            Naprej
          </button>
        </div>
      )}

      {/* Korak 5: transport */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Kako želite do izhodišča?</h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            onClick={() => {
              setTransport("Avto");
              setStep(6);
            }}
          >
            Z avtom
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setTransport("Javni prevoz");
              setStep(6);
            }}
          >
            Javni prevoz
          </button>
        </div>
      )}

      {/* Korak 6: povzetek */}
      {step === 6 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Povzetek</h2>
          <ul className="list-disc ml-6">
            <li>Število ljudi: {numPeople}</li>
            <li>Spremljevalno spanje: {sleepOver ? "Da" : "Ne"}</li>
            {sleepOver && <li>Koča: {hut}</li>}
            <li>Izbrana pot: {route}</li>
            <li>Prevoz: {transport}</li>
          </ul>
          <button
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded"
            onClick={() => alert("Tukaj bi se izvedla rezervacija in plačilo")}
          >
            Rezerviraj in plačaj
          </button>
        </div>
      )}
    </div>
  );
}
