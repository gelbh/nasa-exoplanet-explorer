# NASA Exoplanet Explorer

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-4CAF50?style=for-the-badge)](https://nasa-exoplanet-explorer.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![NASA Data](https://img.shields.io/badge/Data-NASA_Exoplanet_Archive-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://exoplanetarchive.ipac.caltech.edu/)

</div>

<div align="center">

![React](https://img.shields.io/badge/React-19.1-61dafb?style=flat-square&logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r170-000000?style=flat-square&logo=three.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=flat-square&logo=vite&logoColor=white)

</div>

---

An interactive 3D visualization tool for exploring confirmed exoplanets from NASA's Exoplanet Archive. Built with React, Three.js, and Node.js/Express.

## Features

### Core Features
- **3D Visualization**: Explore exoplanets in stunning 3D using Three.js
- **Real NASA Data**: Fetches live data from NASA Exoplanet Archive (5000+ confirmed planets)
- **Procedural Generation**: Planets are procedurally generated based on real physical properties
- **Galaxy View**: See star systems distributed across a galaxy visualization
- **Interactive Search**: Search and filter planets by name, type, temperature, and distance
- **Planet Details**: View comprehensive information about each exoplanet

## Technology Stack

### Frontend

- **React** (v19) - UI framework
- **Vite** - Build tool and dev server
- **Three.js** - 3D graphics and visualization
- **Modern CSS** - Responsive styling with CSS variables

### Backend

- **Node.js** - Runtime environment
- **Express** - Web server framework
- **NASA Exoplanet Archive API** - Data source via TAP (Table Access Protocol)

## Project Structure

```
nasa-exoplanet-explorer/
├── backend/                         # Express API server
│   └── server.js                    # NASA API proxy endpoint
├── frontend/                        # React + Three.js application
│   ├── src/
│   │   ├── components/              # React UI components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Core libraries
│   │   │   ├── managers/            # State and interaction managers
│   │   │   ├── rendering/           # Three.js rendering (planets, stars, scenes)
│   │   │   ├── physics/             # Physics calculations
│   │   │   └── utils/               # Utility functions
│   │   ├── styles/                  # CSS/SCSS styling
│   │   ├── utils/                   # Frontend utilities
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   ├── public/                      # Static assets (textures, etc.)
│   └── index.html                   # HTML template
└── README.md
```

## Architecture

The application follows a modular architecture with clear separation of concerns:

### Frontend Architecture

- **Components** - React components for UI rendering
  - Modular, reusable components for different UI sections
  - Custom hooks for state management and side effects
- **Hooks** - Custom React hooks for logic extraction
  - Separates business logic from UI components
  - Manages Three.js scene lifecycle, data fetching, and user interactions
- **Managers** - Class-based managers for complex state
  - **Data Managers**: API calls, filtering, and data transformation
  - **UI Managers**: Panel visibility, tooltips, and UI state
  - **Interaction Managers**: Camera controls, search coordination
  - **Settings Managers**: Application configuration and preferences
- **Rendering** - Three.js rendering pipeline
  - **Planets**: Procedural planet generation with materials, atmospheres, and rings
  - **Stars**: Star field and host star rendering
  - **Scenes**: Galaxy view, system view, and scene transitions
  - **Shaders**: Custom GLSL shaders for visual effects
- **Physics** - Realistic physics calculations
  - Orbital mechanics and planetary motion
  - Habitable zone calculations
  - Temperature and atmospheric modeling

### Backend Architecture

- **Express Server** - RESTful API server
  - Proxy for NASA Exoplanet Archive API
  - CORS handling for cross-origin requests
  - Error handling and request validation

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Quick Start

1. Install all dependencies (backend and frontend):

```bash
npm run install-all
```

2. Start both backend and frontend servers:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend server on `http://localhost:5173`

3. Open your browser to `http://localhost:5173`

### Individual Setup (Optional)

If you prefer to run backend and frontend separately:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Usage

### Galaxy View

- **Drag** to rotate the camera
- **Scroll** to zoom in/out
- **Right-click + drag** to pan
- **Click** on a star system to explore its planets

### Planet View

- Explore individual exoplanets with procedurally generated visuals
- View detailed information including radius, mass, temperature, and discovery details
- Navigate back to galaxy view with the "Back to Galaxy" button

### Search & Filter

- Use the search panel to find specific planets or star systems
- Results update in real-time as you type
- Click any result to jump to that planet

## API Endpoints

### Backend API

- `GET /api/exoplanets` - Fetch all confirmed exoplanets from NASA
- `GET /api/planet/:name` - Get detailed information for a specific planet
- `GET /api/health` - Health check endpoint

## Planet Classification

Planets are automatically classified based on their physical properties:

- **Terrestrial**: Rocky planets similar to Earth (< 1.25 R⊕)
- **Super-Earth**: Larger rocky planets (1.25-2.0 R⊕)
- **Neptune-like**: Ice giants (2.0-10.0 R⊕)
- **Jupiter-like**: Gas giants (> 10.0 R⊕)

## Data Visualization Features

- **Procedural Planet Generation**: Each planet's appearance is generated based on:

  - Planet type (terrestrial, super-Earth, Neptune-like, Jupiter-like)
  - Surface temperature (determines color and emissions)
  - Atmospheric properties
  - Host star characteristics

- **Star Rendering**: Host stars are rendered with:

  - Color based on stellar temperature (blue hot → red cool)
  - Brightness based on stellar luminosity
  - Realistic lighting effects

- **Galaxy View**: Star systems are distributed in a spiral pattern with:
  - Color coding by number of planets
  - Size indicating system complexity
  - Pulsing animation effects

## Performance Optimizations

### Frontend
- **Code Splitting**: Vendor chunks separated for optimal loading
- **Lazy Loading**: Three.js modules loaded on demand
- **Batch Processing**: Exoplanet data processed in batches to avoid blocking UI
- **Request Idle Callback**: Uses browser idle time for non-critical operations
- **Efficient Rendering**: Three.js optimizations for smooth 60 FPS
- **Reduced Motion Support**: Respects user preferences for animations

### Backend
- **In-Memory Caching**: Node-cache with 24-hour TTL for API responses
- **Rate Limiting**: Prevents abuse with configurable request limits
- **Compression**: Gzip/Brotli compression for faster responses
- **Request Logging**: Morgan middleware for development and production
- **Security Headers**: Helmet.js for enhanced security

## Development

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Run tests with coverage
npm test -- --coverage

# Backend tests (if available)
cd backend
npm test
```

### Code Quality

```bash
# Run linter
npm run lint

# Format code with Prettier
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

## Deployment

The application is deployed using platform-native builds (no Docker required):

### Frontend - Vercel

**Live URL:** [https://nasa-exoplanet-explorer.vercel.app/](https://nasa-exoplanet-explorer.vercel.app/)

The frontend is automatically deployed to Vercel on push to `main`:

- **Build Command:** `npm run build` (runs Vite production build)
- **Output Directory:** `dist/`
- **Configuration:** `vercel.json` handles SPA routing and cache headers
- **Deployment:** Automatic on git push

### Backend - Render

**Live URL:** [https://nasa-exoplanet-explorer.onrender.com/](https://nasa-exoplanet-explorer.onrender.com/)

The backend is deployed to Render using native Node.js runtime:

- **Configuration:** `backend/render.yaml`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check:** `/api/health` endpoint
- **Environment:** Node.js 18+ production environment

### Manual Deployment

To deploy to other platforms:

1. **Frontend:** Build with `npm run build` and serve the `frontend/dist` folder
2. **Backend:** Run `npm install` and `npm start` with Node.js 18+
3. Set environment variable `CORS_ORIGIN` to your frontend URL

## API Documentation

### Endpoints

#### GET /api/exoplanets
Fetch all confirmed exoplanets from NASA Exoplanet Archive.

**Response:** Array of exoplanet objects with physical properties

**Caching:** 24 hours

**Rate Limit:** 100 requests per 15 minutes

#### GET /api/planet/:name
Get detailed information about a specific planet.

**Parameters:**
- `name` (string): Planet name (e.g., "Kepler-452b")

**Response:** Single planet object with all available data

#### GET /api/health
Health check endpoint with cache statistics.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T10:00:00.000Z",
  "environment": "production",
  "cache": {
    "keys": 15,
    "hits": 234,
    "misses": 12,
    "hitRate": "95.12%"
  }
}
```

#### POST /api/cache/clear
Clear the server cache (useful for development).

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "keysDeleted": 15
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:
- Follows the existing code style
- Includes appropriate tests
- Updates documentation as needed
- Passes all CI checks

## Credits

- **Data Source**: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)
- **3D Graphics**: [Three.js](https://threejs.org/)
- **Frontend Framework**: [React](https://react.dev/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Icons**: [Boxicons](https://boxicons.com/)
- **Styling**: [Bootstrap](https://getbootstrap.com/)

## License

MIT License - see LICENSE file for details

## Acknowledgments

This project uses data from the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with NASA under the Exoplanet Exploration Program.

## Support

If you find this project helpful, please consider:
- Starring the repository ⭐
- Reporting bugs and suggesting features
- Contributing code improvements
- Sharing with others interested in space exploration

---

**Made with ❤️ for space enthusiasts and astronomy lovers**
