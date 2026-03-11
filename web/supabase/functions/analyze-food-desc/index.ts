import "@supabase/functions-js/edge-runtime.d.ts";
import { importPKCS8, SignJWT } from "npm:jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(): Promise<string> {
  const sa = JSON.parse(Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS")!);
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(sa.private_key, "RS256");

  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/cloud-platform",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

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
    const { description } = await req.json();

    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID")!;
    const accessToken = await getAccessToken();

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
            parts: [{
              text:
                `ONLY give me macros of the ${description} in JSON format with keys: calories, carbs, protein, fat. Do not include any other text or explanation.`,
            }],
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
