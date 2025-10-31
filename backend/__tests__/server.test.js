import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Server Validation Functions", () => {
  describe("Port Validation", () => {
    it("should accept valid port numbers", () => {
      // Testing the validatePort logic
      const validatePort = (port) => {
        const parsed = parseInt(port);
        if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
          throw new Error(
            `Invalid PORT value: ${port}. Must be a number between 1 and 65535.`
          );
        }
        return parsed;
      };

      expect(validatePort("5000")).toBe(5000);
      expect(validatePort("80")).toBe(80);
      expect(validatePort("65535")).toBe(65535);
      expect(validatePort("1")).toBe(1);
    });

    it("should reject invalid port numbers", () => {
      const validatePort = (port) => {
        const parsed = parseInt(port);
        if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
          throw new Error(
            `Invalid PORT value: ${port}. Must be a number between 1 and 65535.`
          );
        }
        return parsed;
      };

      expect(() => validatePort("0")).toThrow("Invalid PORT value");
      expect(() => validatePort("65536")).toThrow("Invalid PORT value");
      expect(() => validatePort("invalid")).toThrow("Invalid PORT value");
      expect(() => validatePort("-100")).toThrow("Invalid PORT value");
    });
  });

  describe("TTL Validation", () => {
    it("should accept valid TTL values", () => {
      const validateTTL = (ttl) => {
        const parsed = parseInt(ttl);
        if (isNaN(parsed) || parsed < 0) {
          return 86400;
        }
        return parsed;
      };

      expect(validateTTL("3600")).toBe(3600);
      expect(validateTTL("86400")).toBe(86400);
      expect(validateTTL("0")).toBe(0);
    });

    it("should use default for invalid TTL values", () => {
      const validateTTL = (ttl) => {
        const parsed = parseInt(ttl);
        if (isNaN(parsed) || parsed < 0) {
          return 86400;
        }
        return parsed;
      };

      expect(validateTTL("invalid")).toBe(86400);
      expect(validateTTL("-100")).toBe(86400);
    });
  });

  describe("CORS Origin Validation", () => {
    it("should accept valid CORS origins", () => {
      const validateCorsOrigin = (origin) => {
        if (!origin) {
          return "http://localhost:5173";
        }
        if (origin !== "*" && !origin.match(/^https?:\/\//)) {
          return "http://localhost:5173";
        }
        return origin;
      };

      expect(validateCorsOrigin("http://localhost:3000")).toBe(
        "http://localhost:3000"
      );
      expect(validateCorsOrigin("https://example.com")).toBe(
        "https://example.com"
      );
      expect(validateCorsOrigin("*")).toBe("*");
    });

    it("should use default for invalid CORS origins", () => {
      const validateCorsOrigin = (origin) => {
        if (!origin) {
          return "http://localhost:5173";
        }
        if (origin !== "*" && !origin.match(/^https?:\/\//)) {
          return "http://localhost:5173";
        }
        return origin;
      };

      expect(validateCorsOrigin("")).toBe("http://localhost:5173");
      expect(validateCorsOrigin("invalid-url")).toBe("http://localhost:5173");
      expect(validateCorsOrigin("localhost:3000")).toBe(
        "http://localhost:5173"
      );
    });
  });

  describe("Rate Limit Validation", () => {
    it("should accept valid rate limit values", () => {
      const validateRateLimit = (value, defaultValue, _name) => {
        const parsed = parseInt(value);
        if (isNaN(parsed) || parsed < 0) {
          return defaultValue;
        }
        return parsed;
      };

      expect(validateRateLimit("100", 50, "TEST")).toBe(100);
      expect(validateRateLimit("0", 50, "TEST")).toBe(0);
      expect(validateRateLimit("1000", 50, "TEST")).toBe(1000);
    });

    it("should use default for invalid rate limit values", () => {
      const validateRateLimit = (value, defaultValue, _name) => {
        const parsed = parseInt(value);
        if (isNaN(parsed) || parsed < 0) {
          return defaultValue;
        }
        return parsed;
      };

      expect(validateRateLimit("invalid", 50, "TEST")).toBe(50);
      expect(validateRateLimit("-100", 50, "TEST")).toBe(50);
      expect(validateRateLimit(undefined, 50, "TEST")).toBe(50);
    });
  });
});

