import client from '@/utils/client'
const API_PREFIX = 'api/v1'

export const createManu = (data) => {
    return client.post(`${API_PREFIX}/manu/insert`, data)
}

export const getManuByName = (name) => {
    return client.get(`${API_PREFIX}/manu/getManuByName/${name}`)
}

export const getManuByType = (type) => {
    return client.get(`${API_PREFIX}/manu/getManuByType/${type}`)
}

export const findById = (id) => {
    return client.get(`${API_PREFIX}/manu/findById/${id}`)
}

export const updateManuById = (id, data) => {
    return client.post(`${API_PREFIX}/manu/updateManuById/${id}`, data)
}

export const deleteManu = (data) => {
    return client.post(`${API_PREFIX}/manu/deleteManu`, data)
}