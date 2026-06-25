import client from './client'
import { logApiError } from '@/helpers/apiFeedback'

export const login = async (username, password) => {
  try {
    const response = await client.post('/auth/login', {
      username,
      password
    })
    return response.data 
  } catch (error) {
    logApiError(error, 'Login error')
    throw error
  }
}

export const getUserFromToken = async (token) => {
  try {
    const response = await client.get('/auth/decode-token', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    logApiError(error, 'Error decoding token')
    throw error
  }
}
