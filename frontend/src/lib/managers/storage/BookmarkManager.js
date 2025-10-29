/**
 * BookmarkManager
 * Manages user bookmarks/favorites with localStorage persistence
 */
export class BookmarkManager {
  constructor() {
    this.storageKey = "exoplanet_bookmarks";
    this.bookmarks = this.loadBookmarks();
    this.listeners = [];
  }

  /**
   * Load bookmarks from localStorage
   * @returns {Array}
   */
  loadBookmarks() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const bookmarks = JSON.parse(stored);
      console.log(`📚 Loaded ${bookmarks.length} bookmarks`);
      return Array.isArray(bookmarks) ? bookmarks : [];
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      return [];
    }
  }

  /**
   * Save bookmarks to localStorage
   */
  saveBookmarks() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
      this.notifyListeners();
    } catch (error) {
      console.error("Error saving bookmarks:", error);
    }
  }

  /**
   * Add a bookmark
   * @param {Object} item - Planet or system to bookmark
   * @param {string} type - 'planet' or 'system'
   */
  addBookmark(item, type = "planet") {
    // Check if already bookmarked
    if (this.isBookmarked(item.name || item.hostStar, type)) {
      console.log(`Already bookmarked: ${item.name || item.hostStar}`);
      return false;
    }

    const bookmark = {
      id: Date.now(),
      type,
      name: type === "planet" ? item.name : item.hostStar,
      data: item,
      timestamp: new Date().toISOString(),
    };

    this.bookmarks.unshift(bookmark); // Add to beginning
    this.saveBookmarks();
    console.log(`⭐ Bookmarked: ${bookmark.name}`);
    return true;
  }

  /**
   * Remove a bookmark
   * @param {string} name - Name of planet or system
   * @param {string} type - 'planet' or 'system'
   */
  removeBookmark(name, type) {
    const initialLength = this.bookmarks.length;
    this.bookmarks = this.bookmarks.filter(
      (b) => !(b.name === name && b.type === type)
    );

    if (this.bookmarks.length < initialLength) {
      this.saveBookmarks();
      console.log(`🗑️ Removed bookmark: ${name}`);
      return true;
    }

    return false;
  }

  /**
   * Toggle bookmark status
   * @param {Object} item - Planet or system
   * @param {string} type - 'planet' or 'system'
   */
  toggleBookmark(item, type = "planet") {
    const name = type === "planet" ? item.name : item.hostStar;
    
    if (this.isBookmarked(name, type)) {
      return this.removeBookmark(name, type);
    } else {
      return this.addBookmark(item, type);
    }
  }

  /**
   * Check if an item is bookmarked
   * @param {string} name - Name of planet or system
   * @param {string} type - 'planet' or 'system'
   * @returns {boolean}
   */
  isBookmarked(name, type) {
    return this.bookmarks.some((b) => b.name === name && b.type === type);
  }

  /**
   * Get all bookmarks
   * @returns {Array}
   */
  getAllBookmarks() {
    return [...this.bookmarks];
  }

  /**
   * Get bookmarks by type
   * @param {string} type - 'planet' or 'system'
   * @returns {Array}
   */
  getBookmarksByType(type) {
    return this.bookmarks.filter((b) => b.type === type);
  }

  /**
   * Get bookmark count
   * @returns {number}
   */
  getCount() {
    return this.bookmarks.length;
  }

  /**
   * Clear all bookmarks
   * @param {boolean} skipConfirm - Skip confirmation dialog (for testing/programmatic use)
   */
  clearAll(skipConfirm = false) {
    // Check if we're in a browser environment before using confirm()
    const shouldClear = skipConfirm || 
      (typeof window !== "undefined" && 
       typeof window.confirm === "function" && 
       window.confirm("Are you sure you want to clear all bookmarks?"));
    
    if (shouldClear) {
      this.bookmarks = [];
      this.saveBookmarks();
      console.log("🗑️ All bookmarks cleared");
      return true;
    }
    return false;
  }

  /**
   * Export bookmarks as JSON
   * @returns {string}
   */
  exportBookmarks() {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      bookmarks: this.bookmarks,
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import bookmarks from JSON
   * @param {string} jsonString - JSON string of bookmarks
   * @returns {boolean}
   */
  importBookmarks(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error("Invalid bookmark data format");
      }

      // Merge with existing bookmarks (avoid duplicates)
      const existingNames = new Set(
        this.bookmarks.map((b) => `${b.name}-${b.type}`)
      );

      const newBookmarks = data.bookmarks
        .filter((b) => !existingNames.has(`${b.name}-${b.type}`))
        .map((bookmark) => {
          // Validate and normalize bookmark structure
          return {
            name: bookmark.name || "Unknown",
            type: bookmark.type || "planet",
            timestamp: this.validateTimestamp(bookmark.timestamp),
            data: bookmark.data || {},
          };
        });

      this.bookmarks = [...this.bookmarks, ...newBookmarks];
      this.saveBookmarks();
      
      console.log(`📥 Imported ${newBookmarks.length} new bookmarks`);
      return true;
    } catch (error) {
      console.error("Error importing bookmarks:", error);
      return false;
    }
  }

  /**
   * Validate and normalize timestamp
   * @param {*} timestamp - Timestamp to validate (can be number, string, or Date)
   * @returns {number} Valid timestamp in milliseconds
   */
  validateTimestamp(timestamp) {
    // If already a valid number
    if (typeof timestamp === "number" && !isNaN(timestamp) && timestamp > 0) {
      return timestamp;
    }
    
    // Try to parse string or Date
    if (timestamp) {
      const parsed = new Date(timestamp).getTime();
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    
    // Default to current time if invalid
    return Date.now();
  }

  /**
   * Subscribe to bookmark changes
   * @param {Function} callback - Function to call when bookmarks change
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== "function") {
      console.error("BookmarkManager.subscribe: callback must be a function");
      return () => {}; // Return no-op unsubscribe function
    }
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.bookmarks);
      } catch (error) {
        console.error("Error in bookmark listener:", error);
      }
    });
  }

  /**
   * Search bookmarks
   * @param {string} query - Search query
   * @returns {Array}
   */
  searchBookmarks(query) {
    if (!query) return this.bookmarks;

    const lowerQuery = query.toLowerCase();
    return this.bookmarks.filter((b) =>
      b.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Sort bookmarks
   * @param {string} sortBy - 'name', 'date', or 'type'
   * @param {string} order - 'asc' or 'desc'
   * @returns {Array}
   */
  sortBookmarks(sortBy = "date", order = "desc") {
    const sorted = [...this.bookmarks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "date":
        default:
          comparison =
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
      }

      return order === "asc" ? comparison : -comparison;
    });

    return sorted;
  }
}

