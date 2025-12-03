import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const response = await axios.post('/api/refresh', { refresh_token: refreshToken })
          // Backend returns {success: true, data: "new_access_token"}
          const access_token = response.data.data || response.data.access_token
          if (!access_token) {
            throw new Error('No access token in refresh response')
          }
          useAuthStore.getState().login(
            useAuthStore.getState().user!,
            access_token,
            refreshToken
          )
          error.config.headers.Authorization = `Bearer ${access_token}`
          return axios.request(error.config)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
