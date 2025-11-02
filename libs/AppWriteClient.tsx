import { Account, Client, ID, Databases, Query, Storage, Permission, Role } from "appwrite";

// Resolve endpoint/project from env (support both URL/ENDPOINT names)
const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT || "").trim();
const project = (process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "").trim();

// Singleton client configured with env values
const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (project) client.setProject(project);
// Optional: custom realtime endpoint (helps when API and WS are split behind proxies)
const realtimeEndpoint = (process.env.NEXT_PUBLIC_APPWRITE_REALTIME_URL || "").trim();
try { (client as any).setEndpointRealtime?.(realtimeEndpoint || undefined); } catch {}
// Local HTTPS with self-signed cert support
try {
  const isLocalHttps = /^https:\/\/(localhost|127\.0\.0\.1)/i.test(endpoint);
  if (isLocalHttps) (client as any).setSelfSigned?.(true);
} catch {}

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

export { client, account, database, storage, Query, ID, Permission, Role };
export const APPWRITE_ENDPOINT = endpoint;
export const APPWRITE_PROJECT = project;
