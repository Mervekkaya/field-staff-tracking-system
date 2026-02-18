import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LoginPage from './Sayfalar/LoginPage'
import DashboardPage from './Sayfalar/DashboardPage'
import MapPage from './Sayfalar/MapPage'
import TrackingPage from './Sayfalar/TrackingPage'
import UserProfilePage from './Sayfalar/UserProfilePage'
import './style.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/map",
    element: <MapPage />,
  },
  {
    path: "/tracking/:userId",
    element: <TrackingPage />,
  },
  {
    path: "/user/:userId",
    element: <UserProfilePage />,
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)