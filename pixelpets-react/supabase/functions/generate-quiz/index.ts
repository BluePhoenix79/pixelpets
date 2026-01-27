import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Models ordered by RPM/RPD - all text-generation compatible
const GEMINI_MODELS = [
  'gemini-3-flash',           // 5 RPM, 20 RPD
  'gemini-2.5-flash',         // 5 RPM, 20 RPD
  'gemini-2.5-flash-lite',    // 10 RPM, 20 RPD
  'gemma-3-1b',               // 30 RPM, 14.4K RPD
  'gemma-3-2b',               // 30 RPM, 14.4K RPD
  'gemma-3-4b',               // 30 RPM, 14.4K RPD
  'gemma-3-12b',              // 30 RPM, 14.4K RPD
  'gemma-3-27b',              // 30 RPM, 14.4K RPD
];

let currentModelIndex = 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let category = "general business knowledge";
    let gameType = "trivia";
    try {
      const body = await req.json();
      if (body.category) category = body.category;
      if (body.type) gameType = body.type;
    } catch {
      console.log("No body provided, using defaults");
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let searchPrompt = "";
    if (gameType === "budget_puzzle") {
        searchPrompt = `Generate a creative "Budget Puzzle" scenario about ${category}. 
        User has a Total Budget. Provide a list of items (some essential, some not). 
        The sum of ESSENTIAL items must be <= Total Budget. 
        Total Budget should be between $50 and $500.
        Return ONLY valid JSON:
        {"type":"budget_puzzle","scenario":"You are planning X...","totalBudget":100,"items":[{"name":"Item A","cost":20,"essential":true},{"name":"Luxury Item","cost":50,"essential":false}],"correctEssentials":["Item A"]}`;
    } else {
        // Default to Trivia
        searchPrompt = `Generate a UNIQUE and RANDOM trivia question about ${category}.
        Do not repeat common questions.
        Return ONLY valid JSON:
        {"type":"trivia","question":"Question text?","options":["A","B","C","D"],"answer":0,"explanation":"Why correct","category":"${category}"}`;
    }

    const prompt = `${searchPrompt}\nReturn ONLY valid JSON with no markdown.`;

    // Try each model in rotation
    const startIndex = currentModelIndex;
    for (let i = 0; i < GEMINI_MODELS.length; i++) {
      const modelIndex = (startIndex + i) % GEMINI_MODELS.length;
      const model = GEMINI_MODELS[modelIndex];
      
      console.log(`Trying model: ${model}`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 300 }
          })
        }
      );

      if (response.status === 429) {
        console.log(`${model} rate limited, trying next...`);
        continue;
      }

      if (!response.ok) {
        console.log(`${model} failed with ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.log(`${model} returned empty response, trying next...`);
        continue;
      }

      // Success! Rotate for next request
      currentModelIndex = (modelIndex + 1) % GEMINI_MODELS.length;
      
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const questionData = JSON.parse(jsonStr);
      questionData.generatedBy = model;

      console.log(`Successfully generated with ${model}`);
      return new Response(JSON.stringify(questionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All models failed
    return new Response(JSON.stringify({ error: "All models exhausted" }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
