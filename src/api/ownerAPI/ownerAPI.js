import client from '@/utils/client'
const API_PREFIX = 'api/v1'

export const getAllOwner = () => {
    return client.get(`${API_PREFIX}/owner/findAll`)
}

export const findById = (id) => {
    return client.get(`${API_PREFIX}/owner/findById/${id}`)
}

export const createOwner = (owner) => {
    return client.post(`${API_PREFIX}/owner/create`, owner)
}

export const removeOwner = (owner) => {
    return client.post(`${API_PREFIX}/owner/remove`, owner)
}

export const updateOwner = (owner) => {
    return client.post(`${API_PREFIX}/owner/update`, owner)
}

export const deleteOwner = (owner, sign) => {
    return client.post(`${API_PREFIX}/owner/delete/` + sign, owner)
}

export const getAllOwnerAndParent = () => {
    return client.get(`${API_PREFIX}/owner/getAllOwnerAndParent`)
}

export const changeOwner = (id, ownerId) => {
    return client.post(`${API_PREFIX}/owner/changeOwner/` + ownerId + "/" + id)
}

export const countByCreated = (created_by) => {
    return client.get(`${API_PREFIX}/owner/countByCreated/` + created_by)
}

export const countByRefId = (ref_id) => {
    return client.get(`${API_PREFIX}/owner/countByRefId/` + ref_id)
}

export const findByCreated = (created_by, stt, sl) => {
    return client.get(`${API_PREFIX}/owner/findByCreated/` + created_by + "/" + stt + "/" + sl)
}

export const findByRef = (ref_id, stt, sl) => {
    return client.get(`${API_PREFIX}/owner/findByRef/` + ref_id + "/" + stt + "/" + sl)
}

export const countByCreatedAndPre = () => {
    return client.get(`${API_PREFIX}/owner/count/`)
}

export const findByCreatedAndPre = (stt, sl, pre) => {
    return client.get(`${API_PREFIX}/owner/findByCreatedAndPre/` + pre + "/" + stt + "/" + sl)
}

export const findParent = (role) => {
    return client.get(`${API_PREFIX}/owner/findParent/` + role)
}

export const getDataByIncludes = (owner, st, sl) => {
    return client.post(`${API_PREFIX}/owner/getDataByIncludes/` + st + "/" + sl, owner)
}

export const countDataByIncludes = (owner) => {
    return client.post(`${API_PREFIX}/owner/countDataByIncludes`, owner)
}

export const countAllOwnerByIds = () => {
    return client.get(`${API_PREFIX}/owner/countAllOwnerByIds`)
}

export const countAllOwnerByIdsAndMode = (mode) => {
    return client.get(`${API_PREFIX}/owner/countAllOwnerByIdsAndMode/${mode}`)
}