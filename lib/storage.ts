import { supabase } from './supabase'

const BUCKET_NAME = 'user-photos'

/**
 * Upload a user profile photo to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID to associate with the photo
 * @returns The public URL of the uploaded file, or null if upload fails
 */
export async function uploadUserPhoto(
  file: File,
  userId: string
): Promise<string | null> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload the file
    const { error: uploadError, data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      // Throw with detailed error message
      throw new Error(uploadError.message || `Upload failed: ${JSON.stringify(uploadError)}`)
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return publicUrl
  } catch (error: any) {
    console.error('Error in uploadUserPhoto:', error)
    // Re-throw to preserve error message
    throw error
  }
}

/**
 * Delete a user photo from Supabase Storage
 * @param photoUrl - The public URL of the photo to delete
 */
export async function deleteUserPhoto(photoUrl: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlParts = photoUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]

    if (!fileName) {
      console.error('Could not extract filename from URL:', photoUrl)
      return
    }

    // Delete the file
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (error) {
      console.error('Error deleting file:', error)
    }
  } catch (error) {
    console.error('Error in deleteUserPhoto:', error)
  }
}

