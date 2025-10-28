import React, { useEffect, useState, useRef } from "react";
import {
  useThreeJSScene,
  useExoplanetData,
  useDOMRefs,
  useUIManagers,
  useCanvasInteraction,
  useSettingsHandlers,
  useViewTransitions,
  useInfoTab,
} from "../hooks";
import CanvasContainer from "./CanvasContainer";
import CombinedPanel from "./CombinedPanel";
import { BookmarkManager } from "../lib/managers/storage/BookmarkManager";
import { ExportManager } from "../lib/managers/export/ExportManager";

// NASA Exoplanet Archive API endpoint
// Import from constants (which uses environment variable)
import { EXOPLANET_API_ENDPOINT } from "../utils/constants";

/**
 * Exoplanet Viewer Component
 *
 * An interactive 3D exoplanet visualization tool powered by Three.js and NASA's Exoplanet Archive.
 * Features real exoplanet data, procedurally generated planets, and advanced filtering capabilities.
 *
 * Key Features:
 * - Real NASA exoplanet data from 5000+ confirmed planets
 * - Procedural planet generation based on physical properties
 * - Advanced filtering (type, temperature, distance)
 * - Orbit visualization with host star
 * - Realistic stellar lighting and atmospheric effects
 */
const ExoplanetViewer = () => {
  // ============================================
  // STATE FOR NEW FEATURES
  // ============================================

  // Comparison tool state
  const [comparisonPlanets, setComparisonPlanets] = useState([]);

  // Track current planet/system for Tools tab (state for re-rendering)
  const [currentPlanet, setCurrentPlanet] = useState(null);
  const [currentSystem, setCurrentSystem] = useState(null);
  const [viewMode, setViewMode] = useState("galaxy");

  // Managers for new features
  const bookmarkManagerRef = useRef(null);
  const exportManagerRef = useRef(null);

  // ============================================
  // CUSTOM HOOKS - DOM & SCENE
  // ============================================

  const domRefs = useDOMRefs();

  const {
    sceneManagerRef,
    planetRendererRef,
    systemRendererRef,
    galaxyRendererRef,
    comparisonRendererRef,
    cameraManagerRef,
    raycasterRef,
    mouseRef,
    animationIdRef,
    isTabVisibleRef,
    initThreeJS,
    renderBasicGalaxyStructure,
    cleanup: cleanupThreeJS,
  } = useThreeJSScene(domRefs.canvasRef, domRefs.canvasLoadingRef);

  const {
    apiManagerRef,
    filterManagerRef,
    uiManagerRef,
    initializeDataManagers,
    fetchExoplanets,
  } = useExoplanetData(EXOPLANET_API_ENDPOINT, domRefs);

  const {
    tooltipManagerRef,
    settingsManagerRef,
    infoTabManagerRef,
    panelManagerRef,
    searchCoordinatorRef,
    initializeUIManagers,
    initializeSearchCoordinator,
    setRenderers,
    cleanup: cleanupUIManagers,
  } = useUIManagers();

  // ============================================
  // CUSTOM HOOKS - VIEW TRANSITIONS & INFO
  // ============================================

  const {
    currentPlanetRef,
    currentSystemRef,
    viewModeRef,
    animateOrbitsRef,
    selectPlanet,
    selectSystem,
    selectRandomPlanet,
    selectRandomSystem,
    transitionToPlanetFromSystem,
    switchToSystemView,
    switchToPlanetView,
    switchToGalaxyView,
  } = useViewTransitions({
    sceneManagerRef,
    planetRendererRef,
    systemRendererRef,
    galaxyRendererRef,
    cameraManagerRef,
    filterManagerRef,
    uiManagerRef,
    infoTabManagerRef,
    domRefs,
    updateInfoTab: () => {},
    switchToInfoTab: () => {},
    updateSettingsVisibility: (viewMode) => {
      settingsManagerRef.current?.updateSettingsVisibility?.(viewMode);
    },
  });

  const {
    initInfoTabPlanetClicks,
    switchToInfoTab,
    updateInfoTab,
    clearInfoTab,
    zoomToGalacticCenter,
    returnToGalaxyView,
  } = useInfoTab({
    infoTabManagerRef,
    filterManagerRef,
    systemRendererRef,
    galaxyRendererRef,
    sceneManagerRef,
    cameraManagerRef,
    domRefs,
    viewModeRef,
    currentSystemRef,
    currentPlanetRef,
    transitionToPlanetFromSystem,
    updateSettingsVisibility: (viewMode) => {
      settingsManagerRef.current?.updateSettingsVisibility?.(viewMode);
    },
  });

  // Fix circular dependencies by updating the transition hook's functions
  useEffect(() => {
    if (selectPlanet) {
      selectPlanet.updateInfoTab = updateInfoTab;
      selectPlanet.switchToInfoTab = switchToInfoTab;
    }
  }, [updateInfoTab, switchToInfoTab, selectPlanet]);

  // Sync ref values to state for Tools tab re-rendering
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentPlanetRef.current !== currentPlanet) {
        setCurrentPlanet(currentPlanetRef.current);
      }
      if (currentSystemRef.current !== currentSystem) {
        setCurrentSystem(currentSystemRef.current);
      }
      if (viewModeRef.current !== viewMode) {
        setViewMode(viewModeRef.current);
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [currentPlanet, currentSystem, viewMode]);

  // Update Info tab whenever planet/system/view changes
  useEffect(() => {
    if (updateInfoTab && infoTabManagerRef.current) {
      try {
        updateInfoTab(viewMode, {
          currentSystem: currentSystem,
          currentPlanet: currentPlanet,
        });
      } catch (error) {
        console.error("Error updating info tab:", error);
      }
    }
  }, [currentPlanet, currentSystem, viewMode]);

  // ============================================
  // CUSTOM HOOKS - CANVAS INTERACTION
  // ============================================

  const handleSystemSelectFromCanvas = (system, systemPosition) => {
    cameraManagerRef.current.setTransitioning(true);

    const zoomDistance = 8;
    const direction = sceneManagerRef.current.camera.position
      .clone()
      .sub(systemPosition)
      .normalize();
    const targetCameraPos = systemPosition
      .clone()
      .add(direction.multiplyScalar(zoomDistance));

    sceneManagerRef.current.smoothCameraTransitionWithTarget(
      targetCameraPos,
      systemPosition,
      1000,
      () => {
        viewModeRef.current = "system";
        currentSystemRef.current = system;
        galaxyRendererRef.current.cleanup();
        selectSystem(system);

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 300);
      }
    );
  };

  const { setupCanvasEventListeners, removeCanvasEventListeners } =
    useCanvasInteraction({
      sceneManagerRef,
      raycasterRef,
      mouseRef,
      cameraManagerRef,
      tooltipManagerRef,
      galaxyRendererRef,
      systemRendererRef,
      viewModeRef,
      currentSystemRef,
      domRefs,
      onSystemSelect: handleSystemSelectFromCanvas,
      onPlanetSelect: transitionToPlanetFromSystem,
      onGalacticCenterClick: zoomToGalacticCenter,
    });

  // ============================================
  // CUSTOM HOOKS - SETTINGS HANDLERS
  // ============================================

  const settingsHandlers = useSettingsHandlers({
    settingsManagerRef,
    systemRendererRef,
    sceneManagerRef,
    cameraManagerRef,
    currentSystemRef,
    animateOrbitsRef,
    domRefs,
  });

  // ============================================
  // SEARCH & FILTER HANDLERS
  // ============================================

  const search = () => {
    searchCoordinatorRef.current?.search();
  };

  const changeFilterMode = () => {
    searchCoordinatorRef.current?.changeFilterMode();
  };

  const applyFilters = () => {
    searchCoordinatorRef.current?.applyFilters();
  };

  const clearFilters = () => {
    searchCoordinatorRef.current?.clearFilters();
  };

  const toggleFilters = (event) => {
    const button = event.currentTarget;

    if (!domRefs.filtersSectionRef.current || !domRefs.filtersIconRef.current)
      return;

    const filtersSection = domRefs.filtersSectionRef.current;

    if (filtersSection.classList.contains("show")) {
      filtersSection.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    } else {
      filtersSection.classList.add("show");
      button.setAttribute("aria-expanded", "true");
    }
  };

  const toggleResults = (event) => {
    const button = event.currentTarget;

    if (!domRefs.resultsSectionRef.current || !domRefs.resultsIconRef.current)
      return;

    const resultsSection = domRefs.resultsSectionRef.current;

    if (resultsSection.classList.contains("show")) {
      resultsSection.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    } else {
      resultsSection.classList.add("show");
      button.setAttribute("aria-expanded", "true");
    }
  };

  // ============================================
  // CONTROL HANDLERS
  // ============================================

  const resetCamera = () => {
    cameraManagerRef.current.resetCamera(viewModeRef.current, {
      currentSystem: currentSystemRef.current,
      currentPlanet: currentPlanetRef.current,
      galaxyRenderer: galaxyRendererRef.current,
      systemRenderer: systemRendererRef.current,
    });
  };

  const toggleFullscreen = () => {
    const container = document.querySelector(".exoplanet-fullscreen-viewer");

    const fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const togglePanelMinimize = (event) => {
    const button = event.currentTarget;
    const panelName = button.dataset.panelTarget;

    let panel;
    if (panelName === "combined" && domRefs.leftPanelRef.current) {
      panel = domRefs.leftPanelRef.current;
    }

    if (!panel) return;
    panel.classList.toggle("minimized");
  };

  // ============================================
  // ANIMATION
  // ============================================

  const handleVisibilityChange = () => {
    isTabVisibleRef.current = !document.hidden;
    if (isTabVisibleRef.current && !animationIdRef.current) {
      animate();
    }
  };

  const animate = () => {
    animationIdRef.current = requestAnimationFrame(() => animate());

    if (!isTabVisibleRef.current) {
      return;
    }

    sceneManagerRef.current.updateControls();

    // Check for auto-switch on zoom out
    if (viewModeRef.current === "planet" && currentPlanetRef.current) {
      cameraManagerRef.current.checkZoomOutToSystemView(
        currentPlanetRef.current,
        filterManagerRef.current
      );
    } else if (viewModeRef.current === "system" && currentSystemRef.current) {
      cameraManagerRef.current.checkZoomOutToGalaxyView();
    }

    // Handle different view modes
    if (viewModeRef.current === "comparison") {
      // Comparison view
      comparisonRendererRef.current.update(0.016);
    } else if (viewModeRef.current === "planet") {
      if (
        currentSystemRef.current &&
        systemRendererRef.current.systemPlanets.length > 0
      ) {
        // Unified view: use systemRenderer
        systemRendererRef.current.rotatePlanets(0.005);
        systemRendererRef.current.updateShaderUniforms(
          sceneManagerRef.current.camera
        );
      } else {
        // Standalone planet view: use planetRenderer
        planetRendererRef.current.rotatePlanet(0.005);
        planetRendererRef.current.animateEffects();
        planetRendererRef.current.updateShaderUniforms(
          sceneManagerRef.current.camera
        );
      }
    } else if (viewModeRef.current === "system") {
      if (animateOrbitsRef.current) {
        systemRendererRef.current.animateOrbits(
          0.016,
          settingsManagerRef.current.orbitSpeed,
          settingsManagerRef.current.useOrbitalInclination
        );
      }
      systemRendererRef.current.rotatePlanets(0.005);
      systemRendererRef.current.updateShaderUniforms(
        sceneManagerRef.current.camera
      );
    } else if (
      viewModeRef.current === "galaxy" ||
      viewModeRef.current === "galacticCenter"
    ) {
      galaxyRendererRef.current.animateGalaxy(0.016);
    }

    // Follow planet if enabled
    if (cameraManagerRef.current.followPlanet && currentPlanetRef.current) {
      cameraManagerRef.current.updateCameraFollowing(
        currentPlanetRef.current,
        systemRendererRef.current
      );
    }

    sceneManagerRef.current.animateStars();
    sceneManagerRef.current.render();
  };

  // ============================================
  // INITIALIZATION EFFECT
  // ============================================

  useEffect(() => {
    // Initialize new feature managers
    bookmarkManagerRef.current = new BookmarkManager();

    // Initialize all managers
    initializeDataManagers();
    initializeUIManagers(domRefs.canvasRef, domRefs.infoContentRef);

    // Set callbacks
    uiManagerRef.current.setPlanetSelectCallback((planet) =>
      selectPlanet(planet)
    );
    uiManagerRef.current.setSystemSelectCallback((system) =>
      selectSystem(system)
    );

    // Defer Three.js initialization for smooth page animations
    requestAnimationFrame(() => {
      setTimeout(() => {
        initThreeJS();

        // Initialize export manager after scene is ready
        exportManagerRef.current = new ExportManager(sceneManagerRef.current);

        // Set camera manager callbacks
        cameraManagerRef.current.setCallbacks({
          onSwitchToSystemView: (system) => selectSystem(system),
          onSwitchToGalaxyView: () => switchToGalaxyView(),
        });

        // Set renderer references
        setRenderers(
          sceneManagerRef.current,
          planetRendererRef.current,
          systemRendererRef.current,
          galaxyRendererRef.current
        );
        infoTabManagerRef.current.setFilterManager(filterManagerRef.current);

        // Setup canvas event listeners
        setupCanvasEventListeners();

        // Start animation loop
        animate();

        // Render basic galaxy structure immediately
        renderBasicGalaxyStructure();

        // Fetch exoplanet data
        fetchExoplanets(
          galaxyRendererRef,
          sceneManagerRef,
          // On first batch
          (allExoplanets) => {
            const systems = filterManagerRef.current.getNotableSystems();
            if (systems.length > 0 && galaxyRendererRef.current) {
              galaxyRendererRef.current.renderGalaxy(systems);

              const maxDistance =
                galaxyRendererRef.current.calculateMaxSystemDistance();
              const optimalDistance = Math.max(50, maxDistance * 1.5);
              const camX = 0;
              const camY = optimalDistance * 0.4;
              const camZ = optimalDistance * 0.6;

              sceneManagerRef.current.camera.position.set(camX, camY, camZ);
              sceneManagerRef.current.camera.lookAt(0, 0, 0);
              sceneManagerRef.current.controls.target.set(0, 0, 0);
              sceneManagerRef.current.controls.update();
            }
          },
          // On complete
          (allExoplanets) => {
            updateInfoTab();
          }
        );

        // Initialize search coordinator
        initializeSearchCoordinator(
          filterManagerRef.current,
          uiManagerRef.current,
          domRefs
        );

        panelManagerRef.current.initialize();
        initInfoTabPlanetClicks();
        settingsHandlers.updateSettingsVisibility("galaxy");
      }, 100);
    });

    // Cleanup on unmount
    return () => {
      cleanupThreeJS();
      cleanupUIManagers();
      removeCanvasEventListeners();
    };
  }, []);

  // Listen for galactic center return button
  useEffect(() => {
    const handleReturnToGalaxy = () => returnToGalaxyView();
    document.addEventListener("return-to-galaxy", handleReturnToGalaxy);
    return () =>
      document.removeEventListener("return-to-galaxy", handleReturnToGalaxy);
  }, [returnToGalaxyView]);

  // Visibility change listener
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ============================================
  // HANDLERS FOR NEW FEATURES
  // ============================================

  const handleAddToComparison = (planet) => {
    // Check if planet is already in comparison
    if (!comparisonPlanets.find((p) => p.name === planet.name)) {
      setComparisonPlanets([...comparisonPlanets, planet]);
    }
  };

  const handleRemoveFromComparison = (planet) => {
    setComparisonPlanets(
      comparisonPlanets.filter((p) => p.name !== planet.name)
    );
  };

  const handleClearComparison = () => {
    setComparisonPlanets([]);
    // Exit comparison view if active
    if (viewModeRef.current === "comparison") {
      switchToGalaxyView();
    }
  };

  const handleViewComparisonIn3D = () => {
    console.log("🚀 Starting 3D comparison view...");
    
    if (!comparisonPlanets || comparisonPlanets.length === 0) {
      console.warn("No planets to compare");
      return;
    }

    console.log("Planets to compare:", comparisonPlanets);

    // Hide other renderers
    if (galaxyRendererRef.current) {
      galaxyRendererRef.current.cleanup();
    }
    if (systemRendererRef.current) {
      systemRendererRef.current.cleanup();
    }
    if (planetRendererRef.current) {
      planetRendererRef.current.cleanup();
    }

    // Setup comparison view
    comparisonRendererRef.current.setupComparison(comparisonPlanets);
    comparisonRendererRef.current.show();

    // Update controls target
    if (sceneManagerRef.current?.controls) {
      sceneManagerRef.current.controls.target.set(0, 0, 0);
      sceneManagerRef.current.controls.update();
      console.log("✅ Controls updated for comparison view");
    }

    // Update view mode
    viewModeRef.current = "comparison";
    setViewMode("comparison");

    // Update settings visibility
    if (settingsManagerRef.current?.updateSettingsVisibility) {
      settingsManagerRef.current.updateSettingsVisibility("comparison");
    }
    
    console.log("✨ Comparison view setup complete!");
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="exoplanet-viewer-page">
      <section className="exoplanet-fullscreen-viewer">
        {/* Canvas Container with Controls and Instructions */}
        <CanvasContainer
          canvasRef={domRefs.canvasRef}
          canvasLoadingRef={domRefs.canvasLoadingRef}
          instructionsRef={domRefs.instructionsRef}
          onResetCamera={resetCamera}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Combined Panel with Settings, Search, Info, and Tools tabs */}
        <CombinedPanel
          leftPanelRef={domRefs.leftPanelRef}
          settingsRefs={{
            atmosphereToggleRef: domRefs.atmosphereToggleRef,
            starVisibilityToggleRef: domRefs.starVisibilityToggleRef,
            planetLabelsToggleRef: domRefs.planetLabelsToggleRef,
            orbitalInclinationToggleRef: domRefs.orbitalInclinationToggleRef,
            realisticDistancesToggleRef: domRefs.realisticDistancesToggleRef,
            orbitLinesToggleRef: domRefs.orbitLinesToggleRef,
            orbitSpeedSliderRef: domRefs.orbitSpeedSliderRef,
            orbitSpeedValueRef: domRefs.orbitSpeedValueRef,
            starDensitySliderRef: domRefs.starDensitySliderRef,
            starDensityValueRef: domRefs.starDensityValueRef,
            highQualityToggleRef: domRefs.highQualityToggleRef,
            cameraSpeedSliderRef: domRefs.cameraSpeedSliderRef,
            cameraSpeedValueRef: domRefs.cameraSpeedValueRef,
            autoRotateToggleRef: domRefs.autoRotateToggleRef,
          }}
          settingsHandlers={settingsHandlers}
          searchRefs={{
            searchInputRef: domRefs.searchInputRef,
            filtersIconRef: domRefs.filtersIconRef,
            filtersSectionRef: domRefs.filtersSectionRef,
            filterModeRef: domRefs.filterModeRef,
            planetFiltersRef: domRefs.planetFiltersRef,
            systemFiltersRef: domRefs.systemFiltersRef,
            typeFilterRef: domRefs.typeFilterRef,
            tempMinRef: domRefs.tempMinRef,
            tempMaxRef: domRefs.tempMaxRef,
            distanceMaxRef: domRefs.distanceMaxRef,
            discoveryMethodFilterRef: domRefs.discoveryMethodFilterRef,
            discoveryFacilityFilterRef: domRefs.discoveryFacilityFilterRef,
            minPlanetsRef: domRefs.minPlanetsRef,
            systemDistanceMaxRef: domRefs.systemDistanceMaxRef,
            spectralTypeFilterRef: domRefs.spectralTypeFilterRef,
            resultCountRef: domRefs.resultCountRef,
            resultsIconRef: domRefs.resultsIconRef,
            resultsSectionRef: domRefs.resultsSectionRef,
            loadingIndicatorRef: domRefs.loadingIndicatorRef,
            resultsListRef: domRefs.resultsListRef,
          }}
          searchHandlers={{
            onSearch: search,
            onApplyFilters: applyFilters,
            onClearFilters: clearFilters,
            onToggleFilters: toggleFilters,
            onToggleResults: toggleResults,
            onChangeFilterMode: changeFilterMode,
          }}
          infoContentRef={domRefs.infoContentRef}
          onTogglePanelMinimize={togglePanelMinimize}
          // New props for Tools tab
          bookmarkManager={bookmarkManagerRef.current}
          comparisonPlanets={comparisonPlanets}
          onAddToComparison={handleAddToComparison}
          onRemoveFromComparison={handleRemoveFromComparison}
          onClearComparison={handleClearComparison}
          onViewComparisonIn3D={handleViewComparisonIn3D}
          exportManager={exportManagerRef.current}
          viewState={{
            mode: viewMode,
            planet: currentPlanet?.name,
            system: currentSystem?.hostStar,
          }}
          currentPlanet={currentPlanet}
          onPlanetSelect={selectPlanet}
          onSystemSelect={selectSystem}
        />
      </section>
    </div>
  );
};

export default ExoplanetViewer;
