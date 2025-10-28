import React from "react";

/**
 * Settings Panel Component
 * Contains all visualization settings organized by category
 */
const SettingsPanel = ({ refs, handlers }) => {
  return (
    <div className="p-4">
      <h6 className="text-white mb-4">Visualization Settings</h6>

      {/* Visual Effects Section */}
      <div className="settings-section mb-4" id="visualEffectsSection">
        <div className="d-flex align-items-center mb-3">
          <i className="bx bx-paint text-primary me-2"></i>
          <h6 className="mb-0 text-white-50 fs-sm text-uppercase">
            Visual Effects
          </h6>
        </div>

        {/* Atmosphere Toggle */}
        <div className="form-check mb-3" id="atmosphereSetting">
          <input
            className="form-check-input"
            type="checkbox"
            id="atmosphereToggleSettings"
            ref={refs.atmosphereToggleRef}
            onChange={handlers.toggleAtmospheres}
          />
          <label
            className="form-check-label text-white"
            htmlFor="atmosphereToggleSettings"
          >
            <i className="bx bx-cloud me-1"></i> Show Atmospheres
            <small className="d-block text-white-50 mt-1">
              Display atmospheric halos around planets
            </small>
          </label>
        </div>

        {/* Star Visibility Toggle */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="starVisibilityToggle"
            defaultChecked
            ref={refs.starVisibilityToggleRef}
            onChange={handlers.toggleStarVisibility}
          />
          <label
            className="form-check-label text-white"
            htmlFor="starVisibilityToggle"
          >
            <i className="bx bx-star me-1"></i> Show Background Stars
            <small className="d-block text-white-50 mt-1">
              Display starfield in background
            </small>
          </label>
        </div>

        {/* Planet Labels Toggle */}
        <div className="form-check mb-3" id="planetLabelsSetting">
          <input
            className="form-check-input"
            type="checkbox"
            id="planetLabelsToggle"
            ref={refs.planetLabelsToggleRef}
            onChange={handlers.togglePlanetLabels}
          />
          <label
            className="form-check-label text-white"
            htmlFor="planetLabelsToggle"
          >
            <i className="bx bx-label me-1"></i> Show Planet Labels
            <small className="d-block text-white-50 mt-1">
              Display planet names in system view
            </small>
          </label>
        </div>
      </div>

      {/* Orbital Mechanics Section */}
      <div className="settings-section mb-4" id="orbitalMechanicsSection">
        <div className="d-flex align-items-center mb-3">
          <i className="bx bx-target-lock text-info me-2"></i>
          <h6 className="mb-0 text-white-50 fs-sm text-uppercase">
            Orbital Mechanics
          </h6>
        </div>

        {/* 3D Orbits Toggle */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="orbitalInclinationToggleSettings"
            ref={refs.orbitalInclinationToggleRef}
            onChange={handlers.toggleOrbitalInclination}
          />
          <label
            className="form-check-label text-white"
            htmlFor="orbitalInclinationToggleSettings"
          >
            <i className="bx bx-shape-circle me-1"></i> 3D Orbital Inclination
            <small className="d-block text-white-50 mt-1">
              Use realistic 3D orbital planes
            </small>
          </label>
        </div>

        {/* Realistic Distances Toggle */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="realisticDistancesToggleSettings"
            ref={refs.realisticDistancesToggleRef}
            onChange={handlers.toggleRealisticDistances}
          />
          <label
            className="form-check-label text-white"
            htmlFor="realisticDistancesToggleSettings"
          >
            <i className="bx bx-ruler me-1"></i> Realistic Orbital Distances
            <small className="d-block text-white-50 mt-1">
              Use actual scaled distances (may be very spread out)
            </small>
          </label>
        </div>

        {/* Orbit Lines Toggle */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="orbitLinesToggle"
            defaultChecked
            ref={refs.orbitLinesToggleRef}
            onChange={handlers.toggleOrbitLines}
          />
          <label
            className="form-check-label text-white"
            htmlFor="orbitLinesToggle"
          >
            <i className="bx bx-trip me-1"></i> Show Orbit Paths
            <small className="d-block text-white-50 mt-1">
              Display orbital trajectory lines
            </small>
          </label>
        </div>

        {/* Orbit Speed Control */}
        <div className="mb-3">
          <label
            htmlFor="orbitSpeedSliderSettings"
            className="form-label text-white"
          >
            <i className="bx bx-time me-1"></i> Orbit Animation Speed
          </label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <input
              type="range"
              className="form-range"
              id="orbitSpeedSliderSettings"
              min="0"
              max="100"
              defaultValue="50"
              ref={refs.orbitSpeedSliderRef}
              onInput={handlers.updateOrbitSpeed}
            />
            <span
              className="badge bg-primary"
              ref={refs.orbitSpeedValueRef}
              style={{ minWidth: "60px" }}
            >
              60.0s
            </span>
          </div>
          <small className="text-white-50">Time for one complete orbit</small>
        </div>
      </div>

      {/* Performance Section */}
      <div className="settings-section mb-4">
        <div className="d-flex align-items-center mb-3">
          <i className="bx bx-tachometer text-warning me-2"></i>
          <h6 className="mb-0 text-white-50 fs-sm text-uppercase">
            Performance
          </h6>
        </div>

        {/* Star Density Control */}
        <div className="mb-3">
          <label htmlFor="starDensitySlider" className="form-label text-white">
            <i className="bx bx-star me-1"></i> Star Density
          </label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <input
              type="range"
              className="form-range"
              id="starDensitySlider"
              min="0"
              max="100"
              defaultValue="50"
              ref={refs.starDensitySliderRef}
              onInput={handlers.updateStarDensity}
            />
            <span
              className="badge bg-secondary"
              ref={refs.starDensityValueRef}
              style={{ minWidth: "60px" }}
            >
              50%
            </span>
          </div>
          <small className="text-white-50">Number of background stars</small>
        </div>

        {/* Quality Toggle */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="highQualityToggle"
            defaultChecked
            ref={refs.highQualityToggleRef}
            onChange={handlers.toggleHighQuality}
          />
          <label
            className="form-check-label text-white"
            htmlFor="highQualityToggle"
          >
            <i className="bx bx-sparkle me-1"></i> High Quality Rendering
            <small className="d-block text-white-50 mt-1">
              Enhanced textures and effects (may reduce FPS)
            </small>
          </label>
        </div>
      </div>

      {/* Camera Controls Section */}
      <div className="settings-section mb-4">
        <div className="d-flex align-items-center mb-3">
          <i className="bx bx-camera text-success me-2"></i>
          <h6 className="mb-0 text-white-50 fs-sm text-uppercase">Camera</h6>
        </div>

        {/* Camera Speed Control */}
        <div className="mb-3">
          <label htmlFor="cameraSpeedSlider" className="form-label text-white">
            <i className="bx bx-mouse me-1"></i> Camera Rotation Speed
          </label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <input
              type="range"
              className="form-range"
              id="cameraSpeedSlider"
              min="0"
              max="100"
              defaultValue="50"
              ref={refs.cameraSpeedSliderRef}
              onInput={handlers.updateCameraSpeed}
            />
            <span
              className="badge bg-success"
              ref={refs.cameraSpeedValueRef}
              style={{ minWidth: "60px" }}
            >
              1.0x
            </span>
          </div>
          <small className="text-white-50">Mouse rotation sensitivity</small>
        </div>

        {/* Auto-Rotate Toggle */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="autoRotateToggle"
            ref={refs.autoRotateToggleRef}
            onChange={handlers.toggleAutoRotate}
          />
          <label
            className="form-check-label text-white"
            htmlFor="autoRotateToggle"
          >
            <i className="bx bx-rotate-right me-1"></i> Auto-Rotate Camera
            <small className="d-block text-white-50 mt-1">
              Automatically rotate around objects
            </small>
          </label>
        </div>
      </div>

      {/* Reset Button */}
      <div className="d-grid">
        <button
          className="btn btn-outline-primary"
          onClick={handlers.resetSettings}
        >
          <i className="bx bx-refresh me-1"></i> Reset All Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
