"use client"

import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import { Toaster } from "react-hot-toast"

// Layouts
import DashboardLayout from "./layouts/DashboardLayout"
import AuthLayout from "./layouts/AuthLayout"

// Pages
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Devices from "./pages/Devices"
import Users from "./pages/Users"
import Profile from "./pages/Profile"
import DeviceGroups from "./pages/DeviceGroups"
import CommandLists from "./pages/CommandLists"
import Profiles from "./pages/Profiles"

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { checkAuth } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
        </Route>

        {/* Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={["admin", "team_lead"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="device-groups"
            element={
              <ProtectedRoute allowedRoles={["admin", "team_lead", "supervisor"]}>
                <DeviceGroups />
              </ProtectedRoute>
            }
          />
          <Route
            path="command-lists"
            element={
              <ProtectedRoute allowedRoles={["admin", "team_lead", "supervisor"]}>
                <CommandLists />
              </ProtectedRoute>
            }
          />
          <Route
            path="profiles"
            element={
              <ProtectedRoute allowedRoles={["admin", "team_lead", "supervisor"]}>
                <Profiles />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster position="top-right" />
    </>
  )
}

export default App
