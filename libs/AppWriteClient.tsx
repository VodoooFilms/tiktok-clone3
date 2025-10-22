import { Account, Client, ID, Databases, Query, Storage } from "appwrite";

// Appwrite client configured with your env values
const client = new Client()
  .setEndpoint(
    String(
      process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT
    )
  )
  .setProject(String(process.env.NEXT_PUBLIC_APPWRITE_PROJECT));

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

export { client, account, database, storage, Query, ID };
