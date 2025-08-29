import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { pinecone } from "@/lib/pinecone";
import { getEmbedding } from "@/lib/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { extractTextFromPDF } from "@/lib/pdf";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    const vectors: any[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const values = await getEmbedding(chunks[i]);

      vectors.push({
        id: `${sessionId}-${i}`,
        values,
        metadata: { text: chunks[i], sessionId },
      });

      // push every 5 embeddings, then sleep
      if (i % 5 === 0 && i !== 0) {
        await index.upsert(vectors);
        vectors.length = 0; // clear after pushing
        await sleep(5000); // wait 2s before next batch
      }
    }

    // push any leftover
    if (vectors.length > 0) {
      await index.upsert(vectors);
    }

    return NextResponse.json({ sessionId, chunks: chunks.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
