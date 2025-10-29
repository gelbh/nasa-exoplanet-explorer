/**
 * Custom hook for settings event handlers
 * Manages all visualization settings, toggles, and sliders
 */
export const useSettingsHandlers = ({
  settingsManagerRef,
  systemRendererRef,
  sceneManagerRef,
  cameraManagerRef,
  currentSystemRef,
  animateOrbitsRef,
  domRefs,
}) => {
  // ============================================
  // ORBIT SETTINGS
  // ============================================

  const updateOrbitSpeed = (event) => {
    const sliderValue = parseFloat(event.target.value);
    const displayText =
      settingsManagerRef.current.updateOrbitSpeed(sliderValue);

    if (domRefs.orbitSpeedValueRef.current) {
      domRefs.orbitSpeedValueRef.current.textContent = displayText;
    }
  };

  const updateOrbitSpeedDisplay = () => {
    if (!domRefs.orbitSpeedValueRef.current) return;
    const displayText = settingsManagerRef.current.getOrbitSpeedDisplay();
    domRefs.orbitSpeedValueRef.current.textContent = displayText;
  };

  const toggleOrbitalInclination = () => {
    const checked = domRefs.orbitalInclinationToggleRef.current.checked;
    settingsManagerRef.current.toggleOrbitalInclination(
      checked,
      currentSystemRef.current,
      animateOrbitsRef.current
    );
  };

  const toggleRealisticDistances = () => {
    const checked = domRefs.realisticDistancesToggleRef.current.checked;

    if (systemRendererRef.current && currentSystemRef.current) {
      const currentDistance = sceneManagerRef.current.camera.position.length();
      cameraManagerRef.current.setRealisticDistancesMode(checked);
      systemRendererRef.current.setRealisticDistances(checked);

      requestAnimationFrame(() => {
        systemRendererRef.current.rerenderSystem();

        const targetDistance = checked
          ? currentDistance * 2.0
          : currentDistance * 0.5;
        const currentPos = sceneManagerRef.current.camera.position.clone();
        const direction = currentPos.normalize();
        const targetPos = direction.multiplyScalar(targetDistance);

        sceneManagerRef.current.smoothCameraTransition(targetPos, 800);
      });
    }
  };

  const toggleOrbitLines = () => {
    if (!domRefs.orbitLinesToggleRef.current) return;
    settingsManagerRef.current.toggleOrbitLines(
      domRefs.orbitLinesToggleRef.current.checked
    );
  };

  // ============================================
  // VISUAL EFFECTS
  // ============================================

  const toggleAtmospheres = () => {
    const checked = domRefs.atmosphereToggleRef.current.checked;
    settingsManagerRef.current.toggleAtmospheres(checked);
  };

  const toggleStarVisibility = () => {
    if (!domRefs.starVisibilityToggleRef.current) return;
    settingsManagerRef.current.toggleStarVisibility(
      domRefs.starVisibilityToggleRef.current.checked
    );
  };

  const togglePlanetLabels = () => {
    if (!domRefs.planetLabelsToggleRef.current) return;
    settingsManagerRef.current.togglePlanetLabels(
      domRefs.planetLabelsToggleRef.current.checked
    );
  };

  // ============================================
  // PERFORMANCE
  // ============================================

  const updateStarDensity = (event) => {
    if (
      !domRefs.starDensitySliderRef.current ||
      !domRefs.starDensityValueRef.current
    )
      return;

    const sliderValue = parseFloat(event.target.value);
    const displayText =
      settingsManagerRef.current.updateStarDensity(sliderValue);
    domRefs.starDensityValueRef.current.textContent = displayText;
  };

  const toggleHighQuality = () => {
    if (!domRefs.highQualityToggleRef.current) return;
    settingsManagerRef.current.toggleHighQuality(
      domRefs.highQualityToggleRef.current.checked
    );
  };

  // ============================================
  // CAMERA
  // ============================================

  const updateCameraSpeed = (event) => {
    if (
      !domRefs.cameraSpeedSliderRef.current ||
      !domRefs.cameraSpeedValueRef.current
    )
      return;

    const sliderValue = parseFloat(event.target.value);
    const displayText =
      settingsManagerRef.current.updateCameraSpeed(sliderValue);
    domRefs.cameraSpeedValueRef.current.textContent = displayText;
  };

  const toggleAutoRotate = () => {
    if (!domRefs.autoRotateToggleRef.current) return;
    settingsManagerRef.current.toggleAutoRotate(
      domRefs.autoRotateToggleRef.current.checked
    );
  };

  // ============================================
  // RESET
  // ============================================

  const resetSettings = () => {
    const defaults = settingsManagerRef.current.reset();

    if (domRefs.starVisibilityToggleRef.current) {
      domRefs.starVisibilityToggleRef.current.checked = defaults.showStars;
    }
    if (domRefs.planetLabelsToggleRef.current) {
      domRefs.planetLabelsToggleRef.current.checked = defaults.showPlanetLabels;
    }
    if (domRefs.orbitLinesToggleRef.current) {
      domRefs.orbitLinesToggleRef.current.checked = defaults.showOrbitLines;
    }
    if (domRefs.starDensitySliderRef.current) {
      domRefs.starDensitySliderRef.current.value = defaults.starDensity;
    }
    if (domRefs.starDensityValueRef.current) {
      domRefs.starDensityValueRef.current.textContent =
        defaults.starDensityText;
    }
    if (domRefs.highQualityToggleRef.current) {
      domRefs.highQualityToggleRef.current.checked = defaults.highQuality;
    }
    if (domRefs.cameraSpeedSliderRef.current) {
      domRefs.cameraSpeedSliderRef.current.value = defaults.cameraSpeed;
    }
    if (domRefs.cameraSpeedValueRef.current) {
      domRefs.cameraSpeedValueRef.current.textContent =
        defaults.cameraSpeedText;
    }
    if (domRefs.autoRotateToggleRef.current) {
      domRefs.autoRotateToggleRef.current.checked = defaults.autoRotate;
    }
    if (domRefs.orbitSpeedSliderRef.current) {
      domRefs.orbitSpeedSliderRef.current.value = defaults.orbitSpeed;
    }
    if (domRefs.orbitSpeedValueRef.current) {
      domRefs.orbitSpeedValueRef.current.textContent = defaults.orbitSpeedText;
    }
    if (domRefs.orbitalInclinationToggleRef.current) {
      domRefs.orbitalInclinationToggleRef.current.checked =
        defaults.useOrbitalInclination;
    }
    if (domRefs.atmosphereToggleRef.current) {
      domRefs.atmosphereToggleRef.current.checked = defaults.showAtmospheres;
    }
  };

  const updateSettingsVisibility = (viewMode) => {
    settingsManagerRef.current.updateSettingsVisibility(viewMode);
  };

  return {
    updateOrbitSpeed,
    updateOrbitSpeedDisplay,
    toggleOrbitalInclination,
    toggleRealisticDistances,
    toggleOrbitLines,
    toggleAtmospheres,
    toggleStarVisibility,
    togglePlanetLabels,
    updateStarDensity,
    toggleHighQuality,
    updateCameraSpeed,
    toggleAutoRotate,
    resetSettings,
    updateSettingsVisibility,
  };
};
