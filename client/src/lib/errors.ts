import { isAxiosError } from 'axios'

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data

    if (Array.isArray(data)) {
      return data.join(' ')
    }

    if (typeof data === 'object' && data !== null && 'message' in data) {
      return String((data as { message: unknown }).message)
    }
  }

  return 'Something went wrong. Please try again.'
}