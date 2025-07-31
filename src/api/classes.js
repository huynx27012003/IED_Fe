import client from './client'

export const fetchClasses = async (page, size) => {
  try {
    const params = {}
    if (page != null && size != null) {
      params.page = page
      params.size = size
    }
    const response = await client.get('/class', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching classes:', error)
    throw error
  }
}

export const searchClassesByName = async (keyword) => {
  try {
    const response = await client.get('/class/search', {
      params: { keyword },
    })
    return response.data
  } catch (error) {
    console.error('Error searching classes:', error)
    throw error
  }
}

export const findClassByName = async (name) => {
  try {
    const response = await client.get('/class/search', {
      params: { keyword: name },
    })
    return response.data
  } catch (error) {
    console.error('Error finding class by name:', error)
    throw error
  }
}

export const fetchClassFullAttributes = async (classId) => {
  try {
    const response = await client.get('/class/full-detail', {
      params: { classId },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching class attributes:', error)
    throw error
  }
}

export const Classinheritances = async (classId) => {
  try {
    const response = await client.get('/class/inheritances', {
      params: { classId },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching class attributes:', error)
    throw error
  }
}

export const updateClass = async (classData) => {
  try {
    const response = await client.put('/class', classData)
    return response.data
  } catch (error) {
    console.error('Error updating class:', error)
    throw error
  }
}

export const addClass = async (classData) => {
  try {
    const response = await client.post('/class', classData)
    return response.data
  } catch (error) {
    console.error('Error adding class:', error)
    throw error
  }
}

export const deleteClass = async (classId) => {
  try {
    const response = await client.delete('/class', {
      params: { classId }
    })
    return response.data
  } catch (error) {
    console.error('Error deleting class:', error)
    throw error
  }
}

export const fetchClassById = async (classId) => {
  try {
    const response = await client.get('/class/get', {
      params: { classId },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching class by id:', error)
    throw error
  }
}