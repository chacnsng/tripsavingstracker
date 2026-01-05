'use client'

import { useState, useRef } from 'react'
import { uploadUserPhoto } from '@/lib/storage'

interface PhotoUploadProps {
  userId?: string
  currentPhotoUrl?: string
  onUploadComplete: (photoUrl: string | null) => void
  onError?: (error: string) => void
}

export function PhotoUpload({
  userId,
  currentPhotoUrl,
  onUploadComplete,
  onError,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file if userId is provided (for editing existing users)
    if (userId) {
      setUploading(true)
      try {
        const photoUrl = await uploadUserPhoto(file, userId)
        if (photoUrl) {
          setPreview(photoUrl)
          onUploadComplete(photoUrl)
        } else {
          throw new Error('Upload failed')
        }
      } catch (error: any) {
        console.error('Upload error:', error)
        onError?.(error.message || 'Failed to upload photo')
        setPreview(currentPhotoUrl || null)
      } finally {
        setUploading(false)
      }
    } else {
      // For new users, store file data URL for preview
      // The parent component will handle the actual upload after user creation
      setPreview(reader.result as string)
      // Store the file in a way the parent can access it
      const event = new CustomEvent('photoFileSelected', { detail: file })
      window.dispatchEvent(event)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onUploadComplete(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-slate-300 dark:ring-slate-600 shadow-lg">
              <img
                src={preview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-slate-300 dark:ring-slate-600">
            <svg
              className="w-12 h-12 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        <div className="flex-1 space-y-2">
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : preview ? (
                'Change Photo'
              ) : (
                'Upload Photo'
              )}
            </span>
          </label>
          {preview && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Remove Photo
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        JPG, PNG or GIF. Max size 5MB.
      </p>
    </div>
  )
}

