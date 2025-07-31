import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'assets'

export const createdTransformer = (data) => {
    return client.post(`${API_PREFIX}/${RESOURCE}`, data)
}

export const countAssetByLocationId = (locationId) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/countAssetByLocationId/` + locationId)
}

export const countAssetList = async () => {
    return client.get(`${API_PREFIX}/${RESOURCE}/countAssetList`)
}

export const findAssetList = (stt, sl) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/findAssetList/${stt}/${sl}`)
}

export const findAssetListOffset = (stt, sl) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/findAssetListOffset/${stt}/${sl}`)
}

export const countAssetListByLocationIdOffset = (locationId) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/countAssetListByLocationIdOffset/${locationId}`)
}

export const findAssetListByLocationIdOffset = (locationId, stt, sl) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/findAssetListByLocationIdOffset/${locationId}/${stt}/${sl}`)
}

export const updateAssetLite = (data, id) => {
    return client.put(`${API_PREFIX}/${RESOURCE}/updateAssetLite/${id}`, data)
}

export const getAssetById = (id) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/getAssetById/${id}`)
}