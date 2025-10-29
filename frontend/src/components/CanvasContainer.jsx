import React from "react";
import CanvasControls from "./CanvasControls";
import InstructionsOverlay from "./InstructionsOverlay";

/**
 * Canvas Container Component
 * Contains the 3D canvas, loading overlay, controls, and instructions
 */
const CanvasContainer = ({
  canvasRef,
  canvasLoadingRef,
  instructionsRef,
  onResetCamera,
  onToggleFullscreen,
}) => {
  return (
    <div className="exoplanet-canvas-container">
      <div
        ref={canvasRef}
        className="exoplanet-threejs-canvas"
        style={{ background: "#000000" }}
      ></div>

      {/* Loading Overlay */}
      <div className="exoplanet-loading-overlay" ref={canvasLoadingRef}>
        <div className="exoplanet-loading-content">
          <div className="exoplanet-loading-spinner-container">
            <div className="exoplanet-loading-spinner"></div>
            <div className="exoplanet-loading-orbit"></div>
            <div className="exoplanet-loading-orbit exoplanet-loading-orbit-2"></div>
          </div>
          <h3 className="exoplanet-loading-title">Loading Exoplanet Data</h3>
          <p className="exoplanet-loading-subtitle">
            Fetching from NASA Exoplanet Archive...
          </p>
          <div className="exoplanet-loading-progress">
            <div className="exoplanet-loading-bar">
              <div className="exoplanet-loading-bar-fill"></div>
            </div>
            <p className="exoplanet-loading-count" id="exoplanet-load-count">
              0 planets loaded
            </p>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <CanvasControls
        onResetCamera={onResetCamera}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* Instructions Overlay */}
      <InstructionsOverlay instructionsRef={instructionsRef} />
    </div>
  );
};

export default CanvasContainer;