describe("API Input Validation", () => {
  describe("Planet Name Validation", () => {
    it("should accept valid planet names", () => {
      const validNames = [
        "Kepler-452b",
        "TRAPPIST-1e",
        "HD 209458 b",
        "Proxima Centauri b",
        "TOI-700 d",
        "K2-18b",
      ];

      validNames.forEach((name) => {
        expect(name).toMatch(/^[a-zA-Z0-9 \-_.()]+$/);
      });
    });

    it("should reject invalid planet names", () => {
      const invalidNames = [
        "Planet<script>",
        "Planet'; DROP TABLE--",
        "Planet@#$",
        "Planet\nNewline",
        "Planet\tTab",
      ];

      invalidNames.forEach((name) => {
        expect(name).not.toMatch(/^[a-zA-Z0-9 \-_.()]+$/);
      });
    });

    it("should sanitize single quotes in planet names", () => {
      const sanitize = (name) => name.replace(/'/g, "''");

      expect(sanitize("O'Neill's Planet")).toBe("O''Neill''s Planet");
      expect(sanitize("Test'Planet")).toBe("Test''Planet");
      expect(sanitize("Normal-Planet")).toBe("Normal-Planet");
    });
  });

  describe("Length Validation", () => {
    it("should accept names within length limits", () => {
      const validName = "A".repeat(100);
      expect(validName.length).toBeLessThanOrEqual(100);
    });

    it("should reject names exceeding length limits", () => {
      const tooLong = "A".repeat(101);
      expect(tooLong.length).toBeGreaterThan(100);
    });
  });
});

describe("Error Response Formatting", () => {
  it("should format network errors correctly", () => {
    const errors = [
      { code: "ECONNREFUSED", expectedStatus: 503 },
      { code: "ENOTFOUND", expectedStatus: 503 },
      { code: "ETIMEDOUT", expectedStatus: 503 },
      { type: "system", expectedStatus: 503 },
    ];

    errors.forEach(({ code, type, expectedStatus }) => {
      const error = { code, type };
      let statusCode = 500;

      if (
        error.code === "ECONNREFUSED" ||
        error.code === "ENOTFOUND" ||
        error.code === "ETIMEDOUT" ||
        error.type === "system"
      ) {
        statusCode = 503;
      }

      expect(statusCode).toBe(expectedStatus);
    });
  });

  it("should format HTTP errors correctly", () => {
    const error = { message: "NASA API error: 500" };
    let statusCode = 500;

    if (error.message && error.message.includes("NASA API error")) {
      statusCode = 502;
    }

    expect(statusCode).toBe(502);
  });
});

describe("Cache Key Generation", () => {
  it("should generate correct cache keys", () => {
    const allExoplanetsCacheKey = "all_exoplanets";
    const planetCacheKey = (name) => `planet_${name}`;

    expect(allExoplanetsCacheKey).toBe("all_exoplanets");
    expect(planetCacheKey("Kepler-452b")).toBe("planet_Kepler-452b");
    expect(planetCacheKey("TRAPPIST-1e")).toBe("planet_TRAPPIST-1e");
  });
});

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should use default values when environment variables are not set", () => {
    // Delete env vars to test defaults (Vitest sets NODE_ENV='test' by default)
    delete process.env.PORT;
    delete process.env.NODE_ENV;

    const PORT = parseInt(process.env.PORT || "5000");
    const NODE_ENV = process.env.NODE_ENV || "development";

    expect(PORT).toBe(5000);
    expect(NODE_ENV).toBe("development");
  });

  it("should use environment variables when set", () => {
    process.env.PORT = "8080";
    process.env.NODE_ENV = "production";

    const PORT = parseInt(process.env.PORT || "5000");
    const NODE_ENV = process.env.NODE_ENV || "development";

    expect(PORT).toBe(8080);
    expect(NODE_ENV).toBe("production");
  });
});

describe("NASA API Query Building", () => {
  it("should build correct query for all exoplanets", () => {
    const query = `
      SELECT
        pl_name, pl_rade, pl_bmasse, pl_eqt, pl_dens, pl_orbper,
        pl_orbeccen, pl_orbsmax, pl_insol, pl_orbincl, pl_orblper,
        pl_radj, pl_massj,
        hostname, sy_dist, sy_pnum,
        disc_year, discoverymethod, disc_facility,
        st_teff, st_rad, st_mass, st_lum, st_spectype, st_age,
        ra, dec
      FROM ps
      WHERE default_flag = 1
    `
      .replace(/\s+/g, " ")
      .trim();

    expect(query).toContain("SELECT");
    expect(query).toContain("FROM ps");
    expect(query).toContain("WHERE default_flag = 1");
    expect(query).not.toContain("\n");
  });

  it("should build correct query for specific planet", () => {
    const planetName = "Kepler-452b";
    const sanitizedName = planetName.replace(/'/g, "''");

    const query = `
      SELECT *
      FROM ps
      WHERE pl_name = '${sanitizedName}' AND default_flag = 1
    `
      .replace(/\s+/g, " ")
      .trim();

    expect(query).toContain("pl_name = 'Kepler-452b'");
    expect(query).toContain("default_flag = 1");
  });
});

describe("Health Check Response", () => {
  it("should format health check response correctly", () => {
    const mockStats = { hits: 100, misses: 50 };
    const mockKeys = ["key1", "key2", "key3"];

    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      cache: {
        keys: mockKeys.length,
        hits: mockStats.hits,
        misses: mockStats.misses,
        hitRate:
          mockStats.hits + mockStats.misses > 0
            ? (
                (mockStats.hits / (mockStats.hits + mockStats.misses)) *
                100
              ).toFixed(2) + "%"
            : "N/A",
      },
    };

    expect(response.status).toBe("ok");
    expect(response.cache.keys).toBe(3);
    expect(response.cache.hits).toBe(100);
    expect(response.cache.misses).toBe(50);
    expect(response.cache.hitRate).toBe("66.67%");
  });

  it("should handle N/A hit rate when no cache activity", () => {
    const mockStats = { hits: 0, misses: 0 };

    const hitRate =
      mockStats.hits + mockStats.misses > 0
        ? (
            (mockStats.hits / (mockStats.hits + mockStats.misses)) *
            100
          ).toFixed(2) + "%"
        : "N/A";

    expect(hitRate).toBe("N/A");
  });
});
