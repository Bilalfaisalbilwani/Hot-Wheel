import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client singleton (never exposed to frontend)
let supabaseClient: SupabaseClient | null = null;

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'website-files';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return supabaseClient;
}

export function getStorageBucketName(): string {
  return STORAGE_BUCKET;
}

/**
 * Uploads a generated Visa Application PDF to the private 'website-files' bucket.
 * Retains bucket PRIVACY without opening public access.
 * Returns the stored storage path if successful, or null on failure.
 */
export async function uploadVisaPdfToSupabase(
  referenceId: string,
  pdfBuffer: Buffer,
  filename: string
): Promise<{ success: boolean; storagePath: string; signedUrl?: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, storagePath: '' };

  try {
    const bucketName = getStorageBucketName();
    const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename || `UAE_Visa_Application_${cleanRefId}.pdf`;
    const storagePath = `visa-applications/${cleanRefId}/${cleanFilename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Supabase Storage] Failed to upload to private bucket '${bucketName}':`, uploadError.message);
      return { success: false, storagePath: '' };
    }

    // Generate a long-lived signed URL (e.g. 7 days / 604800s) for private object access
    let signedUrl: string | null = null;
    try {
      const { data: signData, error: signError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

      if (!signError && signData?.signedUrl) {
        signedUrl = signData.signedUrl;
      }
    } catch (signErr) {
      console.warn('[Supabase Storage] Notice creating signed URL:', signErr);
    }

    console.log(`[Supabase Storage] Saved to private bucket '${bucketName}' at path: ${storagePath}`);
    return { success: true, storagePath, signedUrl };
  } catch (err: any) {
    console.warn('[Supabase Storage Error]:', err.message);
    return { success: false, storagePath: '' };
  }
}

/**
 * Uploads an individual customer-uploaded document (Passport, ID, Air Ticket, etc.)
 * to the private 'website-files' bucket under an organized path:
 * visa-applications/{reference_id}/documents/{filename}
 */
export async function uploadVisaDocumentToSupabase(
  referenceId: string,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ success: boolean; storagePath: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, storagePath: '' };

  try {
    const bucketName = getStorageBucketName();
    const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storagePath = `visa-applications/${cleanRefId}/documents/${cleanFilename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Supabase Storage] Failed to upload document to '${bucketName}':`, uploadError.message);
      return { success: false, storagePath: '' };
    }

    console.log(`[Supabase Storage] Document stored in private bucket '${bucketName}' at path: ${storagePath}`);
    return { success: true, storagePath };
  } catch (err: any) {
    console.warn('[Supabase Storage Document Upload Error]:', err.message);
    return { success: false, storagePath: '' };
  }
}

/**
 * Downloads a stored file from the private 'website-files' bucket via server-side client.
 */
export async function downloadVisaPdfFromSupabase(
  referenceId: string,
  filename?: string
): Promise<Buffer | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const bucketName = getStorageBucketName();
    const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename || `UAE_Visa_Application_${cleanRefId}.pdf`;
    const storagePath = `visa-applications/${cleanRefId}/${cleanFilename}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);

    if (error || !data) {
      // Try searching for any file in the application folder
      const { data: listData } = await supabase.storage
        .from(bucketName)
        .list(`visa-applications/${cleanRefId}`);

      if (listData && listData.length > 0) {
        const firstFile = listData[0].name;
        const { data: fallbackData } = await supabase.storage
          .from(bucketName)
          .download(`visa-applications/${cleanRefId}/${firstFile}`);
        if (fallbackData) {
          const arrayBuffer = await fallbackData.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      }
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.warn('[Supabase Storage Download Error]:', err.message);
    return null;
  }
}

/**
 * Downloads a stored customer document from private Supabase Storage 'website-files'.
 */
export async function downloadVisaDocumentFromSupabase(
  referenceId: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const bucketName = getStorageBucketName();
    const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storagePath = `visa-applications/${cleanRefId}/documents/${cleanFilename}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);

    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: data.type || 'application/octet-stream'
      };
    }

    // Fallback: list files in the documents directory to match by prefix or loose name
    const { data: listData } = await supabase.storage
      .from(bucketName)
      .list(`visa-applications/${cleanRefId}/documents`);

    if (listData && listData.length > 0) {
      const matched = listData.find(f => 
        f.name === cleanFilename ||
        f.name.toLowerCase().includes(cleanFilename.toLowerCase()) ||
        cleanFilename.toLowerCase().includes(f.name.toLowerCase())
      );
      if (matched) {
        const { data: matchedData } = await supabase.storage
          .from(bucketName)
          .download(`visa-applications/${cleanRefId}/documents/${matched.name}`);
        if (matchedData) {
          const arrayBuffer = await matchedData.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuffer),
            contentType: matchedData.type || 'application/octet-stream'
          };
        }
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[Supabase Document Download Error]:', err.message);
    return null;
  }
}

