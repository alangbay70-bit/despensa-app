export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { ingredientList, mealFilter, dinerFilter, mealType, dinerType } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: `Tengo estos ingredientes en casa: ${ingredientList}. Sugiere 3 recetas creativas ${mealFilter} ${dinerFilter} que pueda hacer con ellos. Responde SOLO con un JSON array válido (sin texto extra, sin backticks, sin comentarios) con exactamente este formato: [{"name":"nombre","time":"X min","difficulty":"Facil","emoji":"🍽️","servings":2,"mealType":"${mealType || 'Comida'}","dinerType":"${dinerType || ''}","ingredients":[{"qty":1,"unit":"taza","name":"Arroz"}],"steps":["paso 1","paso 2"],"tags":["tag1"]}]`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || "Error de API" });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch(parseErr) {
      // Intentar extraer el array aunque el JSON esté incompleto
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Respuesta de IA inválida, intenta de nuevo");
      }
    }

    return res.status(200).json({ recipes: parsed });

  } catch (e) {
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}
