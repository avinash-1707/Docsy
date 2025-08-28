import { GoogleGenAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate embedding for single text using Gemini.
 * @param text Text to embed
 * @param outputDim Dimensions (3072, 1536, 768)
 * @returns embedding vector
 */
export async function getEmbedding(
  text: string,
  outputDim: 3072 | 1536 | 768 = 3072
): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      outputDimensionality: outputDim,
    },
  });

  // response.embeddings is array of objects with `values: number[]`
  return response.embeddings[0].values;
}

/**
 * Bulk embeddings on multiple text chunks.
 * @param texts array of strings
 * @param outputDim dimensions
 */
export async function getEmbeddings(
  texts: string[],
  outputDim: 3072 | 1536 | 768 = 3072
): Promise<number[][]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,
    config: {
      outputDimensionality: outputDim,
    },
  });

  return response.embeddings.map((e) => e.values);
}
