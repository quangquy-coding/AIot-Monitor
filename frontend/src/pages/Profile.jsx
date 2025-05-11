"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import { User, Key, Save, BookOpen } from "lucide-react"

const Profile = () => {
  const { user, updatePassword } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Add this state at the top of the component with other state variables
  const [assignedProfiles, setAssignedProfiles] = useState([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)

  // Profile form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value,
    })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()

    try {
      const response = await api.put(`/users/${user.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      })

      toast.success("Profile updated successfully")
      setIsEditing(false)

      // Update user context
      // Note: In a real app, you might want to refresh the user data from the server
      // or update the context with the new data
    } catch (error) {
      console.error("Update profile error:", error)
      toast.error(error.response?.data?.message || "Failed to update profile")
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      const result = await updatePassword(passwordData.currentPassword, passwordData.newPassword)

      if (result.success) {
        toast.success(result.message || "Password updated successfully")
        setShowPasswordForm(false)
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        toast.error(result.message || "Failed to update password")
      }
    } catch (error) {
      console.error("Update password error:", error)
      toast.error("Failed to update password")
    }
  }

  // Add this useEffect to fetch assigned profiles
  useEffect(() => {
    const fetchAssignedProfiles = async () => {
      if (user && user.role === "operator") {
        try {
          setLoadingProfiles(true)
          const response = await api.get(`/profiles/operator/${user.id}`)
          setAssignedProfiles(response.data)
        } catch (error) {
          console.error("Error fetching assigned profiles:", error)
          toast.error("Failed to fetch assigned profiles")
        } finally {
          setLoadingProfiles(false)
        }
      }
    }

    fetchAssignedProfiles()
  }, [user])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={40} className="text-gray-500" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm bg-blue-100 text-blue-800 rounded-full px-2 py-1 inline-block mt-2 capitalize">
                {user?.role.replace("_", " ")}
              </p>
            </div>
          </div>

          {!isEditing ? (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium">{user?.username}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium">{user?.firstName || "Not set"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium">{user?.lastName || "Not set"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex justify-between border-t pt-4">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <User size={18} className="mr-2" />
                Edit Profile
              </button>
            )}

            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Key size={18} className="mr-2" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      {showPasswordForm && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>

            <form onSubmit={handleUpdatePassword}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {user?.role === "operator" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">My Assigned Profiles</h2>

            {loadingProfiles ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : assignedProfiles.length > 0 ? (
              <div className="space-y-4">
                {assignedProfiles.map((profile) => (
                  <div key={profile._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{profile.name}</h3>
                        <p className="text-sm text-gray-500">{profile.description || "No description"}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Device Group:</p>
                        <p className="font-medium">
                          {typeof profile.deviceGroup === "object" ? profile.deviceGroup.name : "Loading..."}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Command List:</p>
                        <p className="font-medium">
                          {typeof profile.commandList === "object" ? profile.commandList.name : "Loading..."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <BookOpen size={40} className="mx-auto text-gray-400 mb-2" />
                <h3 className="text-gray-800 font-medium mb-1">No Profiles Assigned</h3>
                <p className="text-gray-500 text-sm">
                  You don't have any operational profiles assigned to you yet. Contact your team lead or administrator
                  to get access.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
