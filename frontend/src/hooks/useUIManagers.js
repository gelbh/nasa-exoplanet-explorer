import { useRef } from "react";
import { TooltipManager } from "../lib/managers/ui/TooltipManager.js";
import { SettingsManager } from "../lib/managers/settings/SettingsManager.js";
import { InfoTabManager } from "../lib/managers/ui/InfoTabManager.js";
import { PanelManager } from "../lib/managers/ui/PanelManager.js";
import { SearchCoordinator } from "../lib/managers/interactions/SearchCoordinator.js";

/**
 * Custom hook for managing UI-related managers
 * (tooltips, settings, info tabs, panels, search)
 */
export const useUIManagers = () => {
  const tooltipManagerRef = useRef(null);
  const settingsManagerRef = useRef(null);
  const infoTabManagerRef = useRef(null);
  const panelManagerRef = useRef(null);
  const searchCoordinatorRef = useRef(null);

  /**
   * Initialize UI managers
   */
  const initializeUIManagers = (canvasRef, infoContentRef) => {
    tooltipManagerRef.current = new TooltipManager(canvasRef.current);
    settingsManagerRef.current = new SettingsManager();
    infoTabManagerRef.current = new InfoTabManager(infoContentRef.current);
    panelManagerRef.current = new PanelManager();
  };

  /**
   * Initialize search coordinator with all filter inputs
   */
  const initializeSearchCoordinator = (
    filterManager,
    uiManager,
    filterRefs
  ) => {
    searchCoordinatorRef.current = new SearchCoordinator({
      filterManager,
      uiManager,
      targets: {
        searchInput: filterRefs.searchInputRef.current,
        filterMode: filterRefs.filterModeRef.current,
        planetFilters: filterRefs.planetFiltersRef.current,
        systemFilters: filterRefs.systemFiltersRef.current,
        typeFilter: filterRefs.typeFilterRef.current,
        tempMin: filterRefs.tempMinRef.current,
        tempMax: filterRefs.tempMaxRef.current,
        distanceMax: filterRefs.distanceMaxRef.current,
        discoveryMethodFilter: filterRefs.discoveryMethodFilterRef.current,
        discoveryFacilityFilter: filterRefs.discoveryFacilityFilterRef.current,
        minPlanets: filterRefs.minPlanetsRef.current,
        systemDistanceMax: filterRefs.systemDistanceMaxRef.current,
        spectralTypeFilter: filterRefs.spectralTypeFilterRef.current,
      },
    });
  };

  /**
   * Set renderer references for settings manager
   */
  const setRenderers = (
    sceneManager,
    planetRenderer,
    systemRenderer,
    galaxyRenderer
  ) => {
    settingsManagerRef.current.setRenderers({
      sceneManager,
      planetRenderer,
      systemRenderer,
      galaxyRenderer,
    });
  };

  /**
   * Cleanup all UI managers
   */
  const cleanup = () => {
    if (tooltipManagerRef.current) {
      tooltipManagerRef.current.cleanup();
    }
    if (panelManagerRef.current) {
      panelManagerRef.current.cleanup();
    }
    if (searchCoordinatorRef.current) {
      searchCoordinatorRef.current.cleanup();
    }
  };

  /**
   * Show tooltip
   */
  const showTooltip = (objectData, x, y) => {
    tooltipManagerRef.current.show(objectData, x, y);
  };

  /**
   * Hide tooltip
   */
  const hideTooltip = () => {
    tooltipManagerRef.current.hide();
  };

  return {
    tooltipManagerRef,
    settingsManagerRef,
    infoTabManagerRef,
    panelManagerRef,
    searchCoordinatorRef,
    initializeUIManagers,
    initializeSearchCoordinator,
    setRenderers,
    cleanup,
    showTooltip,
    hideTooltip,
  };
};
