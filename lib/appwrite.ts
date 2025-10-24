import { Client, Account } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://sfo.cloud.appwrite.io/v1")
  .setProject("68f947cd0031ce04b21f");

export const account = new Account(client);
