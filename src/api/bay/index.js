import client from '@/api/client';
import { logApiError } from '@/helpers/apiFeedback';

export async function createBay(payload) {
    try {
        const response = await client.post('/bay/create', payload, {
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        logApiError(error, 'Error creating bay');
        throw error;
    }
}

export async function updateBay(payload) {
    try {
        const response = await client.post('/bay/update', payload, {
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        logApiError(error, 'Error updating bay');
        throw error;
    }
}

export async function deleteBay(bayId) {
    if (!bayId && bayId !== 0) {
        throw new Error('bayId is required');
    }
    try {
        const response = await client.delete('/bay/delete', {
            params: { bayId: bayId },
            headers: { accept: '*/*' },
        });
        return response.data;
    } catch (error) {
        logApiError(error, `Error deleting bay id=${bayId}`);
        throw error;
    }
}

export async function getDeviceListByBay(bayId) {
    if (!bayId) throw new Error('bayId is required');
    try {
        const response = await client.get('/bay/device-list', {
            params: { bayId }
        });
        return response.data;
    } catch (error) {
        logApiError(error, `Error fetching device list for bay id=${bayId}`);
        throw error;
    }
}

export async function getBayById(bayId) {
    if (bayId === undefined || bayId === null || bayId === '') {
        throw new Error('bayId is required');
    }
    try {
        const response = await client.get(`/bay/${bayId}`, {
            headers: { accept: 'application/json' },
        });
        return response.data;
    } catch (error) {
        logApiError(error, `Error fetching bay id=${bayId}`);
        throw error;
    }
}
