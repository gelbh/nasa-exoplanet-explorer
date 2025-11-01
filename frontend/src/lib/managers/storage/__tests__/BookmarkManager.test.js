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

  test("should add and remove bookmarks", () => {
    const planet = { name: "Kepler-452b", hostStar: "Kepler-452" };

    // Add bookmark
    const addResult = bookmarkManager.addBookmark(planet, "planet");
    expect(addResult).toBe(true);
    expect(bookmarkManager.getCount()).toBe(1);

    // Prevent duplicates
    const dupResult = bookmarkManager.addBookmark(planet, "planet");
    expect(dupResult).toBe(false);
    expect(bookmarkManager.getCount()).toBe(1);

    // Remove bookmark
    const removeResult = bookmarkManager.removeBookmark(
      "Kepler-452b",
      "planet"
    );
    expect(removeResult).toBe(true);
    expect(bookmarkManager.getCount()).toBe(0);
  });

  test("should toggle bookmarks", () => {
    const planet = { name: "Toggle Planet" };

    bookmarkManager.toggleBookmark(planet, "planet");
    expect(bookmarkManager.isBookmarked("Toggle Planet", "planet")).toBe(true);

    bookmarkManager.toggleBookmark(planet, "planet");
    expect(bookmarkManager.isBookmarked("Toggle Planet", "planet")).toBe(false);
  });

  test("should filter and search bookmarks", () => {
    bookmarkManager.addBookmark({ name: "Planet A" }, "planet");
    bookmarkManager.addBookmark({ name: "Planet B" }, "planet");
    bookmarkManager.addBookmark({ hostStar: "System A" }, "system");

    // Get all
    expect(bookmarkManager.getAllBookmarks()).toHaveLength(3);

    // Filter by type
    expect(bookmarkManager.getBookmarksByType("planet")).toHaveLength(2);
    expect(bookmarkManager.getBookmarksByType("system")).toHaveLength(1);

    // Search
    expect(bookmarkManager.searchBookmarks("Planet")).toHaveLength(2);
  });

  test("should export and import bookmarks", () => {
    bookmarkManager.addBookmark({ name: "Test Planet" }, "planet");

    // Export
    const exported = bookmarkManager.exportBookmarks();
    const parsed = JSON.parse(exported);
    expect(parsed.bookmarks).toHaveLength(1);

    // Clear and import
    localStorage.clear();
    const newManager = new BookmarkManager();
    const importResult = newManager.importBookmarks(exported);
    expect(importResult).toBe(true);
    expect(newManager.getCount()).toBe(1);
  });

  test("should persist to localStorage", () => {
    bookmarkManager.addBookmark({ name: "Persist Test" }, "planet");

    const newManager = new BookmarkManager();
    expect(newManager.getCount()).toBe(1);
    expect(newManager.isBookmarked("Persist Test", "planet")).toBe(true);
  });
});
