import client from "@/api/client";
import { logApiError } from "@/helpers/apiFeedback";

export async function getAttachmentsByAsset(assetType, assetId) {
  if (!assetType) throw new Error("assetType is required");
  if (assetId === null || assetId === undefined || assetId === "") {
    throw new Error("assetId is required");
  }

  try {
    const response = await client.get("/asset/attachment", {
      params: { assetType, assetId },
      headers: { accept: "application/json" },
    });
    return response.data;
  } catch (error) {
    logApiError(error, `Error fetching attachments for assetType=${assetType}, assetId=${assetId}`);
    throw error;
  }
}

export async function downloadAttachmentById(attachmentId) {
  if (attachmentId === null || attachmentId === undefined || attachmentId === "") {
    throw new Error("attachmentId is required");
  }

  try {
    const response = await client.get("/asset/attachment/download", {
      params: { attachmentId },
      responseType: "blob",
      headers: { accept: "*/*" },
    });
    return response;
  } catch (error) {
    logApiError(error, `Error downloading attachment id=${attachmentId}`);
    throw error;
  }
}

export async function uploadAttachment(assetType, assetId, file) {
  if (!assetType) throw new Error("assetType is required");
  if (assetId === null || assetId === undefined || assetId === "") {
    throw new Error("assetId is required");
  }
  if (!file) throw new Error("file is required");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await client.post("/asset/attachment", formData, {
      params: { assetType, assetId },
      headers: {
        accept: "*/*",
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    logApiError(error, `Error uploading attachment for assetType=${assetType}, assetId=${assetId}`);
    throw error;
  }
}

export async function deleteAttachments(attachmentIds) {
  if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
    throw new Error("attachmentIds array is required and must not be empty");
  }

  try {
    const response = await client.delete("/asset/attachment", {
      data: { attachmentIds },
      headers: { accept: "application/json" },
    });
    return response.data;
  } catch (error) {
    logApiError(error, 'Error deleting attachments');
    throw error;
  }
}
