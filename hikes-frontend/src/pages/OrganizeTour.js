// src/pages/OrganizeTour.js
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import mountains from "../data/mountains";

export default function OrganizeTour() {
  const [sp] = useSearchParams();
  const mountainName = sp.get("m") || ""; // iz /organize?m=Triglav

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
    dateFrom: "",
    dateTo: "",
    sleep: "ne",
    hut: "",
    transport: "",
    route: "",
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

    // če uporabnik spremeni sleep na "ne", počistimo hut
    if (name === "sleep" && value === "ne") {
      setForm((prev) => ({ ...prev, sleep: "ne", hut: "" }));
      return;
    }

    // če uporabnik spremeni dateFrom in je dateTo prej, porinemo dateTo naprej
    if (name === "dateFrom" && form.dateTo && value && value > form.dateTo) {
      setForm((prev) => ({ ...prev, dateFrom: value, dateTo: value }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openMaps = (lat, lng, mode = "driving") => {
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("destination", `${lat},${lng}`);
    url.searchParams.set("travelmode", mode);
    window.open(url.toString(), "_blank");
  };

  const nights = useMemo(() => {
    if (!form.dateFrom || !form.dateTo) return 0;
    const from = new Date(form.dateFrom);
    const to = new Date(form.dateTo);
    const diff = (to - from) / (1000 * 60 * 60 * 24); // dnevi
    return diff > 0 ? diff : 0;
  }, [form.dateFrom, form.dateTo]);

  const submit = (e) => {
    e.preventDefault();
    if (!mountain) return alert("Izberi goro.");

    // validacija
    if (!form.people || !form.dateFrom || !form.dateTo || !form.transport) {
      return alert("Prosimo, izpolni število ljudi, datum OD/DO in prevoz.");
    }
    if (form.dateTo < form.dateFrom) {
      return alert("Datum DO ne sme biti pred datumom OD.");
    }
    if (form.sleep === "da" && !form.hut) {
      return alert("Izberi kočo.");
    }

    const actions = [];
    if (form.sleep === "da") {
      actions.push(`Rezervacija koče: ${form.hut} (mock) – ${nights} noč(i).`);
    }
    if (form.transport === "javni") {
      actions.push("Odpri ponudnike javnega prevoza (mock)");
      window.open("https://www.ap-ljubljana.si", "_blank");
      window.open("https://potniski.sz.si", "_blank");
    }

    alert(
      `Tura potrjena!\n` +
        `Gora: ${mountain.name}\n` +
        `Ljudje: ${form.people}\n` +
        `Obdobje: ${form.dateFrom} → ${form.dateTo} (${nights} noč/i)\n` +
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

      <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
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
          Datum OD:
          <input
            type="date"
            name="dateFrom"
            value={form.dateFrom}
            onChange={onChange}
            max={form.dateTo || undefined}
          />
        </label>

        <label>
          Datum DO:
          <input
            type="date"
            name="dateTo"
            value={form.dateTo}
            onChange={onChange}
            min={form.dateFrom || undefined}
          />
        </label>

        {form.dateFrom && form.dateTo && (
          <div style={{ fontSize: 14, color: "#555" }}>
            {nights > 0 ? `Število nočitev: ${nights}` : "Ista noč (brez nočitve)"}
          </div>
        )}

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
          <select name="route" value={form.route} onChange={onChange}>
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
              Izhodišče: {mountain.routes.find((r) => r.name === form.route)?.start.label}
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
