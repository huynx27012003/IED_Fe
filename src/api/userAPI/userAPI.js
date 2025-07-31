import client from '@/utils/client'
const API_PREFIX = 'api/v1'

export const getAllUser = () => {
    return client.get(`${API_PREFIX}/users`)
}

export const insertUser = (user) => {
    return client.post(`${API_PREFIX}/users`, user)
}

export const updateAllInfoUser = (user, id) => {
    return client.put(`${API_PREFIX}/users/usersAllInfo/` + id, user)
}

export const deleteUser = (id) => {
    return client.delete(`${API_PREFIX}/users/` + id)
}

export const removeUser = (id) => {
    return client.delete(`${API_PREFIX}/users/remove/` + id)
}

export const updateUserGroup = (id, grouplist) => {
    return client.put(`${API_PREFIX}/users/` + id + `/update-group?groupNames=` + grouplist)
}

export const findUserByCreated = (userId, st, sl) => {
    return client.get(`${API_PREFIX}/users/findUserByCreated/` + userId + "/" + st + "/" + sl)
}

export const countUserByCreated = (userId) => {
    return client.get(`${API_PREFIX}/users/countUserByCreated/` + userId)
}

export const searchByColumn = (userId, column, value, st, limit) => {
    return client.get(`${API_PREFIX}/users/searchByColumn/` + userId + "/" + column + "/" + value + "/" + st + "/" + limit)
}

export const getUserById = (id) => {
    return client.get(`${API_PREFIX}/users/` + id)
}

export const getDataByIncludes = (user, st, sl) => {
    return client.post(`${API_PREFIX}/users/getDataByIncludes/` + st + "/" + sl, user)
}

export const countDataByIncludes = (user) => {
    return client.post(`${API_PREFIX}/users/countDataByIncludes`, user)
}