import client from './client'
import { logApiError } from '@/helpers/apiFeedback'

export const searchItems = async (keyword) => {
  try {
    const response = await client.get('/search-box', {
      params: { keyword }
    })
    return response.data
  } catch (error) {
    logApiError(error, 'Error searching keyword')
    throw error
  }
}

export const addNewAssociation = async (classId, associationData) => {
  try {
    const response = await client.post(`/association/${classId}`, associationData)
    return response.data
  } catch (error) {
    logApiError(error, 'Error adding new association')
    throw error
  }
}

export const getAssociationByAttrId = async (attrId) => {
  try {
    const response = await client.get('/association', {
      params: { attrId }
    })
    return response.data
  } catch (error) {
    logApiError(error, 'Error fetching association by attrId')
    throw error
  }
}

export const updateAssociation = async (associationData) => {
  try {
    const response = await client.put('/association', associationData)
    return response.data
  } catch (error) {
    logApiError(error, 'Error updating association')
    throw error
  }
}

export const deleteAssociation = async (assocId) => {
  try {
    const response = await client.delete('/association', {
      params: { assocId }
    })
    return response.data
  } catch (error) {
    logApiError(error, 'Error deleting association')
    throw error
  }
}
