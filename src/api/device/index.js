import axios from 'axios';

const API_BASE_URL = 'http://192.168.4.50:8082/api';

export async function getVendors() {
  try {
    const response = await axios.get(`${API_BASE_URL}/ied/get-vendor`);
    return response.data;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
}

export async function getDeviceTypes() {
  try {
    const response = await axios.get(`${API_BASE_URL}/ied/get-type`);
    return response.data;
  } catch (error) {
    console.error('Error fetching device types:', error);
    throw error;
  }
}

export async function getModel(vendorCode, typeCode) {
  try {
    const response = await axios.get(`${API_BASE_URL}/ied/get-model`, {
      params: { vendorCode, typeCode }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching models for vendorCode=${vendorCode}, typeCode=${typeCode}:`, error);
    throw error;
  }
}
export async function importDevice(file, iedId) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_BASE_URL}/ied/import`, formData, {
      params: { iedId },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('Import response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error importing device:', error.message, error.response?.data);
    throw error;
  }
}
export async function createDevice(deviceData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/ied/create`, deviceData, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating device:', error);
    throw error;
  }
}