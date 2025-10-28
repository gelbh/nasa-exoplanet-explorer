import { useRef } from "react";

/**
 * Custom hook for managing all DOM element refs
 * Groups refs by functionality for better organization
 */
export const useDOMRefs = () => {
  // Canvas and main containers
  const canvasRef = useRef(null);
  const canvasLoadingRef = useRef(null);
  const leftPanelRef = useRef(null);
  const infoContentRef = useRef(null);

  // Search and filters
  const searchInputRef = useRef(null);
  const filterModeRef = useRef(null);
  const planetFiltersRef = useRef(null);
  const systemFiltersRef = useRef(null);
  const filtersIconRef = useRef(null);
  const filtersSectionRef = useRef(null);

  // Planet filters
  const typeFilterRef = useRef(null);
  const tempMinRef = useRef(null);
  const tempMaxRef = useRef(null);
  const distanceMaxRef = useRef(null);
  const discoveryMethodFilterRef = useRef(null);
  const discoveryFacilityFilterRef = useRef(null);

  // System filters
  const minPlanetsRef = useRef(null);
  const systemDistanceMaxRef = useRef(null);
  const spectralTypeFilterRef = useRef(null);

  // Results
  const resultsListRef = useRef(null);
  const resultCountRef = useRef(null);
  const resultsIconRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const loadingIndicatorRef = useRef(null);
  const instructionsRef = useRef(null);

  // Settings
  const orbitSpeedSliderRef = useRef(null);
  const orbitSpeedValueRef = useRef(null);
  const orbitalInclinationToggleRef = useRef(null);
  const realisticDistancesToggleRef = useRef(null);
  const atmosphereToggleRef = useRef(null);
  const starVisibilityToggleRef = useRef(null);
  const planetLabelsToggleRef = useRef(null);
  const orbitLinesToggleRef = useRef(null);
  const starDensitySliderRef = useRef(null);
  const starDensityValueRef = useRef(null);
  const highQualityToggleRef = useRef(null);
  const cameraSpeedSliderRef = useRef(null);
  const cameraSpeedValueRef = useRef(null);
  const autoRotateToggleRef = useRef(null);

  return {
    // Canvas and containers
    canvasRef,
    canvasLoadingRef,
    leftPanelRef,
    infoContentRef,

    // Search and filter refs
    searchInputRef,
    filterModeRef,
    planetFiltersRef,
    systemFiltersRef,
    filtersIconRef,
    filtersSectionRef,

    // Planet filter refs
    typeFilterRef,
    tempMinRef,
    tempMaxRef,
    distanceMaxRef,
    discoveryMethodFilterRef,
    discoveryFacilityFilterRef,

    // System filter refs
    minPlanetsRef,
    systemDistanceMaxRef,
    spectralTypeFilterRef,

    // Results refs
    resultsListRef,
    resultCountRef,
    resultsIconRef,
    resultsSectionRef,
    loadingIndicatorRef,
    instructionsRef,

    // Settings refs
    orbitSpeedSliderRef,
    orbitSpeedValueRef,
    orbitalInclinationToggleRef,
    realisticDistancesToggleRef,
    atmosphereToggleRef,
    starVisibilityToggleRef,
    planetLabelsToggleRef,
    orbitLinesToggleRef,
    starDensitySliderRef,
    starDensityValueRef,
    highQualityToggleRef,
    cameraSpeedSliderRef,
    cameraSpeedValueRef,
    autoRotateToggleRef,
  };
};
