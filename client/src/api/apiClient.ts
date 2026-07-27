import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  withCredentials: true,
})

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh']

let isRefreshing = false
let pendingRequests: Array<() => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableConfig
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => originalRequest.url?.includes(path))

    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push(() => resolve(apiClient(originalRequest)))
      })
    }

    isRefreshing = true

    try {
      await apiClient.post('/auth/refresh')
      pendingRequests.forEach((retry) => retry())
      pendingRequests = []
      return apiClient(originalRequest)
    } catch (refreshError) {
      pendingRequests = []
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)