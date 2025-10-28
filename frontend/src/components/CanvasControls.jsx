import React from "react";

/**
 * Canvas Controls Component
 * Displays Reset View and Fullscreen buttons
 */
const CanvasControls = ({ onResetCamera, onToggleFullscreen }) => {
  return (
    <div className="exoplanet-controls-overlay">
      <div className="d-flex gap-3 align-items-center flex-wrap">
        <button
          className="btn btn-sm btn-outline-light"
          onClick={onResetCamera}
        >
          <i className="bx bx-reset"></i> Reset View
        </button>
        <button
          className="btn btn-sm btn-outline-light"
          onClick={onToggleFullscreen}
        >
          <i className="bx bx-fullscreen"></i> Fullscreen
        </button>
      </div>
    </div>
  );
};

export default CanvasControls;
