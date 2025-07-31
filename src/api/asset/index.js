import client from './client'

const API_PREFIX = 'api/v1'
const RESOURCE    = 'assets'   // <-- dùng "assets" (plural) để khớp với BE

export function getAssetList() {
  // GET /api/v1/assets
  return client.get(`${API_PREFIX}/${RESOURCE}`)
}

export function getAssetById(id) {
  // GET /api/v1/assets/{id}
  return client.get(`${API_PREFIX}/${RESOURCE}/${id}`)
}

export function createAsset(data) {
  // POST /api/v1/assets
  return client.post(`${API_PREFIX}/${RESOURCE}`, data)
}

export function updateAsset(id, data) {
  // PUT /api/v1/assets/{id}
  return client.put(`${API_PREFIX}/${RESOURCE}/${id}`, data)
}

export function deleteAsset(id) {
  // DELETE /api/v1/assets/{id}
  return client.delete(`${API_PREFIX}/${RESOURCE}/${id}`)
}

export function getAssetsByLocation(locationId) {
  // GET /api/v1/assets/getAssetByLocation/{locationId}
  return client.get(`${API_PREFIX}/${RESOURCE}/getAssetByLocation/${locationId}`)
}
