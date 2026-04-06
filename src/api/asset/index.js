import { get, post } from "@/api/helpers";

export function moveAsset(mode, id, ownerId) {
  return post(
    "/asset/move",
    {},
    {
      params: { mode, id, ownerId },
      headers: {
        accept: "*/*",
      },
    },
    `Error moving asset mode=${mode}, id=${id}, ownerId=${ownerId}`
  );
}

export function pasteAsset(mode, id, ownerId) {
  return post(
    "/asset/duplicate",
    {},
    {
      params: { mode, id, ownerId },
      headers: {
        accept: "*/*",
      },
    },
    `Error pasting asset mode=${mode}, id=${id}, ownerId=${ownerId}`
  );
}

export function renameAsset(mode, id, newName) {
  return post(
    "/asset/rename",
    {},
    {
      params: { mode, id, newName },
      headers: {
        accept: "*/*",
      },
    },
    `Error renaming asset mode=${mode}, id=${id}`
  );
}

export function getAssetCommunication(mode, id) {
  return get(
    "/asset/communication",
    { mode, id },
    `Error fetching communication mode=${mode}, id=${id}`
  );
}

export function importCommunicationServices(iedId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return post(
    "/ied/import/communication-services",
    formData,
    { params: { iedId }, headers: { "Content-Type": "multipart/form-data" } },
    `Error importing communication services`
  );
}
