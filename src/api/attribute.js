import client from './client'

export const getAllAttributes = (page, size) => {
  if (page != null && size != null) {
    return client
      .get('/attribute', { params: { page, size } })
      .then(res => res.data)
  } else {
    return client.get('/attribute').then(res => res.data)
  }
}

export const searchAttributeByClassId = (classId) => {
  return client
    .get('/attribute/search-class-id', { params: { classId } })
    .then(res => res.data)
}

export const findAttributeByName = async (name) => {
  try {
    const response = await client.get('/attribute/search-name', {
      params: { keyword: name },
    })
    return response.data
  } catch (error) {
    console.error('Error finding attribute by name:', error)
    throw error
  }
}

export const updateAttribute = async (attributeData) => {
  try {
    const response = await client.put('/attribute', attributeData)
    return response.data
  } catch (error) {
    console.error('Error updating attribute:', error)
    throw error
  }
}

export const addAttributeToClass = async (classId, attributeData) => {
  try {
    const response = await client.post(
      `/attribute/${classId}`,
      attributeData
    )
    return response.data
  } catch (error) {
    console.error('Error adding attribute to class:', error)
    throw error
  }
}

export const findAttributeById = async (id) => {
  try {
    const response = await client.get('/attribute/seach-id', {
      params: { id }
    })
    return response.data
  } catch (error) {
    console.error('Error finding attribute by id:', error)
    throw error
  }
}

export const deleteAttributeById = async (attrId) => {
  try {
    const response = await client.delete('/attribute/by-id', {
      params: { attrId }
    })
    return response.data
  } catch (error) {
    console.error('Error deleting attribute:', error)
    throw error
  }
}

export const deleteAttributeByName = async (name) => {
  try {
    const response = await client.delete('/attribute/by-name', {
      params: { name }
    })
    return response.data
  } catch (error) {
    console.error('Error deleting attribute by name:', error)
    throw error
  }
}