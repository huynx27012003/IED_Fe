import client from '@/api/client';

/**
 * Import an SCL file content.
 *
 * @param {string} fileContent - Raw SCL content (string or base64) required by backend.
 * @returns {Promise<any>} API response data.
 */
export async function importScl(file) {
  if (!file) {
    throw new Error('file is required');
  }

  try {
    const formData = new FormData();
    formData.append('file', file, file.name || 'scl-file');

    const response = await client.post(
      '/scl/import',
      formData,
      {
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
