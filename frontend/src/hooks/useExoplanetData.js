import { useRef } from "react";
import { ApiManager } from "../lib/managers/data/ApiManager.js";
import { FilterManager } from "../lib/managers/data/FilterManager.js";
import { UIManager } from "../lib/managers/ui/UIManager.js";

/**
 * Custom hook for managing exoplanet data fetching and filtering
 */
export const useExoplanetData = (apiEndpoint, uiRefs) => {
  const apiManagerRef = useRef(null);
  const filterManagerRef = useRef(null);
  const uiManagerRef = useRef(null);

  /**
   * Initialize data managers
   */
  const initializeDataManagers = () => {
    apiManagerRef.current = new ApiManager(apiEndpoint);
    filterManagerRef.current = new FilterManager();
    uiManagerRef.current = new UIManager({
      resultsList: uiRefs.resultsListRef.current,
      resultCount: uiRefs.resultCountRef.current,
      loadingIndicator: uiRefs.loadingIndicatorRef.current,
      canvasLoading: uiRefs.canvasLoadingRef.current,
    });
  };

  /**
   * Fetch exoplanets from API
   */
  const fetchExoplanets = async (
    galaxyRendererRef,
    sceneManagerRef,
    onFirstBatch,
    onComplete
  ) => {
    await apiManagerRef.current.fetchExoplanets(
      // On batch processed
      (batchPlanets, allExoplanets) => {
        filterManagerRef.current.setExoplanets(allExoplanets);

        // Update result count in search panel
        if (uiRefs.resultCountRef.current) {
          uiRefs.resultCountRef.current.textContent = `Loading... ${allExoplanets.length}`;
        }

        // Update loading count in canvas overlay
        const loadCountElement = document.getElementById(
          "exoplanet-load-count"
        );
        if (loadCountElement) {
          loadCountElement.textContent = `${allExoplanets.length.toLocaleString()} planets loaded`;

          // Update progress bar (adaptive estimate based on current NASA archive size)
          // As of 2025, NASA has ~5600+ confirmed exoplanets and growing
          // Use 6000 as estimate to accommodate growth
          const progressBar = document.querySelector(
            ".exoplanet-loading-bar-fill"
          );
          if (progressBar) {
            const estimatedTotal = 6000;
            const progress = Math.min(
              (allExoplanets.length / estimatedTotal) * 100,
              100
            );
            progressBar.style.width = `${progress}%`;
          }
        }

        // If this is the first batch, render galaxy
        if (
          allExoplanets.length === batchPlanets.length &&
          allExoplanets.length > 0 &&
          onFirstBatch
        ) {
          onFirstBatch(allExoplanets);
        }
      },
      // On complete
      (allExoplanets) => {
        const buildList = () => {
          const results = filterManagerRef.current.searchUnified("");
          uiManagerRef.current.updateUnifiedResultsList(results);
        };

        if (window.requestIdleCallback) {
          window.requestIdleCallback(buildList, { timeout: 2000 });
        } else {
          requestAnimationFrame(() => {
            setTimeout(buildList, 1);
          });
        }

        // Render final galaxy view
        const systems = filterManagerRef.current.getNotableSystems();

        if (
          systems.length > 0 &&
          galaxyRendererRef.current &&
          sceneManagerRef.current
        ) {
          galaxyRendererRef.current.renderGalaxy(systems);

          // Set final camera position
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

        if (onComplete) {
          onComplete(allExoplanets);
        }
      },
      // On error
      (error) => {
        console.error("❌ Error fetching exoplanets:", error);
      }
    );
  };

  return {
    apiManagerRef,
    filterManagerRef,
    uiManagerRef,
    initializeDataManagers,
    fetchExoplanets,
  };
};
