export function isReliefWebResponse(value) {
  if (!value || typeof value !== "object" || !("data" in value) || !Array.isArray(value.data)) return false;
  return value.data.every((item) =>
    item && typeof item === "object" && ("id" in item) && ("fields" in item) &&
    item.fields && typeof item.fields === "object"
  );
}
