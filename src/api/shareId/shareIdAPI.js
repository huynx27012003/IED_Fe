import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'shareId'

export const generateShareId =  async () => {
    return client.get(`${API_PREFIX}/${RESOURCE}`)
}