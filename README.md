# NASA Exoplanet Explorer

![React](https://img.shields.io/badge/React-19.1-61dafb?style=for-the-badge&logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r170-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)

An interactive 3D visualization tool for exploring confirmed exoplanets from NASA's Exoplanet Archive. Built with React, Three.js, and Node.js/Express.

## Features

### Core Features
- **3D Visualization**: Explore exoplanets in stunning 3D using Three.js
- **Real NASA Data**: Fetches live data from NASA Exoplanet Archive (5000+ confirmed planets)
- **Procedural Generation**: Planets are procedurally generated based on real physical properties
- **Galaxy View**: See star systems distributed across a galaxy visualization
- **Interactive Search**: Search and filter planets by name, type, temperature, and distance
- **Planet Details**: View comprehensive information about each exoplanet

### New Features ✨
- **Bookmarks & Favorites**: Save and manage your favorite planets and systems
- **Planet Comparison**: Compare multiple exoplanets side-by-side with visual charts
- **Share & Export**: Generate shareable URLs, export screenshots, and download planet data
- **PWA Support**: Install as an app, works offline with service worker caching
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

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
├── backend/
│   ├── server.js                    # Express server with NASA API proxy
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── ExoplanetViewer.jsx  # Main 3D viewer component
│   │   │   ├── SearchPanel.jsx      # Search and filter UI
│   │   │   ├── InfoPanel.jsx        # Planet information display
│   │   │   ├── CombinedPanel.jsx    # Combined search/info panel
│   │   │   ├── CanvasContainer.jsx  # Three.js canvas wrapper
│   │   │   ├── CanvasControls.jsx   # Canvas control buttons
│   │   │   ├── SettingsPanel.jsx    # Settings UI
│   │   │   └── InstructionsOverlay.jsx # Help overlay
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useThreeJSScene.js   # Three.js scene management
│   │   │   ├── useExoplanetData.js  # Data fetching and state
│   │   │   ├── useDOMRefs.js        # DOM references
│   │   │   ├── useUIManagers.js     # UI manager instances
│   │   │   ├── useCanvasInteraction.js # Canvas interactions
│   │   │   ├── useSettingsHandlers.js  # Settings logic
│   │   │   ├── useViewTransitions.js   # View state transitions
│   │   │   └── useInfoTab.js        # Info panel tab logic
│   │   ├── lib/                     # Core libraries and utilities
│   │   │   ├── managers/            # State and interaction managers
│   │   │   │   ├── data/            # Data management
│   │   │   │   │   ├── ApiManager.js
│   │   │   │   │   ├── FilterManager.js
│   │   │   │   │   └── SolarSystemData.js
│   │   │   │   ├── interactions/    # User interactions
│   │   │   │   │   ├── CameraManager.js
│   │   │   │   │   └── SearchCoordinator.js
│   │   │   │   ├── settings/        # Application settings
│   │   │   │   │   └── SettingsManager.js
│   │   │   │   └── ui/              # UI state management
│   │   │   │       ├── UIManager.js
│   │   │   │       ├── InfoTabManager.js
│   │   │   │       ├── PanelManager.js
│   │   │   │       └── TooltipManager.js
│   │   │   ├── rendering/           # Three.js rendering modules
│   │   │   │   ├── planets/         # Planet rendering
│   │   │   │   │   ├── PlanetRenderer.js
│   │   │   │   │   ├── PlanetMaterialGenerator.js
│   │   │   │   │   ├── PlanetAtmosphereRenderer.js
│   │   │   │   │   ├── PlanetRingRenderer.js
│   │   │   │   │   └── TextureGenerator.js
│   │   │   │   ├── stars/           # Star rendering
│   │   │   │   │   └── StarRenderer.js
│   │   │   │   ├── scenes/          # Scene management
│   │   │   │   │   ├── SceneManager.js
│   │   │   │   │   ├── GalaxyRenderer.js
│   │   │   │   │   ├── SystemRenderer.js
│   │   │   │   │   └── OrbitalMechanics.js
│   │   │   │   └── shaders/         # GLSL shaders
│   │   │   │       └── index.js
│   │   │   ├── physics/             # Physics calculations
│   │   │   │   └── index.js
│   │   │   └── utils/               # Utility functions
│   │   │       ├── constants.js
│   │   │       └── helpers.js
│   │   ├── styles/                  # CSS/SCSS styling
│   │   │   ├── App.css
│   │   │   └── ExoplanetViewer.scss
│   │   ├── utils/                   # Frontend utilities
│   │   │   └── constants.js
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   ├── public/                      # Static assets
│   │   └── textures/                # Planet and galaxy textures
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
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

### Running with Docker

```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

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

### Frontend (Vercel)
The frontend is configured for Vercel deployment with automatic builds on push to main.

### Backend (Render)
The backend is configured for Render deployment with the included `render.yaml`.

### Docker Deployment
Use the provided Dockerfiles for containerized deployment to any platform.

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

## Roadmap

- [ ] Timeline visualization of exoplanet discoveries
- [ ] Educational mode with guided tours
- [ ] Statistics dashboard with charts
- [ ] Multi-language support (i18n)
- [ ] Advanced filters (habitable zone, discovery method)
- [ ] 3D model exports (GLTF/OBJ)
- [ ] Collaborative features (shared bookmarks)

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
