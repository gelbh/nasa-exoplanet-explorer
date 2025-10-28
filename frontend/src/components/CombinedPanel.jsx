import React from "react";
import SettingsPanel from "./SettingsPanel";
import SearchPanel from "./SearchPanel";
import InfoPanel from "./InfoPanel";
import BookmarksPanel from "./BookmarksPanel";
import ComparisonTool from "./ComparisonTool";
import ShareExportPanel from "./ShareExportPanel";
import QuickActions from "./QuickActions";

/**
 * Combined Panel Component
 * Contains tabbed interface for Settings, Search, Info, and Tools panels
 */
const CombinedPanel = ({
  leftPanelRef,
  settingsRefs,
  settingsHandlers,
  searchRefs,
  searchHandlers,
  infoContentRef,
  onTogglePanelMinimize,
  // New props for Tools tab
  bookmarkManager,
  comparisonPlanets,
  onAddToComparison,
  onRemoveFromComparison,
  onClearComparison,
  onViewComparisonIn3D,
  exportManager,
  viewState,
  currentPlanet,
  onPlanetSelect,
  onSystemSelect,
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
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="tools-tab"
              data-bs-toggle="tab"
              data-bs-target="#tools-panel"
              type="button"
              role="tab"
              aria-controls="tools-panel"
              aria-selected="false"
            >
              <i className="bx bx-star me-1"></i> Tools
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

          {/* Tools Tab Content */}
          <div
            className="tab-pane fade"
            id="tools-panel"
            role="tabpanel"
            aria-labelledby="tools-tab"
          >
            <div className="p-3">
              {/* Quick Actions */}
              <QuickActions
                currentPlanet={currentPlanet}
                bookmarkManager={bookmarkManager}
                comparisonPlanets={comparisonPlanets}
                onAddToComparison={onAddToComparison}
                onRemoveFromComparison={onRemoveFromComparison}
              />

              <hr
                className="my-4"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              />

              {/* Bookmarks Section */}
              {bookmarkManager && (
                <>
                  <BookmarksPanel
                    bookmarkManager={bookmarkManager}
                    onPlanetSelect={onPlanetSelect}
                    onSystemSelect={onSystemSelect}
                  />
                  <hr
                    className="my-4"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}
                  />
                </>
              )}

              {/* Comparison Section */}
              <ComparisonTool
                selectedPlanets={comparisonPlanets || []}
                onRemovePlanet={onRemoveFromComparison}
                onClearAll={onClearComparison}
                onViewIn3D={onViewComparisonIn3D}
              />

              <hr
                className="my-4"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              />

              {/* Share & Export Section */}
              {exportManager && (
                <ShareExportPanel
                  exportManager={exportManager}
                  viewState={viewState || {}}
                  currentPlanet={currentPlanet}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedPanel;
