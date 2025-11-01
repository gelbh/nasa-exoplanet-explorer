import React, { useState, useEffect } from "react";

/**
 * Quick Actions Component
 * Provides quick access to bookmark and comparison features for the current planet
 */
const QuickActions = ({
  currentPlanet,
  bookmarkManager,
  comparisonPlanets,
  onAddToComparison,
  onRemoveFromComparison,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isInComparison, setIsInComparison] = useState(false);

  useEffect(() => {
    if (currentPlanet && bookmarkManager) {
      setIsBookmarked(
        bookmarkManager.isBookmarked(currentPlanet.name, "planet")
      );
    }
  }, [currentPlanet, bookmarkManager]);

  useEffect(() => {
    if (currentPlanet && comparisonPlanets) {
      setIsInComparison(
        comparisonPlanets.some((p) => p.name === currentPlanet.name)
      );
    }
  }, [currentPlanet, comparisonPlanets]);

  const handleBookmarkToggle = () => {
    if (currentPlanet && bookmarkManager) {
      bookmarkManager.toggleBookmark(currentPlanet, "planet");
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleComparisonToggle = () => {
    if (!currentPlanet) return;

    if (isInComparison) {
      onRemoveFromComparison?.(currentPlanet);
    } else {
      onAddToComparison?.(currentPlanet);
    }
  };

  if (!currentPlanet) {
    return (
      <div className="quick-actions p-3">
        <div className="alert alert-info mb-0" style={{ fontSize: "0.875rem" }}>
          <i className="bx bx-info-circle"></i> Select a planet to use quick
          actions
        </div>
      </div>
    );
  }

  return (
    <div className="quick-actions p-3">
      <h6 className="text-white mb-3">
        <i className="bx bx-bolt"></i> Quick Actions
      </h6>
      <p className="text-white-50 small mb-3">
        Actions for:{" "}
        <strong className="text-white">{currentPlanet.name}</strong>
      </p>

      <div className="d-grid gap-2">
        <button
          className={`btn btn-sm ${
            isBookmarked ? "btn-warning" : "btn-outline-light"
          }`}
          onClick={handleBookmarkToggle}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          <i
            className={`bx ${isBookmarked ? "bxs-bookmark" : "bx-bookmark"}`}
          ></i>{" "}
          {isBookmarked ? "Bookmarked" : "Bookmark This Planet"}
        </button>

        <button
          className={`btn btn-sm ${
            isInComparison ? "btn-success" : "btn-outline-light"
          }`}
          onClick={handleComparisonToggle}
          aria-label={
            isInComparison ? "Remove from comparison" : "Add to comparison"
          }
        >
          <i
            className={`bx ${
              isInComparison ? "bx-check-circle" : "bx-bar-chart-alt-2"
            }`}
          ></i>{" "}
          {isInComparison ? "In Comparison" : "Add to Comparison"}
        </button>
      </div>

      {isInComparison && (
        <div
          className="alert alert-success mt-3 mb-0"
          style={{ fontSize: "0.875rem" }}
        >
          <i className="bx bx-info-circle"></i> This planet is ready to compare!
          View the comparison in the section below.
        </div>
      )}
    </div>
  );
};

export default QuickActions;
