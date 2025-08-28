// lib/pdf.ts
import * as pdfjsLib from "pdfjs-dist";
import { getDocument } from "pdfjs-dist";

// Worker fix for serverless environments (like Vercel)
pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.js");

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const loadingTask = getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((i: any) => i.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}
