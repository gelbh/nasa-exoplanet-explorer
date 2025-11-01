import React from "react";

/**
 * View Navigation Buttons Component
 * Provides fallback navigation buttons for switching between views
 * Position: bottom-right corner
 */
const ViewNavigationButtons = ({
  viewMode,
  onBackToGalaxy,
  onBackToSystem,
}) => {
  // Don't show anything in galaxy view
  if (viewMode === "galaxy" || viewMode === "galacticCenter") {
    return null;
  }

  return (
    <div
      className="exoplanet-nav-buttons"
      role="navigation"
      aria-label="View Navigation"
    >
      <div className="d-flex flex-column gap-2">
        {/* Back to System button - show in planet view */}
        {viewMode === "planet" && (
          <button
            className="btn btn-sm btn-outline-light nav-btn"
            onClick={onBackToSystem}
            aria-label="Return to system view"
            title="Return to system view"
          >
            <i className="bx bx-left-arrow-alt" aria-hidden="true"></i> Back to
            System
          </button>
        )}

        {/* Back to Galaxy button - show in system, planet, and star views */}
        {(viewMode === "system" ||
          viewMode === "planet" ||
          viewMode === "star") && (
          <button
            className="btn btn-sm btn-outline-light nav-btn"
            onClick={onBackToGalaxy}
            aria-label="Return to galaxy view"
            title="Return to galaxy view"
          >
            <i className="bx bx-left-arrow-alt" aria-hidden="true"></i> Back to
            Galaxy
          </button>
        )}
      </div>
    </div>
  );
};

export default ViewNavigationButtons;
