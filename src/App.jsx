import React, { useMemo, useState } from "react";

const MAX_MB = 8;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const fileInfo = useMemo(() => {
    if (!file) return null;
    return { name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(2), type: file.type };
  }, [file]);

  async function onPick(e) {
    setErr("");
    setResult(null);
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setErr("Bitte nur Bilder hochladen (jpg/png/webp).");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErr(`Bild ist zu groß (>${MAX_MB} MB). Bitte kleiner machen.`);
      return;
    }

    setFile(f);
    const b64 = await fileToBase64(f);
    setPreview(b64);
  }

  async function analyze() {
    if (!preview) return;
    setBusy(true);
    setErr("");
    setResult(null);

    try {
      const res = await fetch("/.netlify/functions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: preview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analyse fehlgeschlagen");
      setResult(data);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <header className="head">
        <h1>SBKdirekt – Schädling erkennen (Profi-Modus)</h1>
        <p className="sub">
          Foto hochladen → KI-Identifikation → Profi-Report (IPM, Ursachen, Maßnahmen, Doku).
        </p>
      </header>

      <section className="card">
        <div className="row">
          <input type="file" accept="image/*" onChange={onPick} />
          <button onClick={analyze} disabled={!preview || busy}>
            {busy ? "Analysiere..." : "Schädling erkennen"}
          </button>
        </div>

        {fileInfo && (
          <div className="meta">
            <span><b>Datei:</b> {fileInfo.name}</span>
            <span><b>Typ:</b> {fileInfo.type}</span>
            <span><b>Größe:</b> {fileInfo.sizeMB} MB</span>
          </div>
        )}

        {preview && (
          <div className="preview">
            <img src={preview} alt="Vorschau" />
          </div>
        )}

        {err && <div className="error">⚠️ {err}</div>}
      </section>

      {result && (
        <section className="card">
          <h2>Ergebnis</h2>

          <div className="pillrow">
            <span className="pill"><b>Schädling:</b> {result.pest?.name || "—"}</span>
            <span className="pill"><b>Konfidenz:</b> {Math.round((result.pest?.confidence || 0) * 100)}%</span>
            <span className="pill"><b>Gefahr/Dringlichkeit:</b> {result.risk?.urgency || "—"}</span>
          </div>

          <h3>Kurzbegründung (Bildmerkmale)</h3>
          <ul>
            {(result.pest?.evidence || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

          <h3>Typische Ursachen & Eintrittspfade</h3>
          <ul>
            {(result.causes || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

          <h3>Inspektions-Checkliste (Profi)</h3>
          <ul>
            {(result.inspection || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

          <h3>Maßnahmenplan (IPM, Profi)</h3>
          {(result.plan || []).map((step, i) => (
            <div key={i} className="step">
              <div className="steptitle">
                <b>{i + 1}. {step.title}</b>
                {step.priority && <span className="prio">Prio: {step.priority}</span>}
              </div>
              <div className="stepbody">{step.detail}</div>
              {step.safety && <div className="stepsafety">🦺 <b>Sicherheit/PSA:</b> {step.safety}</div>}
              {step.documentation && <div className="stepdoc">📝 <b>Doku:</b> {step.documentation}</div>}
            </div>
          ))}

          <h3>Warnhinweise / Grenzen</h3>
          <ul>
            {(result.limitations || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>

          <h3>Follow-up / Erfolgskontrolle</h3>
          <ul>
            {(result.followup || []).map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>
      )}

      <footer className="foot">
        <p>
          Hinweis: Foto allein kann täuschen. Für echte Einsätze immer zusätzlich Befallsindikatoren,
          Umfeld, Kot/Spuren, Kundeninfos und ggf. Monitoringdaten bewerten.
        </p>
      </footer>
    </div>
  );
}
