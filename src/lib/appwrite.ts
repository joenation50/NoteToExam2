import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_URL || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'placeholder_project_id');

export const account = new Account(client);
export const databases = new Databases(client);
export { ID, Query };
export const DATABASE_ID = 'main';
export const PROFILES_COLLECTION_ID = 'profiles';
