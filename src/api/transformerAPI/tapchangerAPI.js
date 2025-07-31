import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'tapChangers'

export const createTapChanger = (data) => {
    return client.post(`${API_PREFIX}/${RESOURCE}`, data)
}