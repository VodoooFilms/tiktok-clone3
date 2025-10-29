import { Storage } from "@google-cloud/storage";

function getCredentials() {
  const b64 = process.env.GCS_SERVICE_ACCOUNT_BASE64;
  const json = process.env.GCS_SERVICE_ACCOUNT_JSON;
  let parsed: any | null = null;
  if (b64) {
    try { parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf-8")); } catch {}
  }
  if (!parsed && json) {
    try { parsed = JSON.parse(json); } catch {}
  }
  if (!parsed) {
    throw new Error("Missing GCS service account credentials (GCS_SERVICE_ACCOUNT_BASE64 or GCS_SERVICE_ACCOUNT_JSON)");
  }
  const { client_email, private_key, project_id } = parsed;
  if (!client_email || !private_key) {
    throw new Error("Invalid GCS service account JSON: missing client_email/private_key");
  }
  return { client_email, private_key, project_id } as {
    client_email: string;
    private_key: string;
    project_id?: string;
  };
}

export function getStorage() {
  const creds = getCredentials();
  return new Storage({
    projectId: creds.project_id,
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  });
}

export function getBucketName() {
  const name = process.env.GCS_BUCKET_NAME;
  if (!name) throw new Error("Missing GCS_BUCKET_NAME env var");
  return name;
}

