/**
 * Tests for ApiManager
 */
import { ApiManager } from "../ApiManager";

describe("ApiManager", () => {
  let apiManager;
  const mockEndpoint = "http://localhost:5000/api/exoplanets";

  beforeEach(() => {
    apiManager = new ApiManager(mockEndpoint);
  });

  describe("Planet Classification", () => {
    test("should classify terrestrial planets correctly", () => {
      const result = apiManager.classifyPlanet(1.0, 288, 5.5, 1.0);
      expect(result).toBe("terrestrial");
    });

    test("should classify super-earth planets correctly", () => {
      const result = apiManager.classifyPlanet(1.5, 300, 4.0, 3.0);
      expect(result).toBe("super-earth");
    });

    test("should classify neptune-like planets correctly", () => {
      const result = apiManager.classifyPlanet(3.5, 150, 1.5, 15.0);
      expect(result).toBe("neptune");
    });

    test("should classify jupiter-like planets correctly", () => {
      const result = apiManager.classifyPlanet(11.0, 120, 1.2, 300.0);
      expect(result).toBe("jupiter");
    });

    test("should use density when available", () => {
      const result = apiManager.classifyPlanet(5.0, 200, 4.5, 20.0);
      expect(result).toBe("super-earth");
    });
  });

  describe("Planet Data Processing", () => {
    test("should process valid planet data", () => {
      const raw = {
        pl_name: "Test Planet",
        pl_rade: 1.2,
        pl_bmasse: 1.5,
        pl_eqt: 300,
        hostname: "Test Star",
        sy_dist: 10,
        disc_year: 2020,
      };

      const result = apiManager.processPlanetData(raw);

      expect(result.name).toBe("Test Planet");
      expect(result.radius).toBe(1.2);
      expect(result.mass).toBe(1.5);
      expect(result.temperature).toBe(300);
      expect(result.hostStar).toBe("Test Star");
      expect(result.type).toBeDefined();
    });

    test("should handle missing data gracefully", () => {
      const raw = {
        pl_name: "Minimal Planet",
      };

      const result = apiManager.processPlanetData(raw);

      expect(result.name).toBe("Minimal Planet");
      expect(result.radius).toBeGreaterThan(0);
      expect(result.mass).toBeGreaterThan(0);
      expect(result.temperature).toBeGreaterThan(0);
    });

    test("should clamp values to realistic bounds", () => {
      const raw = {
        pl_name: "Extreme Planet",
        pl_rade: 1000, // Too large
        pl_bmasse: 50000, // Too large
        pl_eqt: 50000, // Too hot
      };

      const result = apiManager.processPlanetData(raw);

      expect(result.radius).toBeLessThanOrEqual(100);
      expect(result.mass).toBeLessThanOrEqual(10000);
      expect(result.temperature).toBeLessThanOrEqual(10000);
    });
  });

  describe("Cache Management", () => {
    test("should detect valid cache", () => {
      localStorage.setItem(apiManager.cacheTimestampKey, Date.now().toString());
      expect(apiManager.isCacheValid()).toBe(true);
    });

    test("should detect expired cache", () => {
      const oldTimestamp = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      localStorage.setItem(
        apiManager.cacheTimestampKey,
        oldTimestamp.toString()
      );
      expect(apiManager.isCacheValid()).toBe(false);
    });

    test("should save and load from cache", () => {
      const testData = [{ name: "Test" }];
      apiManager.saveToCache(testData);

      const loaded = apiManager.loadFromCache();
      expect(loaded).toEqual(testData);
    });
  });
});
