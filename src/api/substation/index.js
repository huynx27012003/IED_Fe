import client from '@/api/client';
import { logApiError } from '@/helpers/apiFeedback';

export async function createSubstation(payload) {
  try {
    const response = await client.post('/substation/create', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    logApiError(error, 'Error creating substation');
    throw error;
  }
}

export async function updateSubstation(payload) {
  try {
    const response = await client.post('/substation/update', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    logApiError(error, 'Error updating substation');
    throw error;
  }
}

export async function deleteSubstation(substationId) {
  if (!substationId && substationId !== 0) {
    throw new Error('substationId is required');
  }
  try {
    const response = await client.delete('/substation/delete', {
      params: { id: substationId },
      headers: { accept: '*/*' },
    });
    return response.data;
  } catch (error) {
    logApiError(error, `Error deleting substation id=${substationId}`);
    throw error;
  }
}

export async function getSubstationById(substationId) {
  if (substationId === undefined || substationId === null || substationId === '') {
    throw new Error('substationId is required');
  }
  try {
    const response = await client.get(`/substation/${substationId}`, {
      headers: { accept: 'application/json' },
    });
    return response.data;
  } catch (error) {
    logApiError(error, `Error fetching substation id=${substationId}`);
    throw error;
  }
}

export async function getDeviceListBySubstation(substationId) {
  if (!substationId) throw new Error('substationId is required');
  try {
    const response = await client.get('/substation/device-list', {
      params: { substationId }
    });
    return response.data;
  } catch (error) {
    logApiError(error, `Error fetching device list for substation id=${substationId}`);
    throw error;
  }
}
