import { apiClient } from './apiClient'
import type { FileUploadResponse } from '@/types/files'

export const filesApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<FileUploadResponse>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data)
  },
}