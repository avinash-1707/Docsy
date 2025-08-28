import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { pinecone } from "@/lib/pinecone";
import { getEmbedding } from "@/lib/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { extractTextFromPDF } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const pdfData = await extractTextFromPDF(buffer);

    const sessionId = crypto.randomUUID();

    // store raw text in Redis (1 hrs expiration)
    await redis.set(`pdf:${sessionId}:raw`, pdfData, { ex: 3600 });

    // splitting the text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(pdfData);

    // embed and push to Pinecone
    const index = pinecone.Index("pdf-chat"); // create "pdf-chat" index in Pinecone first

    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => ({
        id: `${sessionId}-${i}`,
        values: await getEmbedding(chunk),
        metadata: { text: chunk, sessionId },
      }))
    );

    await index.upsert(vectors);

    return NextResponse.json({ sessionId, chunks: chunks.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
