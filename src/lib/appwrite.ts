import { Client, Storage, ID } from 'appwrite';

const appwriteClient = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

export const appwriteStorage = new Storage(appwriteClient);

export const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || '';

/**
 * Uploads a file to Appwrite storage and returns the file URL
 */
export const uploadFileToAppwrite = async (file: File): Promise<string> => {
  try {
    if (!APPWRITE_BUCKET_ID) {
      throw new Error("Appwrite Bucket ID is missing");
    }

    // Upload the file
    const response = await appwriteStorage.createFile(
      APPWRITE_BUCKET_ID,
      ID.unique(),
      file
    );

    // Generate the viewable file URL
    // Formula for fetching a file view: https://[ENDPOINT]/storage/buckets/[BUCKET_ID]/files/[FILE_ID]/view?project=[PROJECT_ID]
    const fileUrl = `${appwriteClient.config.endpoint}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${response.$id}/view?project=${appwriteClient.config.project}`;
    
    return fileUrl;
  } catch (error) {
    console.error("Error uploading to Appwrite:", error);
    throw error;
  }
};
