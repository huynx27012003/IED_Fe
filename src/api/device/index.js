import { get, post, del } from '@/api/helpers'
import client from '@/api/client'
import { logApiError } from '@/helpers/apiFeedback'

export function getVendors() {
  return get('/ied/get-vendor', {}, 'Error fetching vendors')
}

export function getDeviceTypes() {
  return get('/ied/get-type', {}, 'Error fetching device types')
}

export function getModel(vendorCode, typeCode) {
  return get('/ied/get-model', { vendorCode, typeCode }, `Error fetching models for vendorCode=${vendorCode}, typeCode=${typeCode}`)
}

export function getAllActiveIeds() {
  return get('/ied/get-all', {}, 'Error fetching active IED list')
}

export async function importDevice(file, iedId) {
  const formData = new FormData()
  formData.append('file', file)
  
  const data = await post('/ied/import', formData, {
    params: { iedId },
    headers: { 'Content-Type': 'multipart/form-data' }
  }, 'Error importing device')
  
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

export function getIedById(iedId) {
  return get(`/ied/${iedId}`, {}, `Error fetching IED for id=${iedId}`)
}

export function updateIed(iedData) {
  return post('/ied/update', iedData, {
    headers: {
      'accept': '*/*',
      'Content-Type': 'application/json'
    }
  }, 'Error updating IED')
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
  return data
}

export function getHardwareByIed(iedId) {
  return get('/hardware/by-ied', { iedId }, `Error fetching hardware for iedId=${iedId}`)
}

export function getCompareSettingTrees(leftIedId, rightIedId) {
  return get(
    '/ied/compare-parameter',
    { leftIedId, rightIedId },
    `Error comparing settings for leftIedId=${leftIedId}, rightIedId=${rightIedId}`
  )
}

export async function exportIedXrio(iedId) {
  if (!iedId && iedId !== 0) {
    throw new Error('iedId is required');
  }
  try {
    const response = await client.get('/ied/export/xrio/f67', {
      params: { iedId },
      responseType: 'blob',
      headers: {
        accept: '*/*',
      },
    });
    return response;
  } catch (error) {
    logApiError(error, `Error exporting IED XRIO for iedId=${iedId}`);
    throw error;
  }
}

export async function exportBbtnDocx(iedId, groupNumber = 1) {
  if (!iedId && iedId !== 0) {
    throw new Error('iedId is required');
  }
  try {
    const response = await client.get('/ied/export/bbtn-docx', {
      params: { iedId, groupNumber },
      responseType: 'blob',
      headers: {
        accept: '*/*',
      },
    });
    return response;
  } catch (error) {
    logApiError(error, `Error exporting BBTN DOCX for iedId=${iedId}`);
    throw error;
  }
}

export async function exportPcdDocx(iedId, groupNumber = 1) {
  if (!iedId && iedId !== 0) {
    throw new Error('iedId is required');
  }
  try {
    const response = await client.get('/ied/export/pcd-docx', {
      params: { iedId, groupNumber },
      responseType: 'blob',
      headers: {
        accept: '*/*',
      },
    });
    return response;
  } catch (error) {
    logApiError(error, `Error exporting PCD DOCX for iedId=${iedId}`);
    throw error;
  }
}
