import client from '@/api/client';

export async function getOrganisationById(organisationId) {
  if (!organisationId) {
    throw new Error('organisationId is required');
  }

  try {
    const response = await client.get(`/organisation/${organisationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching organisation id=${organisationId}:`, error);
    throw error;
  }
}

export async function createOrganisation(payload) {
  try {
    const response = await client.post('/organisation/create', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating organisation:', error);
    throw error;
  }
}

export async function deleteOrganisation(organisationId) {
  if (!organisationId && organisationId !== 0) {
    throw new Error('organisationId is required');
  }
  try {
    const response = await client.delete('/organisation/delete', {
      params: { orId: organisationId },
      headers: { accept: '*/*' },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting organisation id=${organisationId}:`, error);
    throw error;
  }
}

export async function getDeviceListByOrganisation(organisationId) {
  if (!organisationId) throw new Error('organisationId is required');
  try {
    const response = await client.get('/organisation/device-list', {
      params: { organisationId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching device list for organisation id=${organisationId}:`, error);
    throw error;
  }
}
