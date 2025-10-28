import React from "react";

/**
 * Instructions Overlay Component
 * Displays camera controls and interaction instructions
 */
const InstructionsOverlay = ({ instructionsRef }) => {
  return (
    <div className="exoplanet-instructions-overlay" ref={instructionsRef}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>Controls:</strong>
        <button
          type="button"
          className="btn-close btn-close-white btn-sm"
          aria-label="Close"
          onClick={(e) =>
            (e.currentTarget.parentElement.parentElement.style.display = "none")
          }
        ></button>
      </div>
      <div>
        <i className="bx bx-mouse"></i> Drag to rotate
      </div>
      <div>
        <i className="bx bx-mouse"></i> Scroll to zoom
      </div>
      <div>
        <i className="bx bx-mouse"></i> Right-click drag to pan
      </div>
      <div
        id="systemInstructions"
        style={{ display: "none" }}
        className="mt-2 pt-2 border-top border-secondary"
      >
        <div>
          <i className="bx bx-pointer"></i> Click planet to view details
        </div>
      </div>
    </div>
  );
};

export default InstructionsOverlay;
