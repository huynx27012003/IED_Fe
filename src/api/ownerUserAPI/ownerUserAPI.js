import client from '@/utils/client'
const API_PREFIX = 'api/v1'

export const countOwnerUserByCreated = (userId) => {
    return client.get(`${API_PREFIX}/ownerUser/countOwnerUserByCreated/` + userId)
}

export const findOwnerUserByCreated = (userId, st, sl) => {
    return client.get(`${API_PREFIX}/ownerUser/findOwnerUserByCreated/` + userId + "/" + st + "/" + sl)
}

export const insertOwnerUser = (user) => {
    return client.post(`${API_PREFIX}/ownerUser/created`, user)
}

export const updateAllInfoOwnerUser = (user, id) => {
    return client.put(`${API_PREFIX}/ownerUser/ownerUserAllInfo/` + id, user)
}

export const deleteOwnerUser = (id) => {
    return client.delete(`${API_PREFIX}/ownerUser/` + id)
}

export const removeOwnerUser = (id) => {
    return client.delete(`${API_PREFIX}/ownerUser/remove/` + id)
}

export const getDataByIncludes = (user, st, sl) => {
    return client.post(`${API_PREFIX}/ownerUser/getDataByIncludes/` + st + "/" + sl, user)
}

export const countDataByIncludes = (user) => {
    return client.post(`${API_PREFIX}/ownerUser/countDataByIncludes`, user)
}

export const findById = (id) => {
    return client.get(`${API_PREFIX}/ownerUser/` + id)
}