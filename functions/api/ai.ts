export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const { prompt } = await request.json();

    // These are pulled securely from Cloudflare, NOT the browser!
    const accountId = env.VITE_CLOUDFLARE_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.VITE_CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return new Response(JSON.stringify({ error: "Missing Cloudflare credentials in environment variables." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          model: "@cf/meta/llama-3.1-8b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 4096,
        }),
      }
    );

    const data = await response.json();
    
    // Pass the AI response back to the frontend
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
