import React from "react";

/**
 * Info Panel Component
 * Container for displaying exoplanet/system information
 */
const InfoPanel = ({ infoContentRef }) => {
  return (
    <div className="p-4" ref={infoContentRef}>
      <h5 className="text-white mb-3">Information</h5>
      <p className="text-white-50">Loading information...</p>
    </div>
  );
};

export default InfoPanel;
