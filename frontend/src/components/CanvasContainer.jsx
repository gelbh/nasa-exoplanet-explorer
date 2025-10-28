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
      <div
        className="position-absolute top-50 start-50 translate-middle text-white text-center"
        ref={canvasLoadingRef}
      >
        <div className="spinner-border mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Initializing 3D Viewer...</p>
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
