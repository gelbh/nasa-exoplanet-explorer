import React from "react";

/**
 * Canvas Controls Component
 * Displays Reset View and Fullscreen buttons with accessibility features
 */
const CanvasControls = ({ onResetCamera, onToggleFullscreen }) => {
  return (
    <div 
      className="exoplanet-controls-overlay" 
      role="toolbar" 
      aria-label="3D View Controls"
    >
      <div className="d-flex gap-3 align-items-center flex-wrap">
        <button
          className="btn btn-sm btn-outline-light"
          onClick={onResetCamera}
          aria-label="Reset camera to default view"
          title="Reset camera to default view"
        >
          <i className="bx bx-reset" aria-hidden="true"></i> Reset View
        </button>
        <button
          className="btn btn-sm btn-outline-light"
          onClick={onToggleFullscreen}
          aria-label="Toggle fullscreen mode"
          title="Toggle fullscreen mode"
        >
          <i className="bx bx-fullscreen" aria-hidden="true"></i> Fullscreen
        </button>
      </div>
    </div>
  );
};

export default CanvasControls;
