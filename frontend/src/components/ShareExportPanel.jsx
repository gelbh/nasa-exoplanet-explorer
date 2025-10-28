import React, { useState } from "react";

/**
 * Share & Export Panel Component
 * Provides options to share and export current view
 */
const ShareExportPanel = ({ exportManager, viewState, currentPlanet }) => {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleShareURL = async () => {
    const url = exportManager.generateShareableURL(viewState);
    const success = await exportManager.copyToClipboard(url);

    if (success) {
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } else {
      alert("Failed to copy URL to clipboard");
    }
  };

  const handleNativeShare = async () => {
    const url = exportManager.generateShareableURL(viewState);
    const text = exportManager.generateShareText(currentPlanet);

    const shareData = {
      title: "NASA Exoplanet Explorer",
      text,
      url,
    };

    const success = await exportManager.shareViaWebAPI(shareData);
    if (!success) {
      // Fallback to copy URL
      handleShareURL();
    }
  };

  const handleScreenshot = async () => {
    try {
      setIsExporting(true);
      const blob = await exportManager.captureScreenshot();
      exportManager.downloadScreenshot(blob);
    } catch (error) {
      console.error("Screenshot failed:", error);
      alert("Failed to capture screenshot");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!currentPlanet) {
      alert("No planet selected");
      return;
    }

    const json = exportManager.exportPlanetDataJSON(currentPlanet);
    exportManager.downloadFile(
      json,
      `${currentPlanet.name.replace(/\s+/g, "-")}.json`,
      "application/json"
    );
  };

  return (
    <div className="share-export-panel p-3">
      <h6 className="text-white mb-3">
        <i className="bx bx-share-alt"></i> Share & Export
      </h6>

      {/* Share Section */}
      <div className="mb-4">
        <label className="form-label text-white fw-semibold">Share</label>
        <div className="d-grid gap-2">
          {navigator.share && (
            <button
              className="btn btn-sm btn-outline-light"
              onClick={handleNativeShare}
              aria-label="Share via system share menu"
            >
              <i className="bx bx-share-alt"></i> Share Link
            </button>
          )}
          <button
            className="btn btn-sm btn-outline-light position-relative"
            onClick={handleShareURL}
            aria-label="Copy shareable URL to clipboard"
          >
            <i className="bx bx-link"></i> Copy URL
            {showCopiedMessage && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success">
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Export Section */}
      <div className="mb-4">
        <label className="form-label text-white fw-semibold">Export</label>
        <div className="d-grid gap-2">
          <button
            className="btn btn-sm btn-outline-light"
            onClick={handleScreenshot}
            disabled={isExporting}
            aria-label="Export current view as PNG image"
          >
            <i className="bx bx-camera"></i>{" "}
            {isExporting ? "Capturing..." : "Screenshot (PNG)"}
          </button>

          {currentPlanet && (
            <button
              className="btn btn-sm btn-outline-light"
              onClick={handleExportJSON}
              aria-label="Export planet data as JSON"
            >
              <i className="bx bx-data"></i> Export Data (JSON)
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info mb-0" style={{ fontSize: "0.875rem" }}>
        <i className="bx bx-info-circle"></i> Share your discoveries or export
        data for your own analysis!
      </div>
    </div>
  );
};

export default ShareExportPanel;