// ==============================================================================
// CAR RENTAL FLEET STORAGE OPERATIONS (PRIVATE BUCKET 'website-files')
// Path Structure:
// car-rental/{car_id}/images/{filename}
// car-rental/{car_id}/video/{filename}
// ==============================================================================

/**
 * Uploads a Car Media file (main image, gallery image, or video) to private Supabase Storage
 */
export async function uploadCarMediaToSupabase(
  carId: string,
  fileBuffer: Buffer,
  filename: string,
  mediaType: 'images' | 'video' = 'images',
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; storagePath: string; mediaUrl: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, storagePath: '', mediaUrl: '', error: 'Supabase client not configured' };
  }

  try {
    const bucketName = getStorageBucketName();
    const cleanCarId = carId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storagePath = `car-rental/${cleanCarId}/${mediaType}/${cleanFilename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Supabase Storage] Failed to upload car ${mediaType} to '${bucketName}':`, uploadError.message);
      return { success: false, storagePath: '', mediaUrl: '', error: uploadError.message };
    }

    // Public / Protected server proxy route for streaming private media safely
    const proxyUrl = `/api/cars/media/${cleanCarId}/${mediaType}/${cleanFilename}`;
    console.log(`[Supabase Storage] Car media stored in '${bucketName}' at: ${storagePath}`);
    return { success: true, storagePath, mediaUrl: proxyUrl };
  } catch (err: any) {
    console.warn('[Supabase Storage Car Upload Error]:', err.message);
    return { success: false, storagePath: '', mediaUrl: '', error: err.message };
  }
}

/**
 * Downloads a Car Media file from private Supabase Storage for server-side streaming
 */
export async function downloadCarMediaFromSupabase(
  carId: string,
  mediaType: 'images' | 'video',
  filename: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const bucketName = getStorageBucketName();
    const cleanCarId = carId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storagePath = `car-rental/${cleanCarId}/${mediaType}/${cleanFilename}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);

    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: data.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg')
      };
    }

    // Fallback: list files in the directory
    const { data: listData } = await supabase.storage
      .from(bucketName)
      .list(`car-rental/${cleanCarId}/${mediaType}`);

    if (listData && listData.length > 0) {
      const matched = listData.find(f => 
        f.name === cleanFilename ||
        f.name.toLowerCase() === cleanFilename.toLowerCase()
      );
      if (matched) {
        const { data: matchedData } = await supabase.storage
          .from(bucketName)
          .download(`car-rental/${cleanCarId}/${mediaType}/${matched.name}`);
        if (matchedData) {
          const arrayBuffer = await matchedData.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuffer),
            contentType: matchedData.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg')
          };
        }
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[Supabase Car Media Download Error]:', err.message);
    return null;
  }
}

/**
 * Deletes all media files associated with a vehicle in Supabase Storage
 * (e.g. car-rental/{car_id}/images/* and car-rental/{car_id}/video/*)
 */
export async function deleteCarMediaFolderFromSupabase(carId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const bucketName = getStorageBucketName();
    const cleanCarId = carId.replace(/[^a-zA-Z0-9_-]/g, '');

    const pathsToDelete: string[] = [];

    // List images
    const { data: imgList } = await supabase.storage
      .from(bucketName)
      .list(`car-rental/${cleanCarId}/images`);

    if (imgList && imgList.length > 0) {
      imgList.forEach(item => {
        if (item.name) {
          pathsToDelete.push(`car-rental/${cleanCarId}/images/${item.name}`);
        }
      });
    }

    // List video
    const { data: vidList } = await supabase.storage
      .from(bucketName)
      .list(`car-rental/${cleanCarId}/video`);

    if (vidList && vidList.length > 0) {
      vidList.forEach(item => {
        if (item.name) {
          pathsToDelete.push(`car-rental/${cleanCarId}/video/${item.name}`);
        }
      });
    }

    if (pathsToDelete.length > 0) {
      const { error: removeErr } = await supabase.storage
        .from(bucketName)
        .remove(pathsToDelete);

      if (removeErr) {
        console.warn(`[Supabase Storage Delete Notice for car ${cleanCarId}]:`, removeErr.message);
      } else {
        console.log(`[Supabase Storage] Successfully purged ${pathsToDelete.length} files for car ${cleanCarId}`);
      }
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Storage Delete Folder Error]:', err.message);
    return false;
  }
}

/**
 * Deletes a single car file from Supabase Storage given its proxy URL or path
 */
export async function deleteCarSingleFileFromSupabase(urlOrPath: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !urlOrPath) return false;

  try {
    const bucketName = getStorageBucketName();
    let storagePath = '';

    if (urlOrPath.includes('/api/cars/media/')) {
      const parts = urlOrPath.split('/api/cars/media/')[1];
      storagePath = `car-rental/${parts}`;
    } else if (urlOrPath.startsWith('car-rental/')) {
      storagePath = urlOrPath;
    }

    if (storagePath) {
      await supabase.storage.from(bucketName).remove([storagePath]);
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn('[Supabase Single File Delete Notice]:', err.message);
    return false;
  }
}
