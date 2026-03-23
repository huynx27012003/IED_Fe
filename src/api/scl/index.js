import client from '@/api/client';

/**
 * Import an SCL file content.
 *
 * @param {string} fileContent - Raw SCL content (string or base64) required by backend.
 * @returns {Promise<any>} API response data.
 */
export async function importScl(file, iedId = null) {
  if (!file) {
    throw new Error('file is required');
  }

  try {
    const formData = new FormData();
    formData.append('file', file, file.name || 'scl-file');
    const hasIedId = iedId != null && iedId !== '';

    const response = await client.post(
      '/scl/import',
      formData,
      {
        params: hasIedId ? { iedId } : undefined,
        headers: {
          accept: '*/*',
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error importing SCL file:', error);
    throw error;
  }
}

export async function getSclSnapshot({ iedId, sclId = '' } = {}) {
  try {
    const params = {
      sclId,
      iedId,
    };

    const response = await client.get('/scl', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching SCL snapshot:', error);
    throw error;
  }
}

export async function listSclImports() {
  try {
    const response = await client.get('/scl/list');
    return response.data;
  } catch (error) {
    console.error('Error fetching SCL import list:', error);
    throw error;
  }
}

export async function filterSclSnapshot({ sclId = "", iedId = "", name } = {}) {
  try {
    const params = {
      sclId,
      iedId,
      name,
    };
    const response = await client.get('/scl/filter', { params });
    return response.data;
  } catch (error) {
    console.error('Error filtering SCL snapshot:', error);
    throw error;
  }
}
