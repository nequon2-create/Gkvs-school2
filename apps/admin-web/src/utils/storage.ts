import { supabase } from '../lib/supabase';

/**
 * Uploads a file to a specific Supabase Storage bucket and returns its public URL.
 * 
 * @param bucketName The name of the storage bucket (e.g., 'profiles', 'attachments')
 * @param file The file object to upload
 * @param customPath An optional path to place the file in (e.g., 'students/123/avatar.jpg'). 
 *                   If omitted, a random UUID-based name will be created.
 * @returns The public URL of the uploaded image
 */
export async function uploadFileToStorage(
    bucketName: string,
    file: File,
    customPath?: string
): Promise<string> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = customPath || `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true // Overwrite if the file already exists (e.g., for profile pics)
            });

        if (uploadError) {
            console.error('❌ Error uploading file to Supabase Storage:', uploadError);
            throw uploadError;
        }

        // Get the Public URL
        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        if (!data.publicUrl) {
            throw new Error('Failed to retrieve public URL for uploaded file.');
        }

        return data.publicUrl;

    } catch (err) {
        console.error('❌ Upload Utility Error:', err);
        throw err;
    }
}
