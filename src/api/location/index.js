import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'location'

export function getLocationList() {
  return client.get(`${API_PREFIX}/${RESOURCE}/list`)
}

export function getLocationById(id) {
  return client.get(`${API_PREFIX}/${RESOURCE}/${id}`)
}

export function createLocation(data) {
  return client.post(`${API_PREFIX}/${RESOURCE}/create`, data)
}

export function updateLocation(id, data) {
  return client.put(`${API_PREFIX}/${RESOURCE}/${id}/update`, data)
}

export function deleteLocation(id) {
  return client.delete(`${API_PREFIX}/${RESOURCE}/${id}/delete`)
}
