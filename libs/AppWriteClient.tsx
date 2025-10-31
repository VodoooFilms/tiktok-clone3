import { Account, Client, ID, Databases, Query, Storage, Permission, Role } from "appwrite";

// Resolve endpoint/project from env (support both URL/ENDPOINT names)
const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT || "").trim();
const project = (process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "").trim();

// Singleton client configured with env values
const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (project) client.setProject(project);

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

export { client, account, database, storage, Query, ID, Permission, Role };
export const APPWRITE_ENDPOINT = endpoint;
export const APPWRITE_PROJECT = project;
