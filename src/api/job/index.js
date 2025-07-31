import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'job'

export function getJobList() {
  return client.get(`${API_PREFIX}/${RESOURCE}/list`)
}

export function getJobById(id) {
  return client.get(`${API_PREFIX}/${RESOURCE}/${id}`)
}

export function createJob(data) {
  return client.post(`${API_PREFIX}/${RESOURCE}/create`, data)
}

export function updateJob(id, data) {
  return client.put(`${API_PREFIX}/${RESOURCE}/${id}/update`, data)
}

export function deleteJob(id) {
  return client.delete(`${API_PREFIX}/${RESOURCE}/${id}/delete`)
}

export function getJobsByAsset(assetId) {
  return client.get(`${API_PREFIX}/${RESOURCE}/asset/${assetId}`)
}
