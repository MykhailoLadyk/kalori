import "@supabase/functions-js/edge-runtime.d.ts";
import { importPKCS8, SignJWT } from "npm:jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS")!;
  const sa = JSON.parse(serviceAccountJson);

  const now = Math.floor(Date.now() / 1000);

  // Import the private key using jose
  const privateKey = await importPKCS8(sa.private_key, "RS256");

  // Sign the JWT
  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/cloud-platform",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  // Exchange JWT for Google access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing imageBase64 or mimeType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID")!;
    const accessToken = await getAccessToken();

    const prompt = `You are a nutrition expert. Analyze the food in this image.
Respond ONLY with a valid JSON object, no extra text, no markdown, no backticks.

Use exactly this structure:
{
  "foods": [
    {
      "name": "food item name",
      "portion": "estimated portion e.g. 150g or 1 cup",
      "calories": 000,
      "protein_g": 00,
      "carbs_g": 00,
      "fat_g": 00,
      "fiber_g": 00
    }
  ],
  "meal_total": {
    "calories": 000,
    "protein_g": 00,
    "carbs_g": 00,
    "fat_g": 00,
    "fiber_g": 00
  },
  "confidence": "high | medium | low",
  "notes": "any caveats about the estimate"
}
Rules:
- List each food item separately in the foods array
- All numbers must be integers, no decimals
- If no food detected return { "error": "No food detected" }
- Never return anything outside the JSON object`;

    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              { text: prompt },
            ],
          }],
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Vertex API error: ${JSON.stringify(result)}`);
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return new Response(JSON.stringify(text), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
