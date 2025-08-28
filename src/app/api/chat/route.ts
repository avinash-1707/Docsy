import { NextRequest, NextResponse } from "next/server";
import { pinecone } from "@/lib/pinecone";
import { getEmbedding } from "@/lib/embeddings";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, query } = await req.json();

    if (!sessionId || !query) {
      return NextResponse.json(
        { error: "Missing sessionId or query" },
        { status: 400 }
      );
    }

    const index = pinecone.Index("pdf-chat");

    // embed query
    const queryEmbedding = await getEmbedding(query);

    // search Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK: 5,
      filter: { sessionId },
      includeMetadata: true,
    });

    const context = results.matches
      .map((m: any) => m.metadata.text)
      .join("\n\n");

    // ask Gemini
    const answer = await askGemini(context, query);

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
