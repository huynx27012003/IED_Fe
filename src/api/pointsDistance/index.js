import client from "@/api/client";

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
    console.error("Error fetching points-distance data:", error);
    throw error;
  }
}
