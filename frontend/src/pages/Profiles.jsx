

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import { BookOpen, Plus, Edit, Trash2, Search, Info, Layers, Terminal, UserPlus, UserX } from "lucide-react"

const Profiles = () => {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [deviceGroups, setDeviceGroups] = useState([])
  const [commandLists, setCommandLists] = useState([])
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deviceGroupId: "",
    commandListId: "",
    operators: [],
  })

  useEffect(() => {
    fetchProfiles()
    fetchDeviceGroups()
    fetchCommandLists()
    fetchOperators()
  }, [])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Error fetching profiles:", error)
      toast.error("Failed to fetch profiles")
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceGroups = async () => {
    try {
      const response = await api.get("/device-groups")
      setDeviceGroups(response.data)
    } catch (error) {
      console.error("Error fetching device groups:", error)
      toast.error("Failed to fetch device groups")
    }
  }

  const fetchCommandLists = async () => {
    try {
      const response = await api.get("/command-lists")
      setCommandLists(response.data)
    } catch (error) {
      console.error("Error fetching command lists:", error)
      toast.error("Failed to fetch command lists")
    }
  }

  const fetchOperators = async () => {
    try {
      const response = await api.get("/users")
      // Filter only operators
      setOperators(response.data.filter((user) => user.role === "operator"))
    } catch (error) {
      console.error("Error fetching operators:", error)
      toast.error("Failed to fetch operators")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleOperatorSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
    setFormData({
      ...formData,
      operators: selectedOptions,
    })
  }

  const handleAddProfile = async (e) => {
    e.preventDefault()

    // Validate form data
    if (!formData.name) {
      toast.error("Profile name is required")
      return
    }

    if (!formData.deviceGroupId) {
      toast.error("Please select a device group")
      return
    }

    if (!formData.commandListId) {
      toast.error("Please select a command list")
      return
    }

    // Check if user has permission
    if (!["admin", "team_lead"].includes(user.role)) {
      toast.error("You don't have permission to create profiles")
      return
    }

    try {
      toast.loading("Creating profile...")

      const response = await api.post("/profiles", {
        name: formData.name,
        description: formData.description,
        deviceGroupId: formData.deviceGroupId,
        commandListId: formData.commandListId,
        operators: formData.operators,
      })

      toast.dismiss()
      toast.success("Profile created successfully")

      // Update profiles list with the new profile
      setProfiles([...profiles, response.data.profile])
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      toast.dismiss()
      console.error("Error creating profile:", error)

      if (error.response?.status === 403) {
        toast.error("You don't have permission to create profiles")
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to create profile. Please try again.")
      }
    }
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()

    try {
      const response = await api.put(`/profiles/${selectedProfile._id}`, {
        name: formData.name,
        description: formData.description,
        deviceGroupId: formData.deviceGroupId,
        commandListId: formData.commandListId,
      })
      toast.success("Profile updated successfully")

      // Update profiles list
      setProfiles(profiles.map((profile) => (profile._id === selectedProfile._id ? response.data.profile : profile)))

      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error.response?.data?.message || "Failed to update profile")
    }
  }

  const handleDeleteProfile = async (profileId) => {
    if (!confirm("Are you sure you want to delete this profile?")) {
      return
    }

    try {
      await api.delete(`/profiles/${profileId}`)
      toast.success("Profile deleted successfully")
      setProfiles(profiles.filter((profile) => profile._id !== profileId))
    } catch (error) {
      console.error("Error deleting profile:", error)
      toast.error(error.response?.data?.message || "Failed to delete profile")
    }
  }

  const handleAssignOperator = async (userId) => {
    try {
      toast.loading(`Assigning operator to ${selectedProfile.name}...`)

      const response = await api.post(`/profiles/${selectedProfile._id}/operators`, {
        userId,
      })

      toast.dismiss()
      toast.success("Operator assigned successfully")

      // Update profiles list with the updated profile
      setProfiles(profiles.map((profile) => (profile._id === selectedProfile._id ? response.data.profile : profile)))

      // Update the selected profile with the new data
      setSelectedProfile(response.data.profile)
    } catch (error) {
      toast.dismiss()
      console.error("Error assigning operator:", error)

      if (error.response?.status === 403) {
        toast.error("You don't have permission to assign operators")
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to assign operator. Please try again.")
      }
    }
  }

  const handleRemoveOperator = async (profileId, userId) => {
    try {
      toast.loading("Removing operator...")

      const response = await api.delete(`/profiles/${profileId}/operators/${userId}`)

      toast.dismiss()
      toast.success("Operator removed successfully")

      // Update profiles list with the updated profile
      setProfiles(profiles.map((profile) => (profile._id === profileId ? response.data.profile : profile)))

      // If we're in the assign modal, update the selected profile
      if (selectedProfile && selectedProfile._id === profileId) {
        setSelectedProfile(response.data.profile)
      }
    } catch (error) {
      toast.dismiss()
      console.error("Error removing operator:", error)

      if (error.response?.status === 403) {
        toast.error("You don't have permission to remove operators")
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to remove operator. Please try again.")
      }
    }
  }

  const openEditModal = (profile) => {
    setSelectedProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || "",
      deviceGroupId: typeof profile.deviceGroup === "object" ? profile.deviceGroup._id : profile.deviceGroup,
      commandListId: typeof profile.commandList === "object" ? profile.commandList._id : profile.commandList,
      operators: profile.operators?.map((op) => (typeof op === "object" ? op._id : op)) || [],
    })
    setShowEditModal(true)
  }

  const openAssignModal = (profile) => {
    setSelectedProfile(profile)
    setShowAssignModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      deviceGroupId: "",
      commandListId: "",
      operators: [],
    })
  }

  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.description && profile.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
  
    <div>
    
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Profiles</h1>

        {["admin", "team_lead"].includes(user.role) && (
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Profile
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search profiles..."
          />
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <div key={profile._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{profile.name}</h2>
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {profile.operators?.length || 0} operators
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{profile.description || "No description"}</p>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Device Group</p>
                  <div className="flex items-center mt-1">
                    <Layers size={16} className="text-gray-400 mr-1" />
                    <p className="text-sm font-medium">
                      {typeof profile.deviceGroup === "object" ? profile.deviceGroup.name : "Loading..."}
                    </p>
                  </div>
                  {typeof profile.deviceGroup === "object" && profile.deviceGroup.devices && (
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.deviceGroup.devices.length} device{profile.deviceGroup.devices.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Command List</p>
                  <div className="flex items-center mt-1">
                    <Terminal size={16} className="text-gray-400 mr-1" />
                    <p className="text-sm font-medium">
                      {typeof profile.commandList === "object" ? profile.commandList.name : "Loading..."}
                    </p>
                  </div>
                  {typeof profile.commandList === "object" && profile.commandList.commands && (
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.commandList.commands.length} command
                      {profile.commandList.commands.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase">Operators</p>
                    {["admin", "team_lead"].includes(user.role) && (
                      <button
                        onClick={() => openAssignModal(profile)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <UserPlus size={14} className="mr-1" />
                        Assign
                      </button>
                    )}
                  </div>
                  <div className="mt-1">
                    {profile.operators && profile.operators.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.operators.map((op) => (
                          <div
                            key={typeof op === "object" ? op._id : op}
                            className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {typeof op === "object" ? op.username : "Loading..."}
                            {["admin", "team_lead"].includes(user.role) && (
                              <button
                                onClick={() => handleRemoveOperator(profile._id, typeof op === "object" ? op._id : op)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                                title="Remove operator"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-500 italic">
                        <UserX size={14} className="mr-1 text-gray-400" />
                        No operators assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
                <Info size={16} className="mr-1" />
                View Details
              </button>

              {["admin", "team_lead"].includes(user.role) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(profile)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Profile"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleDeleteProfile(profile._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Profile"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredProfiles.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No profiles found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try a different search term" : "Add your first profile to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New Operational Profile</h3>

                    <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                      <p>
                        A profile combines a device group with a command list, allowing operators to control specific
                        devices with predefined commands.
                      </p>
                    </div>

                    <form onSubmit={handleAddProfile}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                            placeholder="Enter a descriptive name for this profile"
                          />
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe the purpose of this profile"
                          ></textarea>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Profile Components</h4>

                          <div>
                            <label htmlFor="deviceGroupId" className="block text-sm font-medium text-gray-700 mb-1">
                              1. Select Device Group *
                            </label>
                            <select
                              id="deviceGroupId"
                              name="deviceGroupId"
                              value={formData.deviceGroupId}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">-- Select a device group --</option>
                              {deviceGroups.map((group) => (
                                <option key={group._id} value={group._id}>
                                  {group.name} ({group.devices?.length || 0} devices)
                                </option>
                              ))}
                            </select>
                            {deviceGroups.length === 0 && (
                              <p className="mt-1 text-xs text-red-500">
                                No device groups available. Please create a device group first.
                              </p>
                            )}
                          </div>

                          <div className="mt-3">
                            <label htmlFor="commandListId" className="block text-sm font-medium text-gray-700 mb-1">
                              2. Select Command List *
                            </label>
                            <select
                              id="commandListId"
                              name="commandListId"
                              value={formData.commandListId}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">-- Select a command list --</option>
                              {commandLists.map((list) => (
                                <option key={list._id} value={list._id}>
                                  {list.name} ({list.commands?.length || 0} commands)
                                </option>
                              ))}
                            </select>
                            {commandLists.length === 0 && (
                              <p className="mt-1 text-xs text-red-500">
                                No command lists available. Please create a command list first.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">3. Assign Operators (Optional)</h4>
                            <span className="text-xs text-gray-500">You can also assign operators later</span>
                          </div>
                          <select
                            id="operators"
                            name="operators"
                            multiple
                            value={formData.operators}
                            onChange={handleOperatorSelection}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            size="4"
                          >
                            {operators.map((op) => (
                              <option key={op._id} value={op._id}>
                                {op.username} ({op.firstName} {op.lastName})
                              </option>
                            ))}
                          </select>
                          {operators.length === 0 ? (
                            <p className="mt-1 text-xs text-gray-500">
                              No operators available. Create operator users in the Users section.
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-500">
                              Hold Ctrl (or Cmd) to select multiple operators
                            </p>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddProfile}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={!formData.name || !formData.deviceGroupId || !formData.commandListId}
                >
                  Create Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Profile</h3>

                    <form onSubmit={handleEditProfile}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          ></textarea>
                        </div>

                        <div>
                          <label htmlFor="deviceGroupId" className="block text-sm font-medium text-gray-700 mb-1">
                            Device Group *
                          </label>
                          <select
                            id="deviceGroupId"
                            name="deviceGroupId"
                            value={formData.deviceGroupId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a device group</option>
                            {deviceGroups.map((group) => (
                              <option key={group._id} value={group._id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="commandListId" className="block text-sm font-medium text-gray-700 mb-1">
                            Command List *
                          </label>
                          <select
                            id="commandListId"
                            name="commandListId"
                            value={formData.commandListId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a command list</option>
                            {commandLists.map((list) => (
                              <option key={list._id} value={list._id}>
                                {list.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Operator Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Assign Operators to Profile</h3>

                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                      <h4 className="font-medium text-gray-800">{selectedProfile?.name}</h4>
                      <p className="text-sm text-gray-500">{selectedProfile?.description || "No description"}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Device Group:</span>
                          <p className="font-medium">
                            {typeof selectedProfile?.deviceGroup === "object"
                              ? selectedProfile?.deviceGroup.name
                              : "Loading..."}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Command List:</span>
                          <p className="font-medium">
                            {typeof selectedProfile?.commandList === "object"
                              ? selectedProfile?.commandList.name
                              : "Loading..."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Assigned Operators:</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        {selectedProfile?.operators && selectedProfile.operators.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedProfile.operators.map((op) => (
                              <div
                                key={typeof op === "object" ? op._id : op}
                                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {typeof op === "object" ? op.username : "Loading..."}
                                <button
                                  onClick={() =>
                                    handleRemoveOperator(selectedProfile._id, typeof op === "object" ? op._id : op)
                                  }
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                  title="Remove operator"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No operators currently assigned</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Operators:</h4>
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {operators
                            .filter(
                              (op) =>
                                !selectedProfile?.operators?.some(
                                  (existingOp) =>
                                    (typeof existingOp === "object" ? existingOp._id : existingOp) === op._id,
                                ),
                            )
                            .map((op) => (
                              <li key={op._id} className="p-3 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{op.username}</p>
                                    <p className="text-xs text-gray-500">
                                      {op.firstName} {op.lastName} • {op.email}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAssignOperator(op._id)}
                                    className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Assign
                                  </button>
                                </div>
                              </li>
                            ))}

                          {operators.filter(
                            (op) =>
                              !selectedProfile?.operators?.some(
                                (existingOp) =>
                                  (typeof existingOp === "object" ? existingOp._id : existingOp) === op._id,
                              ),
                          ).length === 0 && (
                            <li className="py-4 text-center text-gray-500">No more operators available to assign</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profiles
