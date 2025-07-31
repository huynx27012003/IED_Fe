import client from './client'

export const login = async (username, password) => {
  try {
    const response = await client.post('/auth/login', {
      username,
      password
    })
    return response.data 
  } catch (error) {
    console.error('Login error:', error)
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
    console.error('Error decoding token:', error)
    throw error
  }
}