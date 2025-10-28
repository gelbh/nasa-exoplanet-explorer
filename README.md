# NASA Exoplanet Explorer

![React](https://img.shields.io/badge/React-19.1-61dafb?style=for-the-badge&logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r170-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

An interactive 3D visualization tool for exploring confirmed exoplanets from NASA's Exoplanet Archive. Built with React, Three.js, and Node.js/Express.

## Features

- **3D Visualization**: Explore exoplanets in stunning 3D using Three.js
- **Real NASA Data**: Fetches live data from NASA Exoplanet Archive (5000+ confirmed planets)
- **Procedural Generation**: Planets are procedurally generated based on real physical properties (radius, mass, temperature, stellar characteristics)
- **Galaxy View**: See star systems distributed across a galaxy visualization
- **Interactive Search**: Search and filter planets by name, type, temperature, and distance
- **Planet Details**: View comprehensive information about each exoplanet
- **Responsive Design**: Works on desktop and mobile devices

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

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional - defaults work fine):
```bash
cp .env.example .env
```

4. Start the server:
```bash
npm run dev    # Development mode with auto-reload
# or
npm start      # Production mode
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Running the Complete Application

1. **Terminal 1** - Start backend:
```bash
cd backend && npm run dev
```

2. **Terminal 2** - Start frontend:
```bash
cd frontend && npm run dev
```

3. Open your browser to `http://localhost:5173`

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

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

### Backend
The backend runs in production mode with:
```bash
cd backend
npm start
```

## Deployment

### Frontend Deployment (Vercel, Netlify, etc.)

1. Build the frontend:
```bash
cd frontend && npm run build
```

2. Deploy the `frontend/dist` folder to your hosting service

3. Update the `VITE_API_URL` environment variable to point to your deployed backend

### Backend Deployment (Render, Heroku, Railway, etc.)

1. Deploy the `backend` folder

2. Set the `PORT` environment variable (most platforms do this automatically)

3. Ensure your deployed backend URL is accessible from your frontend

### Environment Variables

**Frontend (.env)**:
```
VITE_API_URL=https://your-backend-url.com
```

**Backend (.env)**:
```
PORT=5000
```

## Performance Optimizations

- **Batch Processing**: Exoplanet data is processed in batches to avoid blocking the UI
- **Request Idle Callback**: Uses browser idle time for non-critical operations
- **Efficient Rendering**: Three.js scene optimizations for smooth 60 FPS
- **Responsive Throttling**: Adaptive rendering based on device capabilities

## Credits

- **Data Source**: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)
- **3D Graphics**: [Three.js](https://threejs.org/)
- **Frontend Framework**: [React](https://react.dev/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)

## License

MIT
