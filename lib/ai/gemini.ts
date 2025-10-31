"use client";

import { GoogleGenAI, SubjectReferenceImage, EditImageResponse, GenerateImagesResponse } from "@google/genai";

const MODEL_GENERATE = "imagen-3.0-generate-002";

function getClient() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key missing. Set NEXT_PUBLIC_GEMINI_API_KEY.");
  return new GoogleGenAI({ apiKey });
}

export async function transformImage(
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  // Prefer server route (Vertex AI) to preserve identity and avoid CORS/key exposure
  try {
    const res = await fetch("/api/gemini/transform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64: base64Data, mimeType, prompt }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.base64) return json.base64 as string;
      throw new Error(String(json?.error || "No image returned"));
    } else {
      const text = await res.text();
      throw new Error(text);
    }
  } catch (serverErr) {
    // Continue with client-side fallback below
    // eslint-disable-next-line no-console
    console.warn("Server transform failed, falling back to client", serverErr);
  }

  const ai = getClient();
  // 1) Try Imagen 3 Edit API (preferred for reference-based edits)
  try {
    const ref = new SubjectReferenceImage();
    ref.referenceImage = { imageBytes: base64Data, mimeType } as any;
    const res: EditImageResponse = await ai.models.editImage({
      model: "imagen-3.0-capability-001",
      prompt,
      referenceImages: [ref as any],
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        includeRaiReason: false,
      },
    });
    const bytes = (res.generatedImages?.[0]?.image as any)?.imageBytes as string | undefined;
    if (bytes) return bytes;
  } catch (e) {
    // fall back to multimodal generateContent
    // eslint-disable-next-line no-console
    console.warn("editImage failed; falling back to generateContent image", e);
  }

  // 2) Fallback: text-to-image generation (won't preserve identity)
  const res2: GenerateImagesResponse = await ai.models.generateImages({
    model: MODEL_GENERATE,
    prompt: `${prompt} Create a single square avatar image, centered face, clean background, vivid colors, PNG output.`,
    config: {
      numberOfImages: 1,
      aspectRatio: "1:1",
      includeRaiReason: false,
      outputMimeType: "image/png",
    } as any,
  } as any);
  const bytes = (res2.generatedImages?.[0]?.image as any)?.imageBytes as string | undefined;
  if (!bytes) throw new Error("No image returned by Gemini");
  return bytes;
}
