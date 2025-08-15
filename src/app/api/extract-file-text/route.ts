// File: src/app/api/extract-file-text/route.ts
import { NextResponse } from "next/server";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import mammoth from "mammoth"; // Re-import mammoth

export async function POST(req: Request) {
  try {
    // === Step 1: Fetch the file from IPFS (same as before) ===
    const { ipfsCid } = await req.json();
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch file from IPFS: ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // Check if IPFS returned an error page
    const headerText = buffer.toString("utf8", 0, 100).toLowerCase();
    if (headerText.includes("<!doctype html") || headerText.includes("<html>")) {
      throw new Error("IPFS gateway returned an HTML error page; file not found.");
    }

    let extractedText = "";

    // === Step 2: Check file type and process accordingly ===

    // Branch 1: PDF file -> Use Google Document AI for high accuracy
    if (buffer.toString("utf8", 0, 8).includes("%PDF")) {
      console.log("PDF detected. Using Google Document AI...");
      
      const client = new DocumentProcessorServiceClient();
      const projectId = process.env.GCP_PROJECT_ID;
      const location = process.env.GCP_LOCATION;
      const processorId = process.env.GCP_PROCESSOR_ID;

      if (!projectId || !location || !processorId) {
        throw new Error("Google Cloud project details are not set in environment variables.");
      }
      
      const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
      const encodedImage = buffer.toString("base64");
      
      const request = {
        name,
        rawDocument: {
          content: encodedImage,
          mimeType: "application/pdf",
        },
      };

      const [result] = await client.processDocument(request);
      extractedText = result.document?.text || "";

    // Branch 2: DOCX file -> Use Mammoth for local, fast processing
    } else if (buffer.slice(0, 2).toString("hex") === "504b") {
      console.log("DOCX detected. Using Mammoth library...");
      const { value } = await mammoth.extractRawText({ buffer });
      extractedText = value;

    // Branch 3: Unsupported file type
    } else {
      throw new Error("Unsupported file type. Only PDF and DOCX are supported.");
    }

    // Limit to 500 words (optional)
      extractedText = extractedText.split(/\s+/).slice(0, 500).join(" ");

      // Naive characteristics extraction: split into sentences, pick first 5
      const characteristics = extractedText
        .split(/[.!?\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 5);

      return NextResponse.json({ text: extractedText, characteristics });

  } catch (err) {
    console.error("Error in file processing:", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}