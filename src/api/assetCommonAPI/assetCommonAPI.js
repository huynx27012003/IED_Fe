import client from './client'

const API_PREFIX = 'api/v1'
const RESOURCE = 'assetCommon'


export const countAsset = () => {
    return client.get(`${API_PREFIX}/${RESOURCE}/countAsset`)
}

export const getAsset = (asset_name, stt, sl) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/getAsset/${asset_name}/${stt}/${sl}`)
}

export const findAllAssetByField = (data, stt, sl) => {
    return client.post(`${API_PREFIX}/${RESOURCE}/findAllAssetByField/${stt}/${sl}`, data)
}

export const countAllAssetByField = async (data) => {
    return client.post(`${API_PREFIX}/${RESOURCE}/countAllAssetByField`, data)
}

export const countAssetListByLocationId = async (locationId) => {
    return client.get(`${API_PREFIX}/${RESOURCE}/countAssetListByLocationIdOffset/${locationId}`)
}