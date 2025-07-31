import client from '@/utils/client'
const API_PREFIX = 'api/v1'

export const findLocationByRefId = (ref_id, stt, sl) => {
    return client.get(`${API_PREFIX}/locations/findLocationByRefId/${ref_id}/${stt}/${sl}`)
}

export const findAllLocationByRefId = (ref_id) => {
    return client.get(`${API_PREFIX}/locations/findAllLocationByRefId/${ref_id}`)
}

export const countLocationByRefId = (ref_id) => {
    return client.get(`${API_PREFIX}/locations/countLocationByRefId/${ref_id}`)
}

export const findAllLocationByCreatedAndCollab = (mode, stt, sl) => {
    return client.get(`${API_PREFIX}/locations/findAllLocationByCreatedAndCollab/${mode}/${stt}/${sl}`)
}

export const countAllLocationByCreatedAndCollab = (mode) => {
    return client.get(`${API_PREFIX}/locations/countAllLocationByCreatedAndCollab/${mode}`)
}

export const findAllLocationByField = (locationData, stt, sl) => {
    return client.post(`${API_PREFIX}/locations/findAllLocationByField/${stt}/${sl}`, locationData)
}

export const countAllLocationByField = (locationData) => {
    return client.post(`${API_PREFIX}/locations/countAllLocationByField`, locationData)
}

export const createLocation = (locationData) => {
    return client.post(`${API_PREFIX}/locations`, locationData)
}

export const updateLocation = (locationData) => {
    return client.put(`${API_PREFIX}/locations/${locationData.id}`, locationData)
}

export const getLocationById = (id) => {
    return client.get(`${API_PREFIX}/locations/${id}`)
}

export const updateLocationLite = (locationData) => {
    return client.post(`${API_PREFIX}/locations/updateLite/${locationData.id}`, locationData)
}

export const removeLocation = (id) => {
    return client.delete(`${API_PREFIX}/locations/delete/${id}`)
}

export const lockLocation = (listId) => {
    const data = {
        listId
    }
    return client.put(`${API_PREFIX}/locations/lock`, data)
}

export const unlockLocation = (listId) => {
    const data = {
        listId
    }
    return client.put(`${API_PREFIX}/locations/unlock`, data)
}

export const collab = (id, listId) => {
    const data = {
        listId
    }
    return client.put(`${API_PREFIX}/locations/${id}/updateCollabs`, data)
}

export const getLocationInList = (ids) => {
    return client.post(`${API_PREFIX}/locations/getLocationInList`, ids)
}

export const countLocationsByRefIdOwnerAndModeAndCreatedBy = (mode) => {
    return client.get(`${API_PREFIX}/locations/countLocationsByRefIdOwnerAndModeAndCreatedBy/${mode}`)
}

export const countLocationsByCreatedByAndCollab = () => {
    return client.get(`${API_PREFIX}/locations/countLocationsByCreatedByAndCollab`)
}

export const countLocationsModeByCreatedByAndCollab = (mode) => {
    return client.get(`${API_PREFIX}/locations/countLocationsModeByCreatedByAndCollab/${mode}`)
}

export const addLocationByOwnerFullName = (listData) => {
    return client.post(`${API_PREFIX}/locations/addLocationByOwnerFullName`,listData)
}
