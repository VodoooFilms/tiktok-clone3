import { Account, Client, ID, Databases, Query, Storage, Permission, Role } from "appwrite";

// Appwrite client configured with your env values (tutorial style)
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_URL as string)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string);

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

export { client, account, database, storage, Query, ID, Permission, Role };
