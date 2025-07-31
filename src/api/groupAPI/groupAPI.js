import client from '@/utils/client'
const API_PREFIX = 'api/v1'

export const getAllGroup = () => {
    return client.get(`${API_PREFIX}/groups`)
}

export const getGroup = (stt, sl) => {
    return client.get(`${API_PREFIX}/groups/getGroup/` + stt + "/" + sl)
}

export const countGroup = () => {
    return client.get(`${API_PREFIX}/groups/countGroup`)
}

export const createGroup = (group) => {
    return client.post(`${API_PREFIX}/groups`, group)
}

export const deleteGroup = (id) => {
    return client.delete(`${API_PREFIX}/groups/` + id)
}

export const removeGroup = (id) => {
    return client.delete(`${API_PREFIX}/groups/remove/` + id)
}

export const updateGroup = (id, group) => {
    return client.put(`${API_PREFIX}/groups/` + id, group)
}

export const findGroupById = (id) => {
    return client.get(`${API_PREFIX}/groups/findGroupById/` + id)
}