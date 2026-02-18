# Admin Panel for Location Tracking System

This is the admin web panel for the location tracking application built with React, TypeScript, and Material-UI.

## Features

- Secure admin login with role validation
- User management (view, edit users)
- Individual and bulk location tracking
- Map visualization of user locations
- Responsive design for all device sizes

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Navigate to the admin panel directory:
   ```bash
   cd KonumTakip_WEB/admin-panel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

## Building for Production

```bash
npm run build
```

## Project Structure

```
src/
  ├── Sayfalar/          # Page components
  │   ├── DashboardPage.jsx
  │   ├── LoginPage.jsx
  │   ├── MapPage.jsx
  │   ├── TrackingPage.jsx
  │   └── UserProfilePage.jsx
  ├── main.tsx           # Application entry point
  └── style.css          # Global styles
```

## Dependencies

- React
- React Router DOM
- Material-UI
- TypeScript

## Development

To start the development server with hot reloading:
```bash
npm run dev
```

