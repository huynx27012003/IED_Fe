import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'file'

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return client.post(`${API_PREFIX}/${RESOURCE}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function downloadFile(fileId) {
  return client.get(`${API_PREFIX}/${RESOURCE}/download/${fileId}`, {
    responseType: 'blob'
  })
}

export function deleteFile(fileId) {
  return client.delete(`${API_PREFIX}/${RESOURCE}/${fileId}`)
}
