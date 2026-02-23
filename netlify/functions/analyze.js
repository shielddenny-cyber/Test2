export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const { imageDataUrl } = JSON.parse(event.body || "{}");
    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid imageDataUrl" }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY missing" }) };
    }

    const instructions = `
Du bist ein erfahrener Schädlingsbekämpfer (Deutschland) und erstellst einen Profi-Report
im Stil einer Schädlingskarte (ähnliche Struktur wie TRNS), aber komplett eigenständig formuliert.

WICHTIG:
- Keine wörtlichen Zitate aus Büchern/Standards.
- Foto allein ist unsicher: gib Limitations + welche Zusatzinfos fehlen.
- Maßnahmen: IPM (Inspektion/Proofing/Hygiene/Monitoring, dann gezielte Bekämpfung).
- Biozide nur allgemein, ohne Mischungen/Rezepte; immer "gemäß Zulassung/Etikett/Behördenauflagen".
- Ergänze Sicherheit/PSA & Dokumentation (Protokollpunkte).
Gib ausschließlich gültiges JSON nach folgendem Schema zurück.
`;

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        pest: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            confidence: { type: "number" },
            alternatives: { type: "array", items: { type: "string" } },
            evidence: { type: "array", items: { type: "string" } }
          },
          required: ["name", "confidence", "alternatives", "evidence"]
        },
        risk: {
          type: "object",
          additionalProperties: false,
          properties: {
            urgency: { type: "string" },
            health_notes: { type: "array", items: { type: "string" } },
            property_notes: { type: "array", items: { type: "string" } }
          },
          required: ["urgency", "health_notes", "property_notes"]
        },
        causes: { type: "array", items: { type: "string" } },
        inspection: { type: "array", items: { type: "string" } },
        plan: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              priority: { type: "string" },
              detail: { type: "string" },
              safety: { type: "string" },
              documentation: { type: "string" }
            },
            required: ["title", "priority", "detail", "safety", "documentation"]
          }
        },
        followup: { type: "array", items: { type: "string" } },
        limitations: { type: "array", items: { type: "string" } }
      },
      required: ["pest", "risk", "causes", "inspection", "plan", "followup", "limitations"]
    };

    const payload = {
      model: "gpt-5-mini",
      instructions,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Erkenne den Schädling auf dem Foto und erstelle den Profi-Report." },
            { type: "input_image", image_url: imageDataUrl, detail: "high" }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "pest_report",
          schema,
          strict: true
        }
      }
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = await r.json();
    if (!r.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: raw?.error?.message || "OpenAI error" }) };
    }

    // Try to extract the model's JSON text
    const msg = Array.isArray(raw?.output) ? raw.output.find(o => o.type === "message") : null;
    const content = msg?.content || [];
    const outText = content.find(c => c.type === "output_text")?.text || raw?.output_text || null;

    if (!outText) {
      return { statusCode: 500, body: JSON.stringify({ error: "No output_text from model" }) };
    }

    const parsed = JSON.parse(outText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || String(e) }) };
  }
};
