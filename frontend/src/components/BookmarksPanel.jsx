import React, { useState, useEffect } from "react";

/**
 * Bookmarks Panel Component
 * Displays user's bookmarked planets and systems
 */
const BookmarksPanel = ({
  bookmarkManager,
  onPlanetSelect,
  onSystemSelect,
}) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'planet', 'system'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!bookmarkManager) return;

    // Initial load
    setBookmarks(bookmarkManager.getAllBookmarks());

    // Subscribe to changes
    const unsubscribe = bookmarkManager.subscribe((updatedBookmarks) => {
      setBookmarks(updatedBookmarks);
    });

    return unsubscribe;
  }, [bookmarkManager]);

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesType = filter === "all" || bookmark.type === filter;
    const matchesSearch =
      !searchQuery ||
      bookmark.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleBookmarkClick = (bookmark) => {
    if (bookmark.type === "planet" && onPlanetSelect) {
      onPlanetSelect(bookmark.data);
    } else if (bookmark.type === "system" && onSystemSelect) {
      onSystemSelect(bookmark.data);
    }
  };

  const handleRemove = (bookmark, e) => {
    e.stopPropagation();
    bookmarkManager.removeBookmark(bookmark.name, bookmark.type);
  };

  const handleExport = () => {
    const json = bookmarkManager.exportBookmarks();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exoplanet-bookmarks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = bookmarkManager.importBookmarks(event.target.result);
      if (success) {
        alert("Bookmarks imported successfully!");
      } else {
        alert("Failed to import bookmarks. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bookmarks-panel p-3">
      <div className="mb-3">
        <h6 className="text-white mb-3">
          <i className="bx bx-bookmark"></i> Bookmarks ({bookmarks.length})
        </h6>

        {/* Search */}
        <input
          type="text"
          className="form-control form-control-sm mb-2"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search bookmarks"
        />

        {/* Filter */}
        <div className="btn-group btn-group-sm w-100 mb-2" role="group">
          <button
            type="button"
            className={`btn btn-outline-light ${
              filter === "all" ? "active" : ""
            }`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            All
          </button>
          <button
            type="button"
            className={`btn btn-outline-light ${
              filter === "planet" ? "active" : ""
            }`}
            onClick={() => setFilter("planet")}
            aria-pressed={filter === "planet"}
          >
            Planets
          </button>
          <button
            type="button"
            className={`btn btn-outline-light ${
              filter === "system" ? "active" : ""
            }`}
            onClick={() => setFilter("system")}
            aria-pressed={filter === "system"}
          >
            Systems
          </button>
        </div>

        {/* Import/Export */}
        <div className="d-flex gap-2 mb-3">
          <button
            className="btn btn-sm btn-outline-light flex-fill"
            onClick={handleExport}
            disabled={bookmarks.length === 0}
            title="Export bookmarks"
          >
            <i className="bx bx-export"></i> Export
          </button>
          <label className="btn btn-sm btn-outline-light flex-fill mb-0">
            <i className="bx bx-import"></i> Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: "none" }}
              aria-label="Import bookmarks"
            />
          </label>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => bookmarkManager.clearAll()}
            disabled={bookmarks.length === 0}
            title="Clear all bookmarks"
          >
            <i className="bx bx-trash"></i>
          </button>
        </div>
      </div>

      {/* Bookmarks List */}
      <div
        className="bookmarks-list"
        style={{ maxHeight: "400px", overflowY: "auto" }}
      >
        {filteredBookmarks.length === 0 ? (
          <div className="text-center text-muted py-4">
            <i
              className="bx bx-bookmark-alt-minus"
              style={{ fontSize: "3rem" }}
            ></i>
            <p className="mb-0 mt-2">
              {searchQuery
                ? "No bookmarks match your search"
                : "No bookmarks yet"}
            </p>
            {!searchQuery && (
              <small>Click the bookmark icon to save favorites</small>
            )}
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                onClick={() => handleBookmarkClick(bookmark)}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleBookmarkClick(bookmark);
                  }
                }}
              >
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center">
                    <i
                      className={`bx ${
                        bookmark.type === "planet" ? "bx-planet" : "bx-sun"
                      } me-2`}
                    ></i>
                    <span className="fw-semibold">{bookmark.name}</span>
                  </div>
                  <small className="text-muted d-block">
                    {bookmark.type === "planet"
                      ? `Host: ${bookmark.data.hostStar || "Unknown"}`
                      : `${bookmark.data.numberOfPlanets || 1} planet(s)`}
                  </small>
                </div>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={(e) => handleRemove(bookmark, e)}
                  aria-label={`Remove ${bookmark.name} from bookmarks`}
                  title="Remove bookmark"
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPanel;
