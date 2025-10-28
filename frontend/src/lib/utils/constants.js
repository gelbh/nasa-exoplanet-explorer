/**
 * Shared constants for planet classification and display
 */

/**
 * Planet type display names
 */
export const PLANET_TYPE_NAMES = {
  terrestrial: "Terrestrial",
  "super-earth": "Super-Earth",
  neptune: "Neptune-like",
  jupiter: "Jupiter-like",
};

/**
 * Planet type colors for UI
 */
export const PLANET_TYPE_COLORS = {
  terrestrial: "success",
  "super-earth": "info",
  neptune: "primary",
  jupiter: "warning",
};

/**
 * Get display name for a planet type
 * @param {string} type - Planet type
 * @returns {string} Display name
 */
export function getPlanetTypeName(type) {
  return PLANET_TYPE_NAMES[type] || "Unknown";
}

/**
 * Get color class for a planet type
 * @param {string} type - Planet type
 * @returns {string} Color class
 */
export function getTypeColor(type) {
  return PLANET_TYPE_COLORS[type] || "secondary";
}
