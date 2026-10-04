import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const DEFAULT_MEDIA_BUCKET = import.meta.env.VITE_SUPABASE_MEDIA_BUCKET || 'member-media';

export async function uploadMediaToSupabaseStorage(file: File, folder: string = 'general', bucketName: string = DEFAULT_MEDIA_BUCKET): Promise<string> {
  if (!file || !file.name) {
    throw new Error('No file selected.');
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Storage is not configured.');
  }

  const safeName = file.name.replace(/\s+/g, '-');
  const extension = safeName.includes('.') ? safeName.split('.').pop() || 'bin' : 'bin';
  const objectPath = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload media to Supabase Storage.');
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    throw new Error('Supabase Storage did not return a public URL.');
  }

  return data.publicUrl;
}
