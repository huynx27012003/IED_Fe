import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'test'

export function getTestList() {
  return client.get(`${API_PREFIX}/${RESOURCE}/list`)
}

export function getTestById(id) {
  return client.get(`${API_PREFIX}/${RESOURCE}/${id}`)
}

export function createTest(data) {
  return client.post(`${API_PREFIX}/${RESOURCE}/create`, data)
}

export function updateTest(id, data) {
  return client.put(`${API_PREFIX}/${RESOURCE}/${id}/update`, data)
}

export function deleteTest(id) {
  return client.delete(`${API_PREFIX}/${RESOURCE}/${id}/delete`)
}

export function getTestsByJob(jobId) {
  return client.get(`${API_PREFIX}/${RESOURCE}/job/${jobId}`)
}
