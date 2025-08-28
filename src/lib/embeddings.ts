export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch embeddings: ${res.statusText}`);
  }

  const embedding = await res.json();
  return embedding[0]; // HF returns [ [vector] ], so take first
}
