import client from '@/api/client';
import { logApiError } from '@/helpers/apiFeedback';

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
    logApiError(error, 'Error importing SCL file');
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
    logApiError(error, 'Error fetching SCL snapshot');
    throw error;
  }
}

export async function listSclImports() {
  try {
    const response = await client.get('/scl/list');
    return response.data;
  } catch (error) {
    logApiError(error, 'Error fetching SCL import list');
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
    logApiError(error, 'Error filtering SCL snapshot');
    throw error;
  }
}

export async function exportSclByIed(iedId) {
  if (iedId == null || iedId === "") {
    throw new Error("iedId is required");
  }

  try {
    const response = await client.get("/scl/export", {
      params: { iedId },
      responseType: "blob",
      headers: {
        accept: "*/*",
      },
    });
    return response;
  } catch (error) {
    logApiError(error, `Error exporting SCL for iedId=${iedId}`);
    throw error;
  }
}

export async function exportSignalList(mode, id) {
  if (!mode) {
    throw new Error("mode is required");
  }
  if (id == null || id === "") {
    throw new Error("id is required");
  }

  try {
    const response = await client.get("/scl/export/signal-list", {
      params: { mode, id },
      responseType: "blob",
      headers: {
        accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
    return response;
  } catch (error) {
    logApiError(error, `Error exporting Signal List for mode=${mode}, id=${id}`);
    throw error;
  }
}
