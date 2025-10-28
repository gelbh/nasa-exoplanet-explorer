/**
 * Application constants
 */

// NASA Exoplanet Archive API endpoint
export const EXOPLANET_API_ENDPOINT = "http://localhost:5000/api/exoplanets";

// View modes
export const VIEW_MODES = {
  GALAXY: "galaxy",
  GALACTIC_CENTER: "galacticCenter",
  SYSTEM: "system",
  PLANET: "planet",
};

// Interaction thresholds
export const INTERACTION = {
  DRAG_THRESHOLD: 5,
  CLICK_TIME_THRESHOLD: 200, // ms
};

// Animation speeds
export const ANIMATION = {
  DEFAULT_ORBIT_SPEED: 0.005,
  DEFAULT_ROTATION_SPEED: 0.005,
};
