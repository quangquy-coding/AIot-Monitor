"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import { Layers, Plus, Edit, Trash2, Search, Info } from "lucide-react"

const DeviceGroups = () => {
  const { user } = useAuth()
  const [deviceGroups, setDeviceGroups] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDeviceGroup, setSelectedDeviceGroup] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    devices: [],
  })

  useEffect(() => {
    fetchDeviceGroups()
    fetchDevices()
  }, [])

  const fetchDeviceGroups = async () => {
    try {
      setLoading(true)
      const response = await api.get("/device-groups")
      setDeviceGroups(response.data)
    } catch (error) {
      console.error("Error fetching device groups:", error)
      toast.error("Failed to fetch device groups")
    } finally {
      setLoading(false)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await api.get("/devices")
      setDevices(response.data)
    } catch (error) {
      console.error("Error fetching devices:", error)
      toast.error("Failed to fetch devices")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleDeviceSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
    setFormData({
      ...formData,
      devices: selectedOptions,
    })
  }

  const handleAddDeviceGroup = async (e) => {
    e.preventDefault()

    try {
      const response = await api.post("/device-groups", formData)
      toast.success("Device group created successfully")
      setDeviceGroups([...deviceGroups, response.data.deviceGroup])
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error("Error creating device group:", error)
      toast.error(error.response?.data?.message || "Failed to create device group")
    }
  }

  const handleEditDeviceGroup = async (e) => {
    e.preventDefault()

    try {
      const response = await api.put(`/device-groups/${selectedDeviceGroup._id}`, formData)
      toast.success("Device group updated successfully")

      // Update device groups list
      setDeviceGroups(
        deviceGroups.map((group) => (group._id === selectedDeviceGroup._id ? response.data.deviceGroup : group)),
      )

      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating device group:", error)
      toast.error(error.response?.data?.message || "Failed to update device group")
    }
  }

  const handleDeleteDeviceGroup = async (groupId) => {
    if (!confirm("Are you sure you want to delete this device group?")) {
      return
    }

    try {
      await api.delete(`/device-groups/${groupId}`)
      toast.success("Device group deleted successfully")
      setDeviceGroups(deviceGroups.filter((group) => group._id !== groupId))
    } catch (error) {
      console.error("Error deleting device group:", error)
      toast.error(error.response?.data?.message || "Failed to delete device group")
    }
  }

  const openEditModal = (deviceGroup) => {
    setSelectedDeviceGroup(deviceGroup)
    setFormData({
      name: deviceGroup.name,
      description: deviceGroup.description || "",
      devices: deviceGroup.devices.map((device) => (typeof device === "object" ? device._id : device)),
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      devices: [],
    })
  }

  const filteredDeviceGroups = deviceGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())),
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
        <h1 className="text-2xl font-bold text-gray-800">Device Groups</h1>

        {["admin", "team_lead"].includes(user.role) && (
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Device Group
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
            placeholder="Search device groups..."
          />
        </div>
      </div>

      {/* Device Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeviceGroups.map((group) => (
          <div key={group._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{group.name}</h2>
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {group.devices.length} devices
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{group.description || "No description"}</p>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Devices:</h3>
              <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                {group.devices.length > 0 ? (
                  group.devices.map((device) => (
                    <li key={typeof device === "object" ? device._id : device} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {typeof device === "object" ? device.name : "Loading..."}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No devices in this group</li>
                )}
              </ul>
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
                <Info size={16} className="mr-1" />
                View Details
              </button>

              {["admin", "team_lead"].includes(user.role) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(group)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Device Group"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleDeleteDeviceGroup(group._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Device Group"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredDeviceGroups.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
            <Layers size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No device groups found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Try a different search term"
                : "First create devices in the Devices section, then add them to device groups here"}
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Device creation flow:</p>
              <ol className="mt-2 text-sm text-gray-500 list-decimal list-inside">
                <li>Create hubs in the Hubs section</li>
                <li>Create devices and assign them to hubs in the Devices section</li>
                <li>Create device groups and add devices to them here</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Add Device Group Modal */}
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Device Group</h3>

                    <form onSubmit={handleAddDeviceGroup}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Group Name *
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
                          <label htmlFor="devices" className="block text-sm font-medium text-gray-700 mb-1">
                            Devices
                          </label>
                          <select
                            id="devices"
                            name="devices"
                            multiple
                            value={formData.devices}
                            onChange={handleDeviceSelection}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            size="5"
                          >
                            {devices.map((device) => (
                              <option key={device._id} value={device._id}>
                                {device.name} ({device.type})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple devices</p>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddDeviceGroup}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Device Group
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

      {/* Edit Device Group Modal */}
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Device Group</h3>

                    <form onSubmit={handleEditDeviceGroup}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Group Name *
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
                          <label htmlFor="devices" className="block text-sm font-medium text-gray-700 mb-1">
                            Devices
                          </label>
                          <select
                            id="devices"
                            name="devices"
                            multiple
                            value={formData.devices}
                            onChange={handleDeviceSelection}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            size="5"
                          >
                            {devices.map((device) => (
                              <option key={device._id} value={device._id}>
                                {device.name} ({device.type})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple devices</p>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleEditDeviceGroup}
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
    </div>
  )
}

export default DeviceGroups
