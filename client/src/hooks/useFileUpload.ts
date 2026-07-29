import { useMutation } from '@tanstack/react-query'
import { filesApi } from '@/api/filesApi'

export function useFileUpload() {
  return useMutation({
    mutationFn: (file: File) => filesApi.upload(file),
  })
}