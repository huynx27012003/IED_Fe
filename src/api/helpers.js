import client from './client'

/**
 * Wrapper cho HTTP GET requests
 * @param {string} url - API endpoint
 * @param {Object} params - Query parameters
 * @param {string} errorMessage - Custom error message
 * @returns {Promise<any>} Response data
 */
export async function get(url, params = {}, errorMessage = null) {
  try {
    const response = await client.get(url, { params })
    return response.data
  } catch (error) {
    const message = errorMessage || `Error fetching from ${url}`
    console.error(message, error)
    throw error
  }
}

/**
 * Wrapper cho HTTP POST requests
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} config - Axios config
 * @param {string} errorMessage - Custom error message
 * @returns {Promise<any>} Response data
 */
export async function post(url, data = {}, config = {}, errorMessage = null) {
  try {
    const response = await client.post(url, data, config)
    return response.data
  } catch (error) {
    const message = errorMessage || `Error posting to ${url}`
    console.error(message, error)
    throw error
  }
}

/**
 * Wrapper cho HTTP PUT requests
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {string} errorMessage - Custom error message
 * @returns {Promise<any>} Response data
 */
export async function put(url, data = {}, errorMessage = null) {
  try {
    const response = await client.put(url, data)
    return response.data
  } catch (error) {
    const message = errorMessage || `Error updating ${url}`
    console.error(message, error)
    throw error
  }
}

/**
 * Wrapper cho HTTP DELETE requests
 * @param {string} url - API endpoint
 * @param {Object} params - Query parameters
 * @param {string} errorMessage - Custom error message
 * @returns {Promise<any>} Response data
 */
export async function del(url, params = {}, errorMessage = null) {
  try {
    const response = await client.delete(url, { params })
    return response.data
  } catch (error) {
    const message = errorMessage || `Error deleting from ${url}`
    console.error(message, error)
    throw error
  }
}

/**
 * Wrapper cho HTTP PATCH requests
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {string} errorMessage - Custom error message
 * @returns {Promise<any>} Response data
 */
export async function patch(url, data = {}, errorMessage = null) {
  try {
    const response = await client.patch(url, data)
    return response.data
  } catch (error) {
    const message = errorMessage || `Error patching ${url}`
    console.error(message, error)
    throw error
  }
}
