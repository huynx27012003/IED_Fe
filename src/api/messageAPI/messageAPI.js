import client from '@/utils/client'
const API_PREFIX = 'api/v1'

export const getUserByNameAndEmail = (data) => {
    return client.get(`${API_PREFIX}/message/${data}`)
}

export const insertGroupList = (data) => {
    return client.post(`${API_PREFIX}/message/insert`, data)
}

export const getGroupList = (stt, sl) => {
    return client.get(`${API_PREFIX}/message/getMessage/${stt}/${sl}`)
}

export const insertMessage = (data) => {
    return client.post(`${API_PREFIX}/message/content/insert`, data)
}

export const getMessage = (groupId, stt, sl) => {
    return client.get(`${API_PREFIX}/message/content/getMessage/${groupId}/${stt}/${sl}`)
}

export const getAllMessageByUnread = (groupId) => {
    return client.get(`${API_PREFIX}/message/content/getAllMessageByUnread/${groupId}`)
}

export const getMessageById = (id, groupId) => {
    return client.get(`${API_PREFIX}/message/content/getMessageById/${id}/${groupId}`)
}

export const checkIfExist = (name) => {
    return client.get(`${API_PREFIX}/message/firebase/checkIfExist/${name}`)
}

export const markAsRead = (id) => {
    return client.get(`${API_PREFIX}/message/firebase/markAsRead/${id}`)
}

export const markAsReadArr = (ids) => {
    return client.post(`${API_PREFIX}/message/firebase/markAsRead`,ids)
}

export const markAsSeenArr = (ids) => {
    return client.post(`${API_PREFIX}/message/markAsSeenArr`,ids)
}

export const getSingleGroupListByTypeAndId = (type, other) => {
    return client.get(`${API_PREFIX}/message/getSingleGroupListByTypeAndId/${type}/${other}`)
}

export const getGroupListByTypeAndId = (type) => {
    return client.get(`${API_PREFIX}/message/getGroupListByTypeAndId/${type}`)
}

export const updateMessage = (lastMessage, lastMessageAt, id) => {
    return client.post(`${API_PREFIX}/message/updateMessage/${lastMessage}/${id}`,lastMessageAt)
}

export const deleteGroup = (id) => {
    return client.get(`${API_PREFIX}/message/deleteGroup/${id}`)
}

export const getMemberOfGroup = (groupId) => {
    return client.get(`${API_PREFIX}/message/getMemberOfGroup/${groupId}`)
}

export const renameGroup = (groupId, name) => {
    return client.post(`${API_PREFIX}/message/rename/${groupId}/${name}`)
}

export const addMemberToGroup = (groupId, ids) => {
    return client.post(`${API_PREFIX}/message/addMemberToGroup/${groupId}`, ids)
}

export const deleteMember = (groupId, id) => {
    return client.post(`${API_PREFIX}/message/deleteMember/${groupId}/${id}`)
}