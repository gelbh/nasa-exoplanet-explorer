/**
 * Keep-Alive Script for Render Backend
 *
 * This script pings your backend every 10 minutes to prevent it from
 * spinning down on Render's free tier.
 *
 * Usage:
 *   BACKEND_URL=https://your-backend.onrender.com node scripts/keep-alive.js
 *
 * Note: This is for local/server use only. For production, use:
 *   - cron-job.org (easiest)
 *   - GitHub Actions (recommended)
 *   - UptimeRobot (with monitoring)
 *
 * See KEEP_ALIVE_GUIDE.md for detailed instructions.
 */

import fetch from "node-fetch";

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const INTERVAL_MINUTES = 10;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

/**
 * Format timestamp for logging
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Ping the backend health endpoint
 */
async function pingBackend() {
  const healthUrl = `${BACKEND_URL}/api/health`;

  console.log(`${colors.gray}${"=".repeat(60)}${colors.reset}`);
  console.log(
    `${colors.blue}🏓 Pinging backend at ${getTimestamp()}${colors.reset}`
  );
  console.log(`${colors.gray}   URL: ${healthUrl}${colors.reset}`);

  try {
    const startTime = Date.now();
    const response = await fetch(healthUrl);
    const duration = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ Backend is alive!${colors.reset}`);
      console.log(`${colors.gray}   Status: ${response.status}${colors.reset}`);
      console.log(
        `${colors.gray}   Response time: ${duration}ms${colors.reset}`
      );
      console.log(
        `${colors.gray}   Response:`,
        JSON.stringify(data),
        colors.reset
      );
    } else {
      console.error(
        `${colors.red}❌ Backend returned status ${response.status}${colors.reset}`
      );
      console.error(
        `${colors.yellow}⚠️  The backend might be experiencing issues${colors.reset}`
      );
    }
  } catch (error) {
    console.error(
      `${colors.red}❌ Error pinging backend:${colors.reset}`,
      error.message
    );
    console.error(
      `${colors.yellow}⚠️  Make sure the backend URL is correct and the service is running${colors.reset}`
    );
  }

  const nextPing = new Date(Date.now() + INTERVAL_MS);
  console.log(
    `${colors.gray}⏰ Next ping scheduled for: ${nextPing.toISOString()}${
      colors.reset
    }`
  );
  console.log(`${colors.gray}${"=".repeat(60)}${colors.reset}\n`);
}

/**
 * Start the keep-alive service
 */
function start() {
  console.log(`\n${colors.green}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.green}🚀 Keep-Alive Service Started${colors.reset}`);
  console.log(`${colors.gray}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Backend URL:${colors.reset} ${BACKEND_URL}`);
  console.log(
    `${colors.blue}Ping Interval:${colors.reset} ${INTERVAL_MINUTES} minutes`
  );
  console.log(`${colors.gray}${"=".repeat(60)}${colors.reset}\n`);

  // Validate backend URL
  if (BACKEND_URL === "http://localhost:5000") {
    console.log(
      `${colors.yellow}⚠️  Warning: Using default localhost URL${colors.reset}`
    );
    console.log(
      `${colors.yellow}   Set BACKEND_URL environment variable to your Render backend URL${colors.reset}`
    );
    console.log(
      `${colors.yellow}   Example: BACKEND_URL=https://your-backend.onrender.com node scripts/keep-alive.js${colors.reset}\n`
    );
  }

  // Initial ping
  pingBackend();

  // Set up interval for subsequent pings
  setInterval(pingBackend, INTERVAL_MS);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log(
    `\n\n${colors.yellow}🛑 Shutting down keep-alive service...${colors.reset}`
  );
  console.log(
    `${colors.gray}Backend may spin down after 15 minutes of inactivity${colors.reset}\n`
  );
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(
    `\n\n${colors.yellow}🛑 Shutting down keep-alive service...${colors.reset}\n`
  );
  process.exit(0);
});

// Start the service
start();
