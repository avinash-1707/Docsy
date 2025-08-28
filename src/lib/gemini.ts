import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function askGemini(context: string, query: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  You are a helpful assistant. Use the context to answer the user's query.

  Context:
  ${context}

  Query:
  ${query}
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
