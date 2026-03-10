import client from '@/api/client';

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
        console.error('Error creating voltage level:', error);
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
        console.error(`Error deleting voltage level id=${voltageLevelId}:`, error);
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
    console.error(`Error fetching voltage level id=${voltageLevelId}:`, error);
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
        console.error(`Error fetching device list for voltage level id=${voltageLevelId}:`, error);
        throw error;
    }
}
