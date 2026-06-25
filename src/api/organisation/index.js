import client from '@/api/client';
import { logApiError } from '@/helpers/apiFeedback';

export async function getOrganisationById(organisationId) {
  if (!organisationId) {
    throw new Error('organisationId is required');
  }

  try {
    const response = await client.get(`/organisation/${organisationId}`);
    return response.data;
  } catch (error) {
    logApiError(error, `Error fetching organisation id=${organisationId}`);
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
    logApiError(error, 'Error creating organisation');
    throw error;
  }
}

export async function updateOrganisation(payload) {
  try {
    const response = await client.post('/organisation/update', payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    logApiError(error, 'Error updating organisation');
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
    logApiError(error, `Error deleting organisation id=${organisationId}`);
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
    logApiError(error, `Error fetching device list for organisation id=${organisationId}`);
    throw error;
  }
}

export async function importOrganisationScd(file, organisationId) {
  if (!file) {
    throw new Error('file is required');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await client.post('/organisation/import-scd', formData, {
      params: {
        orgId: organisationId,
      },
      headers: {
        accept: '*/*',
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    logApiError(error, `Error importing SCD for organisation id=${organisationId}`);
    throw error;
  }
}

export async function exportOrganisationScd(organisationId) {
  if (!organisationId && organisationId !== 0) {
    throw new Error('organisationId is required');
  }

  try {
    const response = await client.get('/organisation/export-scd', {
      params: { organisationId },
      responseType: 'blob',
      headers: {
        accept: 'application/xml',
      },
    });
    return response;
  } catch (error) {
    logApiError(error, `Error exporting SCD for organisation id=${organisationId}`);
    throw error;
  }
}
