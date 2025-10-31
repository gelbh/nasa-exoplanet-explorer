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

// Validate environment variables
const validatePort = (port) => {
  const parsed = parseInt(port);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `Invalid PORT value: ${port}. Must be a number between 1 and 65535.`
    );
  }
  return parsed;
};

const validateTTL = (ttl) => {
  const parsed = parseInt(ttl);
  if (isNaN(parsed) || parsed < 0) {
    console.warn(
      `Invalid CACHE_TTL value: ${ttl}. Using default: 86400 seconds.`
    );
    return 86400;
  }
  return parsed;
};

const validateCorsOrigin = (origin) => {
  if (!origin) {
    console.warn("CORS_ORIGIN not set. Using default: http://localhost:5173");
    return "http://localhost:5173";
  }
  // Basic validation: check if it's a valid URL or wildcard
  if (origin !== "*" && !origin.match(/^https?:\/\//)) {
    console.warn(
      `Invalid CORS_ORIGIN: ${origin}. Must start with http:// or https://. Using default.`
    );
    return "http://localhost:5173";
  }
  return origin;
};

const validateRateLimit = (value, defaultValue, name) => {
  const parsed = parseInt(value);
  if (isNaN(parsed) || parsed < 0) {
    console.warn(
      `Invalid ${name} value: ${value}. Using default: ${defaultValue}`
    );
    return defaultValue;
  }
  return parsed;
};

const app = express();
const PORT = validatePort(process.env.PORT || "5000");
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialize cache (TTL in seconds, default 24 hours)
const cache = new NodeCache({
  stdTTL: validateTTL(process.env.CACHE_TTL || "86400"),
  checkperiod: 600, // Check for expired keys every 10 minutes
});

// Security middleware with Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://exoplanetarchive.ipac.caltech.edu"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin requests from frontend
  })
);

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
  origin: validateCorsOrigin(process.env.CORS_ORIGIN),
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: validateRateLimit(
    process.env.RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
    "RATE_LIMIT_WINDOW_MS"
  ),
  max: validateRateLimit(
    process.env.RATE_LIMIT_MAX_REQUESTS,
    100,
    "RATE_LIMIT_MAX_REQUESTS"
  ),
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// NASA Exoplanet Archive API endpoint
const NASA_API_BASE = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";

/**
 * GET /api/ping
 * Ultra-lightweight keep-alive endpoint
 * Optimized for frequent pings, not rate limited
 */
app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Friendly root route for quick backend verification
app.get("/", (req, res) => {
  res.json({
    service: "nasa-exoplanet-backend",
    status: "ok",
    endpoints: [
      "/api/ping",
      "/api/health",
      "/api/exoplanets",
      "/api/planet/:name",
    ],
  });
});

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

    // Differentiate between network errors and other errors
    let statusCode = 500;
    let errorType = "Failed to fetch exoplanet data";

    // Network/upstream errors
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT" ||
      error.type === "system"
    ) {
      statusCode = 503; // Service Unavailable
      errorType = "Upstream service unavailable";
    }
    // HTTP errors from NASA API
    else if (error.message && error.message.includes("HTTP error")) {
      statusCode = 502; // Bad Gateway
      errorType = "Upstream service error";
    }

    res.status(statusCode).json({
      error: errorType,
      message:
        NODE_ENV === "production" ? "Internal server error" : error.message,
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
    // Additional validation: only allow alphanumeric, spaces, hyphens, and common planet name characters
    // Note: Using space character instead of \s to prevent newlines, tabs, etc.
    if (!/^[a-zA-Z0-9 \-_.()]+$/.test(planetName)) {
      return res.status(400).json({
        error: "Invalid planet name format",
        message: "Planet name contains invalid characters",
      });
    }

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

    // Differentiate between network errors and other errors
    let statusCode = 500;
    let errorType = "Failed to fetch planet details";

    // Network/upstream errors
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT" ||
      error.type === "system"
    ) {
      statusCode = 503; // Service Unavailable
      errorType = "Upstream service unavailable";
    }
    // HTTP errors from NASA API
    else if (error.message && error.message.includes("NASA API error")) {
      statusCode = 502; // Bad Gateway
      errorType = "Upstream service error";
    }
    // Validation errors
    else if (error.message && error.message.includes("Invalid planet name")) {
      statusCode = 400; // Bad Request
      errorType = "Invalid request";
    }

    res.status(statusCode).json({
      error: errorType,
      message:
        NODE_ENV === "production" ? "Internal server error" : error.message,
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
 * Restricted to development environment or requires API key
 */
app.post("/api/cache/clear", (req, res) => {
  // Security: Only allow in development or with valid API key
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.ADMIN_API_KEY;

  if (NODE_ENV !== "development" && apiKey !== validApiKey) {
    return res.status(403).json({
      error: "Forbidden",
      message: "This endpoint requires authentication",
    });
  }

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
const _server = app.listen(PORT, () => {
  console.log(`🚀 NASA Exoplanet Explorer API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏓 Keep-alive ping: http://localhost:${PORT}/api/ping`);

  // Optional self-ping mechanism for additional keep-alive backup
  // Only enabled if ENABLE_SELF_PING environment variable is set
  if (process.env.ENABLE_SELF_PING === "true") {
    const SELF_PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (less than 15 min Render timeout)
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;

    console.log(
      `🔄 Self-ping enabled: Will ping ${baseUrl}/api/ping every 14 minutes`
    );

    const selfPing = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/ping`, {
          method: "GET",
          headers: { "User-Agent": "Backend-Self-Ping/1.0" },
        });

        if (response.ok) {
          console.log(`✅ Self-ping successful at ${new Date().toISOString()}`);
        } else {
          console.warn(
            `⚠️ Self-ping returned status ${
              response.status
            } at ${new Date().toISOString()}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Self-ping failed at ${new Date().toISOString()}:`,
          error.message
        );
      }
    };

    // Start self-ping after initial delay, then repeat
    setTimeout(() => {
      selfPing();
      setInterval(selfPing, SELF_PING_INTERVAL);
    }, 60000); // Wait 1 minute after server start
  }
});
