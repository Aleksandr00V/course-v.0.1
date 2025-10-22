import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import VehiclesPage from './pages/VehiclesPage'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/main.scss'

import DriversPage from './pages/DriversPage'
import CabinetPage from './pages/CabinetPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import UsersPage from './pages/UsersPage'
import RegistrationsPage from './pages/RegistrationsPage'
import RegisterPage from './pages/RegisterPage'
import DriverDetailsPage from './pages/DriverDetailsPage'
import VehicleDetailsPage from './pages/VehicleDetailsPage'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/vehicles', element: <VehiclesPage /> },
  { path: '/drivers', element: <DriversPage /> },
  { path: '/drivers/:id', element: <DriverDetailsPage /> },
  { path: '/cabinet', element: <CabinetPage /> },
  { path: '/users', element: <UsersPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/registrations', element: <RegistrationsPage /> },
  { path: '/vehicles/:id', element: <VehicleDetailsPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
