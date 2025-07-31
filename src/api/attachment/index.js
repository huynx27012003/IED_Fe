import client from './client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'attachment'

export function getAttachmentList() {
  return client.get(`${API_PREFIX}/${RESOURCE}/list`)
}

export function getAttachmentById(id) {
  return client.get(`${API_PREFIX}/${RESOURCE}/${id}`)
}

export function createAttachment(data) {
  return client.post(`${API_PREFIX}/${RESOURCE}/create`, data)
}

export function updateAttachment(id, data) {
  return client.put(`${API_PREFIX}/${RESOURCE}/${id}/update`, data)
}

export function deleteAttachment(id) {
  return client.delete(`${API_PREFIX}/${RESOURCE}/${id}/delete`)
}

export function getAttachmentsByAsset(assetId) {
  return client.get(`${API_PREFIX}/${RESOURCE}/asset/${assetId}`)
}
