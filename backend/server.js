import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialize cache (TTL in seconds, default 24 hours)
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 86400,
  checkperiod: 600, // Check for expired keys every 10 minutes
});

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// CORS middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// NASA Exoplanet Archive API endpoint
const NASA_API_BASE = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";

/**
 * GET /api/exoplanets
 * Fetches exoplanet data from NASA Exoplanet Archive
 * Proxies the request to avoid CORS issues on the frontend
 * Implements caching and rate limiting
 */
app.get("/api/exoplanets", limiter, async (req, res) => {
  try {
    const cacheKey = "all_exoplanets";

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log("✅ Serving exoplanets from cache");
      return res.json(cachedData);
    }

    console.log("📡 Fetching exoplanets from NASA API...");

    // Build query for NASA Exoplanet Archive
    // Using TAP (Table Access Protocol) to query the exoplanet catalog
    const query = `
      SELECT
        pl_name, pl_rade, pl_bmasse, pl_eqt, pl_dens, pl_orbper,
        pl_orbeccen, pl_orbsmax, pl_insol, pl_orbincl, pl_orblper,
        pl_radj, pl_massj,
        hostname, sy_dist, sy_snum, sy_pnum,
        disc_year, discoverymethod, disc_facility,
        st_teff, st_rad, st_mass, st_lum, st_spectype, st_age,
        ra, dec
      FROM ps
      WHERE default_flag = 1
    `
      .replace(/\s+/g, " ")
      .trim();

    const apiUrl = `${NASA_API_BASE}?query=${encodeURIComponent(
      query
    )}&format=json`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `NASA API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Store in cache
    cache.set(cacheKey, data);
    console.log(`✅ Cached ${data.length} exoplanets`);

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching exoplanets:", error);
    res.status(500).json({
      error: "Failed to fetch exoplanet data",
      message: error.message,
    });
  }
});

/**
 * GET /api/planet/:name
 * Get detailed information about a specific planet
 * Implements caching and input validation
 */
app.get("/api/planet/:name", limiter, async (req, res) => {
  try {
    const planetName = req.params.name;

    // Validate input
    if (!planetName || planetName.trim().length === 0) {
      return res.status(400).json({ error: "Planet name is required" });
    }

    if (planetName.length > 100) {
      return res.status(400).json({ error: "Planet name too long" });
    }

    const cacheKey = `planet_${planetName}`;

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`✅ Serving planet "${planetName}" from cache`);
      return res.json(cachedData);
    }

    // Sanitize input to prevent SQL injection
    // TAP queries require proper escaping of single quotes
    const sanitizedName = planetName.replace(/'/g, "''");

    const query = `
      SELECT *
      FROM ps
      WHERE pl_name = '${sanitizedName}' AND default_flag = 1
    `
      .replace(/\s+/g, " ")
      .trim();

    const apiUrl = `${NASA_API_BASE}?query=${encodeURIComponent(
      query
    )}&format=json`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      return res.status(404).json({ error: "Planet not found" });
    }

    // Store in cache
    cache.set(cacheKey, data[0]);

    res.json(data[0]);
  } catch (error) {
    console.error("❌ Error fetching planet details:", error);
    res.status(500).json({
      error: "Failed to fetch planet details",
      message: error.message,
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint with cache statistics
 */
app.get("/api/health", (req, res) => {
  const stats = cache.getStats();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    cache: {
      keys: cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate:
        stats.hits + stats.misses > 0
          ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + "%"
          : "N/A",
    },
  });
});

/**
 * POST /api/cache/clear
 * Clear the cache (useful for development/testing)
 */
app.post("/api/cache/clear", (req, res) => {
  const keysDeleted = cache.keys().length;
  cache.flushAll();
  console.log("🗑️ Cache cleared");
  res.json({
    success: true,
    message: "Cache cleared successfully",
    keysDeleted,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NASA Exoplanet Explorer API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
