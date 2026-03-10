import { get, post, del } from '@/api/helpers'

export function getVendors() {
  return get('/ied/get-vendor', {}, 'Error fetching vendors')
}

export function getDeviceTypes() {
  return get('/ied/get-type', {}, 'Error fetching device types')
}

export function getModel(vendorCode, typeCode) {
  return get('/ied/get-model', { vendorCode, typeCode }, `Error fetching models for vendorCode=${vendorCode}, typeCode=${typeCode}`)
}

export async function importDevice(file, iedId) {
  const formData = new FormData()
  formData.append('file', file)
  
  const data = await post('/ied/import', formData, {
    params: { iedId },
    headers: { 'Content-Type': 'multipart/form-data' }
  }, 'Error importing device')
  
  console.log('Import response:', data)
  return data
}

export function createDevice(deviceData) {
  return post('/ied/create', deviceData, {
    headers: {
      'accept': '*/*',
      'Content-Type': 'application/json'
    }
  }, 'Error creating device')
}

export function getIedInfoById(iedId) {
  return get('/ied-info/by-ied', { iedId }, `Error fetching IED info for id=${iedId}`)
}

export function updateDeviceParameters(parameterGroups) {
  return post('/ied/update/parameter', parameterGroups, {
    headers: {
      'accept': '*/*',
      'Content-Type': 'application/json'
    }
  }, 'Error updating device parameters')
}

export async function deleteDevice(iedId) {
  const data = await del('/ied', { iedId }, 'Error deleting device')
  console.log('Delete response:', data)
  return data
}

export function getHardwareByIed(iedId) {
  return get('/hardware/by-ied', { iedId }, `Error fetching hardware for iedId=${iedId}`)
}
