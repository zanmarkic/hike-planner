// src/pages/OrganizeTour.js
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import mountains from "../data/mountains";

export default function OrganizeTour() {
  const [sp] = useSearchParams();
  const mountainName = sp.get("m") || "";  // iz /organize?m=Triglav

  const mountain = useMemo(
    () => mountains.find((m) => m.name === mountainName),
    [mountainName]
  );

  const allHuts = useMemo(() => {
    if (!mountain) return [];
    const set = new Set();
    mountain.routes.forEach((r) => r.huts.forEach((h) => set.add(h)));
    return Array.from(set);
  }, [mountain]);

  const [form, setForm] = useState({
    people: "",
    date: "",
    sleep: "ne",
    hut: "",
    transport: "",
    route: ""
  });

  const suggestedRoutes = useMemo(() => {
    if (!mountain) return [];
    if (form.sleep === "da" && form.hut) {
      return mountain.routes.filter((r) => r.huts.includes(form.hut));
    }
    return mountain.routes;
  }, [mountain, form.sleep, form.hut]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value, ...(name === "sleep" && value === "ne" ? { hut: "" } : {}) }));
  };

  const openMaps = (lat, lng, mode = "driving") => {
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("destination", `${lat},${lng}`);
    url.searchParams.set("travelmode", mode);
    window.open(url.toString(), "_blank");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!mountain) return alert("Izberi goro.");

    // preprosta validacija
    if (!form.people || !form.date || !form.transport) {
      return alert("Prosimo, izpolni število ljudi, datum in prevoz.");
    }
    if (form.sleep === "da" && !form.hut) {
      return alert("Izberi kočo.");
    }

    // “Rezervacije” (mock)
    const actions = [];
    if (form.sleep === "da") {
      actions.push(`Rezervacija koče: ${form.hut} (fake)`);
    }
    if (form.transport === "javni") {
      actions.push("Odpri ponudnike javnega prevoza (fake)");
      window.open("https://www.ap-ljubljana.si", "_blank");
      window.open("https://potniski.sz.si", "_blank");
    }

    alert(
      `Tura potrjena!\n` +
      `Gora: ${mountain.name}\n` +
      `Ljudje: ${form.people}\n` +
      `Datum: ${form.date}\n` +
      `Spanje: ${form.sleep === "da" ? `DA (${form.hut})` : "NE"}\n` +
      `Prevoz: ${form.transport}\n` +
      (form.route ? `Pot: ${form.route}\n` : "") +
      (actions.length ? `\nAkcije:\n- ${actions.join("\n- ")}` : "")
    );
  };

  if (!mountain) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Organiziraj turo</h1>
        <p>Ni podatkov o hribu. Odpri iz podrobnosti gore (gumb “Organiziraj turo”).</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Organiziraj turo za {mountain.name}</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
        <label>
          Število ljudi:
          <input
            type="number"
            min="1"
            name="people"
            value={form.people}
            onChange={onChange}
          />
        </label>

        <label>
          Datum:
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={onChange}
          />
        </label>

        <label>
          Ali želite spati?
          <select name="sleep" value={form.sleep} onChange={onChange}>
            <option value="ne">Ne</option>
            <option value="da">Da</option>
          </select>
        </label>

        {form.sleep === "da" && (
          <label>
            Koča (v bližini poti):
            <select name="hut" value={form.hut} onChange={onChange}>
              <option value="">— izberi kočo —</option>
              {allHuts.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Predlagane poti {form.hut ? `(koča: ${form.hut})` : "(vse)"}:
          <select
            name="route"
            value={form.route}
            onChange={onChange}
          >
            <option value="">— izberi pot —</option>
            {suggestedRoutes.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name} · {r.time} · +{r.elevation} m
              </option>
            ))}
          </select>
        </label>

        <label>
          Prevoz:
          <select name="transport" value={form.transport} onChange={onChange}>
            <option value="">— izberi prevoz —</option>
            <option value="avto">Avto</option>
            <option value="javni">Javni prevoz</option>
          </select>
        </label>

        {/* Hitra navigacija do izhodišča izbrane poti */}
        {form.route && (
          <>
            <div style={{ fontSize: 14, color: "#555" }}>
              Izhodišče: {
                (mountain.routes.find((r) => r.name === form.route)?.start.label)
              }
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  const r = mountain.routes.find((x) => x.name === form.route);
                  if (r) openMaps(r.start.lat, r.start.lng, "driving");
                }}
              >
                Navigacija (avto)
              </button>
              <button
                type="button"
                onClick={() => {
                  const r = mountain.routes.find((x) => x.name === form.route);
                  if (r) openMaps(r.start.lat, r.start.lng, "transit");
                }}
              >
                Navigacija (javni)
              </button>
            </div>
          </>
        )}

        <button type="submit">Potrdi rezervacijo</button>
      </form>
    </div>
  );
}
