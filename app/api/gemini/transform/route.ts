import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, SubjectReferenceImage, EditImageResponse, SubjectReferenceType, PersonGeneration } from "@google/genai";
import { promises as fs } from "node:fs";
import path from "node:path";

// Vertex AI configuration
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "yaddai";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

async function ensureAdcCredentials() {
  // If Vercel env provides JSON content in GCP_SA_JSON, write it to /tmp and point GOOGLE_APPLICATION_CREDENTIALS there
  try {
    const json = process.env.GCP_SA_JSON;
    if (!json) return;
    const tmpPath = path.join("/tmp", "gcp-sa.json");
    try {
      // If file already exists, skip rewrite
      await fs.access(tmpPath);
    } catch {
      await fs.writeFile(tmpPath, json);
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  } catch {}
}

async function getClient() {
  await ensureAdcCredentials();
  // Use Vertex AI with service account ADC
  const ai = new GoogleGenAI({ vertexai: true, project: PROJECT, location: LOCATION, apiVersion: "v1" });
  return ai;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const base64: string | undefined = body?.base64;
    const mimeType: string | undefined = body?.mimeType || "image/png";
    const prompt: string | undefined = body?.prompt;
    if (!base64 || !prompt) {
      return NextResponse.json({ error: "Missing base64 or prompt" }, { status: 400 });
    }
    const ai = await getClient();
    // Use a SubjectReferenceImage so the model keeps the same person/identity
    const ref = new SubjectReferenceImage();
    ref.referenceImage = { imageBytes: base64, mimeType } as any;
    ref.config = { subjectType: SubjectReferenceType.SUBJECT_TYPE_PERSON, subjectDescription: "same person as the reference" } as any;
    const res: EditImageResponse = await ai.models.editImage({
      model: "imagen-3.0-capability-001",
      prompt,
      referenceImages: [ref as any],
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        includeRaiReason: false,
        personGeneration: PersonGeneration.ALLOW_ADULT,
        aspectRatio: "1:1" as any,
        guidanceScale: 10 as any,
        negativePrompt:
          "Do not change the person’s identity, face shape, skin tone, hair, or pose. Do not add or remove people. Avoid heavy background changes.",
        // editMode: EditMode.EDIT_MODE_STYLE,
      },
    });
    const bytes = (res.generatedImages?.[0]?.image as any)?.imageBytes as string | undefined;
    if (!bytes) return NextResponse.json({ error: "No image returned" }, { status: 502 });
    return NextResponse.json({ base64: bytes });
  } catch (e: any) {
    console.error("/api/gemini/transform error", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
