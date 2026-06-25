import { get } from "@/api/helpers";

export function getPointsOvercurrent({ iedId, group = 1, type = "", current = null, displayMode = "" } = {}) {
  if (iedId == null || iedId === "") {
    throw new Error("iedId is required");
  }

  const params = { iedId, group };
  if (type) params.type = type;
  if (current != null && current !== "") params.current = current;
  if (displayMode) params.displayMode = displayMode;

  return get("/points-overcurrent", params, "Error fetching overcurrent curve data");
}
