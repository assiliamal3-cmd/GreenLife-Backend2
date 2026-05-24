exports.analyzeAI = async (data) => {
  try {
    const prompt = `
You are a strict JSON generator.

Analyse consumption:

energy=${data.energy}
water=${data.water}
waste=${data.waste}

Return ONLY valid JSON (no text, no markdown):

{
  "risk": "low | medium | high",
  "score": 0,
  "message": "short advice"
}
`;

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
      }),
    });

    const result = await res.json();

    let text = result.response || "";

    console.log("RAW AI:", text); // 🔥 debug

    // 🔥 extract JSON ONLY (most important fix)
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No JSON found in AI response");
    }

    const json = JSON.parse(match[0]);

    return json;

  } catch (err) {
    console.error("AI SERVICE ERROR:", err);

    return {
      risk: "low",
      score: 0,
      message: "AI unavailable",
    };
  }
};