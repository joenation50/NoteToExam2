export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const { prompt } = await request.json();

    // This uses Cloudflare's built-in AI binding (no API key needed!)
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    });

    // Return the response in the format your frontend expects
    return new Response(JSON.stringify({ result: { response: response.response } }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
