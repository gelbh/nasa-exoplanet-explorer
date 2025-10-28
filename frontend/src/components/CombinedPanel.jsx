import React from "react";
import SettingsPanel from "./SettingsPanel";
import SearchPanel from "./SearchPanel";
import InfoPanel from "./InfoPanel";

/**
 * Combined Panel Component
 * Contains tabbed interface for Settings, Search, and Info panels
 */
const CombinedPanel = ({
  leftPanelRef,
  settingsRefs,
  settingsHandlers,
  searchRefs,
  searchHandlers,
  infoContentRef,
  onTogglePanelMinimize,
}) => {
  return (
    <div
      className="exoplanet-overlay-panel exoplanet-combined-panel"
      ref={leftPanelRef}
      data-panel="combined"
    >
      {/* Panel Header with Drag Handle and Minimize Button */}
      <div className="exoplanet-panel-header" data-drag-handle>
        {/* Tabs Navigation */}
        <ul
          className="nav nav-tabs exoplanet-panel-tabs border-0 flex-grow-1"
          role="tablist"
        >
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="settings-tab"
              data-bs-toggle="tab"
              data-bs-target="#settings-panel"
              type="button"
              role="tab"
              aria-controls="settings-panel"
              aria-selected="false"
            >
              <i className="bx bx-cog me-1"></i> Settings
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active"
              id="search-tab"
              data-bs-toggle="tab"
              data-bs-target="#search-panel"
              type="button"
              role="tab"
              aria-controls="search-panel"
              aria-selected="true"
            >
              <i className="bx bx-search me-1"></i> Search
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="info-tab"
              data-bs-toggle="tab"
              data-bs-target="#info-panel"
              type="button"
              role="tab"
              aria-controls="info-panel"
              aria-selected="false"
            >
              <i className="bx bx-info-circle me-1"></i> Info
            </button>
          </li>
        </ul>

        <div className="exoplanet-panel-controls">
          <button
            className="btn btn-sm btn-link text-white p-0"
            onClick={onTogglePanelMinimize}
            data-panel-target="combined"
            title="Minimize Panel"
          >
            <span className="exoplanet-minimize-icon">−</span>
          </button>
        </div>
      </div>

      {/* Panel Content with Tabs */}
      <div className="exoplanet-panel-content">
        <div className="tab-content" id="panelTabContent">
          {/* Settings Tab Content */}
          <div
            className="tab-pane fade"
            id="settings-panel"
            role="tabpanel"
            aria-labelledby="settings-tab"
          >
            <SettingsPanel refs={settingsRefs} handlers={settingsHandlers} />
          </div>

          {/* Search Tab Content */}
          <div
            className="tab-pane fade show active"
            id="search-panel"
            role="tabpanel"
            aria-labelledby="search-tab"
          >
            <SearchPanel refs={searchRefs} handlers={searchHandlers} />
          </div>

          {/* Information Tab Content */}
          <div
            className="tab-pane fade"
            id="info-panel"
            role="tabpanel"
            aria-labelledby="info-tab"
          >
            <InfoPanel infoContentRef={infoContentRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedPanel;
