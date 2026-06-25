import client from "@/api/client";
import { logApiError } from "@/helpers/apiFeedback";

export async function getPointsDistanceByIedId(iedId) {
  if (iedId == null || iedId === "") {
    throw new Error("iedId is required");
  }

  try {
    const response = await client.get("/points-distance", {
      params: { iedId },
    });
    return response.data;
  } catch (error) {
    logApiError(error, "Error fetching points-distance data");
    throw error;
  }
}
