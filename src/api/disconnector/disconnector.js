import client from '@/utils/client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'disconnector'

export const findByLocationId = (location_id) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/findByLocationId/${location_id}`)
}

export const deleteAll = (circuitList) => {
    return client.post(`${API_PREFIX}/${RESOURCE}/delete`, circuitList)
}

export const save = (circuitList) => {
    return client.post(`${API_PREFIX}/${RESOURCE}/save`, circuitList)
}

export const findAssetByLocationId = (locationId, stt, sl) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/findAssetByLocationId/` + locationId + "/" + stt + "/" + sl)
}

export const countAssetByLocationId = (locationId) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/countAssetByLocationId/` + locationId)
}

export const countAssetList = () => {
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