import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// NASA Exoplanet Archive API endpoint
const NASA_API_BASE = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";

/**
 * GET /api/exoplanets
 * Fetches exoplanet data from NASA Exoplanet Archive
 * Proxies the request to avoid CORS issues on the frontend
 */
app.get("/api/exoplanets", async (req, res) => {
  try {
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

    res.json(data);
  } catch (error) {
    console.error("Error fetching exoplanets:", error);
    res.status(500).json({
      error: "Failed to fetch exoplanet data",
      message: error.message,
    });
  }
});

/**
 * GET /api/planet/:name
 * Get detailed information about a specific planet
 */
app.get("/api/planet/:name", async (req, res) => {
  try {
    const planetName = req.params.name;

    const query = `
      SELECT *
      FROM ps
      WHERE pl_name = '${planetName}' AND default_flag = 1
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

    res.json(data[0]);
  } catch (error) {
    console.error("Error fetching planet details:", error);
    res.status(500).json({
      error: "Failed to fetch planet details",
      message: error.message,
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NASA Exoplanet Explorer API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
