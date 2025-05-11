"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import { Key, AlertTriangle } from 'lucide-react'

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error("Please enter both username and password")
      return
    }

    setLoading(true)

    try {
      const result = await login(username, password)

      if (result.success) {
        toast.success("Login successful")
        navigate("/dashboard")
      } else {
        toast.error(result.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleResetAdminPassword = async () => {
    if (!confirm("Are you sure you want to reset the admin password to default (admin123)?")) {
      return
    }

    setResetLoading(true)

    try {
      const response = await api.post("/auth/reset-admin-password")
      toast.success(response.data.message || "Admin password reset successfully")
      setUsername("admin")
      setPassword("admin123")
    } catch (error) {
      console.error("Reset admin password error:", error)
      toast.error(error.response?.data?.message || "Failed to reset admin password")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">AIoT Monitor</h1>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 border-t pt-4">
        <div className="flex flex-col items-center">
          <button
            onClick={handleResetAdminPassword}
            disabled={resetLoading}
            className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            {resetLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
              </span>
            ) : (
              <>
                <Key size={16} className="mr-1" />
                Reset Admin Password
              </>
            )}
          </button>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <AlertTriangle size={14} className="mr-1 text-yellow-500" />
            This will reset the admin password to the default (admin123)
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Default admin credentials:</p>
        <p>Username: admin</p>
        <p>Password: admin123</p>
      </div>
    </div>
  )
}

export default Login

