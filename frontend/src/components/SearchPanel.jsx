import React from "react";

/**
 * Search Panel Component
 * Contains search input, filters, and results list
 */
const SearchPanel = ({ refs, handlers }) => {
  return (
    <div className="p-4">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name..."
          ref={refs.searchInputRef}
          onInput={handlers.onSearch}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 mt-4">
        <button
          className="btn btn-link text-white p-0 w-100 text-start d-flex align-items-center justify-content-between"
          onClick={handlers.onToggleFilters}
        >
          <h6 className="mb-0 text-white">Filters</h6>
          <i className="bx bx-chevron-down fs-5" ref={refs.filtersIconRef}></i>
        </button>

        <div
          className="collapse"
          ref={refs.filtersSectionRef}
          style={{ marginTop: "1rem" }}
        >
          {/* Filter Mode Toggle */}
          <div className="mb-3">
            <label
              htmlFor="filterModeSelect"
              className="form-label fs-sm fw-semibold"
            >
              Filter By
            </label>
            <select
              id="filterModeSelect"
              className="form-select"
              ref={refs.filterModeRef}
              onChange={handlers.onChangeFilterMode}
            >
              <option value="planets">Planets</option>
              <option value="systems">Systems</option>
            </select>
          </div>

          {/* Planet Filters (visible when filtering planets) */}
          <div ref={refs.planetFiltersRef}>
            {/* Planet Type Filter */}
            <div className="mb-3">
              <label
                htmlFor="planetTypeFilter"
                className="form-label fs-sm fw-semibold"
              >
                Planet Type
              </label>
              <select
                id="planetTypeFilter"
                className="form-select"
                ref={refs.typeFilterRef}
                onChange={handlers.onApplyFilters}
              >
                <option value="">All Types</option>
                <option value="terrestrial">Terrestrial</option>
                <option value="super-earth">Super-Earth</option>
                <option value="neptune">Neptune-like</option>
                <option value="jupiter">Jupiter-like</option>
              </select>
            </div>

            {/* Temperature Range */}
            <div className="mb-3">
              <label
                htmlFor="tempMinFilter"
                className="form-label fs-sm fw-semibold"
              >
                Temperature Range (K)
              </label>
              <div className="row g-2">
                <div className="col-6">
                  <input
                    id="tempMinFilter"
                    type="number"
                    className="form-control"
                    placeholder="Min"
                    ref={refs.tempMinRef}
                  />
                </div>
                <div className="col-6">
                  <input
                    id="tempMaxFilter"
                    type="number"
                    className="form-control"
                    placeholder="Max"
                    ref={refs.tempMaxRef}
                  />
                </div>
              </div>
            </div>

            {/* Distance Filter */}
            <div className="mb-3">
              <label
                htmlFor="distanceFilter"
                className="form-label fs-sm fw-semibold"
              >
                Distance (light-years)
              </label>
              <input
                id="distanceFilter"
                type="number"
                className="form-control"
                placeholder="Max distance"
                ref={refs.distanceMaxRef}
              />
            </div>

            {/* Discovery Method Filter */}
            <div className="mb-3">
              <label
                htmlFor="discoveryMethodFilter"
                className="form-label fs-sm fw-semibold"
              >
                Discovery Method
              </label>
              <select
                id="discoveryMethodFilter"
                className="form-select"
                ref={refs.discoveryMethodFilterRef}
                onChange={handlers.onApplyFilters}
              >
                <option value="">All Methods</option>
                <option value="Transit">Transit</option>
                <option value="Radial Velocity">Radial Velocity</option>
                <option value="Microlensing">Microlensing</option>
                <option value="Imaging">Direct Imaging</option>
                <option value="Astrometry">Astrometry</option>
                <option value="Timing">Timing Variations</option>
              </select>
            </div>

            {/* Discovery Facility Filter */}
            <div className="mb-3">
              <label
                htmlFor="discoveryFacilityFilter"
                className="form-label fs-sm fw-semibold"
              >
                Telescope/Mission
              </label>
              <select
                id="discoveryFacilityFilter"
                className="form-select"
                ref={refs.discoveryFacilityFilterRef}
                onChange={handlers.onApplyFilters}
              >
                <option value="">All Telescopes</option>
                <option value="Kepler">Kepler</option>
                <option value="TESS">TESS</option>
                <option value="Hubble">Hubble Space Telescope</option>
                <option value="James Webb">James Webb Space Telescope</option>
                <option value="La Silla">La Silla Observatory</option>
                <option value="Keck">Keck Observatory</option>
                <option value="Spitzer">Spitzer Space Telescope</option>
              </select>
            </div>
          </div>
          {/* End Planet Filters */}

          {/* System Filters (visible when filtering systems) */}
          <div ref={refs.systemFiltersRef} style={{ display: "none" }}>
            {/* Minimum Number of Planets */}
            <div className="mb-3">
              <label
                htmlFor="minPlanetsFilter"
                className="form-label fs-sm fw-semibold"
              >
                Minimum Planets
              </label>
              <input
                id="minPlanetsFilter"
                type="number"
                className="form-control"
                placeholder="Min planets"
                min="2"
                ref={refs.minPlanetsRef}
              />
            </div>

            {/* Distance Filter (Systems) */}
            <div className="mb-3">
              <label
                htmlFor="systemDistanceFilter"
                className="form-label fs-sm fw-semibold"
              >
                Distance (light-years)
              </label>
              <input
                id="systemDistanceFilter"
                type="number"
                className="form-control"
                placeholder="Max distance"
                ref={refs.systemDistanceMaxRef}
              />
            </div>

            {/* Star Spectral Type */}
            <div className="mb-3">
              <label
                htmlFor="spectralTypeFilter"
                className="form-label fs-sm fw-semibold"
              >
                Star Spectral Type
              </label>
              <select
                id="spectralTypeFilter"
                className="form-select"
                ref={refs.spectralTypeFilterRef}
              >
                <option value="">All Types</option>
                <option value="O">O - Blue (Hot)</option>
                <option value="B">B - Blue-White</option>
                <option value="A">A - White</option>
                <option value="F">F - Yellow-White</option>
                <option value="G">G - Yellow (Sun-like)</option>
                <option value="K">K - Orange</option>
                <option value="M">M - Red (Cool)</option>
              </select>
            </div>
          </div>
          {/* End System Filters */}

          <button
            className="btn btn-outline-primary w-100 mb-2"
            onClick={handlers.onApplyFilters}
          >
            Apply Filters
          </button>
          <button
            className="btn btn-outline-secondary w-100"
            onClick={handlers.onClearFilters}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Results List */}
      <div className="results-section">
        <button
          className="btn btn-link text-white p-0 w-100 text-start d-flex align-items-center justify-content-between mb-2"
          onClick={handlers.onToggleResults}
        >
          <h6 className="mb-0 text-white">
            Results
            <span className="badge bg-secondary" ref={refs.resultCountRef}>
              0
            </span>
          </h6>
          <i className="bx bx-chevron-down fs-5" ref={refs.resultsIconRef}></i>
        </button>

        <div className="collapse" ref={refs.resultsSectionRef}>
          <div
            className="d-flex align-items-center justify-content-center py-5"
            ref={refs.loadingIndicatorRef}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>

          <div ref={refs.resultsListRef} className="list-group">
            {/* Planet results will be inserted here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
