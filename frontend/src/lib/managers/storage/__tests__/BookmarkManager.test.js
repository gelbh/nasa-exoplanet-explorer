/**
 * Tests for BookmarkManager
 */
import { BookmarkManager } from "../BookmarkManager";

describe("BookmarkManager", () => {
  let bookmarkManager;

  beforeEach(() => {
    localStorage.clear();
    bookmarkManager = new BookmarkManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Adding Bookmarks", () => {
    test("should add a planet bookmark", () => {
      const planet = {
        name: "Kepler-452b",
        hostStar: "Kepler-452",
        radius: 1.6,
        temperature: 265,
      };

      const result = bookmarkManager.addBookmark(planet, "planet");
      expect(result).toBe(true);
      expect(bookmarkManager.getCount()).toBe(1);
    });

    test("should not add duplicate bookmarks", () => {
      const planet = { name: "Test Planet", hostStar: "Test Star" };

      bookmarkManager.addBookmark(planet, "planet");
      const result = bookmarkManager.addBookmark(planet, "planet");

      expect(result).toBe(false);
      expect(bookmarkManager.getCount()).toBe(1);
    });

    test("should add system bookmark", () => {
      const system = {
        hostStar: "TRAPPIST-1",
        numberOfPlanets: 7,
      };

      const result = bookmarkManager.addBookmark(system, "system");
      expect(result).toBe(true);
    });
  });

  describe("Removing Bookmarks", () => {
    test("should remove a bookmark", () => {
      const planet = { name: "Test Planet" };
      bookmarkManager.addBookmark(planet, "planet");

      const result = bookmarkManager.removeBookmark("Test Planet", "planet");
      expect(result).toBe(true);
      expect(bookmarkManager.getCount()).toBe(0);
    });

    test("should return false when removing non-existent bookmark", () => {
      const result = bookmarkManager.removeBookmark("Nonexistent", "planet");
      expect(result).toBe(false);
    });
  });

  describe("Toggling Bookmarks", () => {
    test("should toggle bookmark on and off", () => {
      const planet = { name: "Toggle Planet" };

      // Toggle on
      bookmarkManager.toggleBookmark(planet, "planet");
      expect(bookmarkManager.isBookmarked("Toggle Planet", "planet")).toBe(
        true
      );

      // Toggle off
      bookmarkManager.toggleBookmark(planet, "planet");
      expect(bookmarkManager.isBookmarked("Toggle Planet", "planet")).toBe(
        false
      );
    });
  });

  describe("Querying Bookmarks", () => {
    beforeEach(() => {
      bookmarkManager.addBookmark({ name: "Planet A" }, "planet");
      bookmarkManager.addBookmark({ name: "Planet B" }, "planet");
      bookmarkManager.addBookmark({ hostStar: "System A" }, "system");
    });

    test("should get all bookmarks", () => {
      const all = bookmarkManager.getAllBookmarks();
      expect(all).toHaveLength(3);
    });

    test("should filter bookmarks by type", () => {
      const planets = bookmarkManager.getBookmarksByType("planet");
      const systems = bookmarkManager.getBookmarksByType("system");

      expect(planets).toHaveLength(2);
      expect(systems).toHaveLength(1);
    });

    test("should search bookmarks", () => {
      const results = bookmarkManager.searchBookmarks("Planet");
      expect(results).toHaveLength(2);
    });

    test("should return all bookmarks for empty search", () => {
      const results = bookmarkManager.searchBookmarks("");
      expect(results).toHaveLength(3);
    });
  });

  describe("Sorting Bookmarks", () => {
    beforeEach(() => {
      bookmarkManager.addBookmark({ name: "Zebra" }, "planet");
      bookmarkManager.addBookmark({ name: "Alpha" }, "planet");
    });

    test("should sort by name ascending", () => {
      const sorted = bookmarkManager.sortBookmarks("name", "asc");
      expect(sorted[0].name).toBe("Alpha");
      expect(sorted[1].name).toBe("Zebra");
    });

    test("should sort by name descending", () => {
      const sorted = bookmarkManager.sortBookmarks("name", "desc");
      expect(sorted[0].name).toBe("Zebra");
      expect(sorted[1].name).toBe("Alpha");
    });
  });

  describe("Import/Export", () => {
    test("should export bookmarks as JSON", () => {
      bookmarkManager.addBookmark({ name: "Test" }, "planet");

      const exported = bookmarkManager.exportBookmarks();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe("1.0");
      expect(parsed.bookmarks).toHaveLength(1);
      expect(parsed.exportDate).toBeDefined();
    });

    test("should import bookmarks from JSON", () => {
      const data = {
        version: "1.0",
        bookmarks: [
          {
            id: 1,
            type: "planet",
            name: "Imported Planet",
            data: {},
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const result = bookmarkManager.importBookmarks(JSON.stringify(data));
      expect(result).toBe(true);
      expect(bookmarkManager.getCount()).toBe(1);
    });

    test("should handle invalid import data", () => {
      const result = bookmarkManager.importBookmarks("invalid json");
      expect(result).toBe(false);
    });
  });

  describe("Persistence", () => {
    test("should persist to localStorage", () => {
      bookmarkManager.addBookmark({ name: "Persist Test" }, "planet");

      const newManager = new BookmarkManager();
      expect(newManager.getCount()).toBe(1);
      expect(newManager.isBookmarked("Persist Test", "planet")).toBe(true);
    });
  });
});

