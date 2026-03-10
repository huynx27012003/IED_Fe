import client from '@/api/client';

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
        console.error('Error creating bay:', error);
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
        console.error(`Error deleting bay id=${bayId}:`, error);
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
        console.error(`Error fetching device list for bay id=${bayId}:`, error);
        throw error;
    }
}
