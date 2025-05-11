"use client"

import { createContext, useContext, useState, useCallback } from "react"
import api from "../utils/api"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Login
  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password })
      const { token, user } = response.data

      // Save token to localStorage
      localStorage.setItem("token", token)

      // Set auth state
      setUser(user)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  // Logout
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token")

    // Reset auth state
    setUser(null)
    setIsAuthenticated(false)
  }

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        setLoading(false)
        return
      }

      // Get current user
      const response = await api.get("/auth/me")

      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Auth check error:", error)
      localStorage.removeItem("token")
    } finally {
      setLoading(false)
    }
  }, [])

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put("/auth/update-password", {
        currentPassword,
        newPassword,
      })
      return { success: true, message: response.data.message }
    } catch (error) {
      console.error("Update password error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update password",
      }
    }
  }

  // Reset user password (admin only)
  const resetUserPassword = async (userId, newPassword) => {
    try {
      const response = await api.post("/auth/reset-password", {
        userId,
        newPassword,
      })
      return { success: true, message: response.data.message }
    } catch (error) {
      console.error("Reset password error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reset password",
      }
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
    updatePassword,
    resetUserPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
