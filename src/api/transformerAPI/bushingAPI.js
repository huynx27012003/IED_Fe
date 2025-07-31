import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'bushings'

export const createBushing = (data) => {
    return client.post(`${API_PREFIX}/${RESOURCE}`, data)
}