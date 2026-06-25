import client from '@/api/client';
import { logApiError } from '@/helpers/apiFeedback';

export async function createVoltageLevel(payload) {
    try {
        const response = await client.post('/voltage-level/create', payload, {
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        logApiError(error, 'Error creating voltage level');
        throw error;
    }
}

export async function updateVoltageLevel(payload) {
    try {
        const response = await client.post('/voltage-level/update', payload, {
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        logApiError(error, 'Error updating voltage level');
        throw error;
    }
}

export async function deleteVoltageLevel(voltageLevelId) {
  if (!voltageLevelId && voltageLevelId !== 0) {
    throw new Error('voltageLevelId is required');
  }
  try {
        const response = await client.delete('/voltage-level/delete', {
            params: { voltageLevelId: voltageLevelId },
            headers: { accept: '*/*' },
        });
        return response.data;
    } catch (error) {
        logApiError(error, `Error deleting voltage level id=${voltageLevelId}`);
        throw error;
  }
}

export async function getVoltageLevelById(voltageLevelId) {
  if (voltageLevelId === undefined || voltageLevelId === null || voltageLevelId === '') {
    throw new Error('voltageLevelId is required');
  }
  try {
    const response = await client.get(`/voltage-level/${voltageLevelId}`, {
      headers: { accept: 'application/json' },
    });
    return response.data;
  } catch (error) {
    logApiError(error, `Error fetching voltage level id=${voltageLevelId}`);
    throw error;
  }
}

export async function getDeviceListByVoltageLevel(voltageLevelId) {
  if (!voltageLevelId) throw new Error('voltageLevelId is required');
  try {
    const response = await client.get('/voltage-level/device-list', {
      params: { voltageLevelId }
        });
        return response.data;
    } catch (error) {
        logApiError(error, `Error fetching device list for voltage level id=${voltageLevelId}`);
        throw error;
    }
}
