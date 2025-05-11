"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import { Cpu, Plus, Edit, Trash2, Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

const Devices = () => {
  const { user } = useAuth()
  const [devices, setDevices] = useState([])
  const [hubs, setHubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    model: "",
    serialNumber: "",
    hub: "",
    ipAddress: "",
    macAddress: "",
    firmware: {
      version: "",
      lastUpdated: null,
    },
  })

  useEffect(() => {
    fetchDevices()
    fetchHubs()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await api.get("/devices")
      setDevices(response.data)
    } catch (error) {
      console.error("Error fetching devices:", error)
      toast.error("Failed to fetch devices")
    } finally {
      setLoading(false)
    }
  }

  const fetchHubs = async () => {
    try {
      const response = await api.get("/hubs")
      setHubs(response.data)
    } catch (error) {
      console.error("Error fetching hubs:", error)
      toast.error("Failed to fetch hubs")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name.startsWith("firmware.")) {
      const firmwareField = name.split(".")[1]
      setFormData({
        ...formData,
        firmware: {
          ...formData.firmware,
          [firmwareField]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleAddDevice = async (e) => {
    e.preventDefault()

    try {
      const response = await api.post("/devices", formData)
      toast.success("Device created successfully")
      setDevices([...devices, response.data.device])
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error("Error creating device:", error)
      toast.error(error.response?.data?.message || "Failed to create device")
    }
  }

  const handleEditDevice = async (e) => {
    e.preventDefault()

    try {
      const response = await api.put(`/devices/${selectedDevice._id}`, formData)
      toast.success("Device updated successfully")

      // Update devices list
      setDevices(devices.map((device) => (device._id === selectedDevice._id ? response.data.device : device)))

      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating device:", error)
      toast.error(error.response?.data?.message || "Failed to update device")
    }
  }

  const handleDeleteDevice = async (deviceId) => {
    if (!confirm("Are you sure you want to delete this device?")) {
      return
    }

    try {
      await api.delete(`/devices/${deviceId}`)
      toast.success("Device deleted successfully")
      setDevices(devices.filter((device) => device._id !== deviceId))
    } catch (error) {
      console.error("Error deleting device:", error)
      toast.error(error.response?.data?.message || "Failed to delete device")
    }
  }

  const openEditModal = (device) => {
    setSelectedDevice(device)
    setFormData({
      name: device.name,
      type: device.type,
      model: device.model || "",
      serialNumber: device.serialNumber || "",
      hub: device.hub._id || device.hub,
      status: device.status,
      ipAddress: device.ipAddress || "",
      macAddress: device.macAddress || "",
      firmware: {
        version: device.firmware?.version || "",
        lastUpdated: device.firmware?.lastUpdated || null,
      },
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      model: "",
      serialNumber: "",
      hub: "",
      ipAddress: "",
      macAddress: "",
      firmware: {
        version: "",
        lastUpdated: null,
      },
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "online":
        return <CheckCircle size={18} className="text-green-500" />
      case "offline":
        return <XCircle size={18} className="text-gray-500" />
      case "error":
        return <XCircle size={18} className="text-red-500" />
      case "maintenance":
        return <AlertTriangle size={18} className="text-yellow-500" />
      default:
        return <XCircle size={18} className="text-gray-500" />
    }
  }

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.model && device.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.serialNumber && device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.ipAddress && device.ipAddress.includes(searchTerm)),
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
        <h1 className="text-2xl font-bold text-gray-800">Devices</h1>

        {["admin", "team_lead", "supervisor"].includes(user.role) && (
          <button
            onClick={() => {
              if (hubs.length === 0) {
                toast.error("You need to create at least one hub before adding devices")
                return
              }
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Device
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
            placeholder="Search devices..."
          />
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <div key={device._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{device.name}</h2>
                <div className="flex items-center">
                  {getStatusIcon(device.status)}
                  <span className="ml-2 text-sm capitalize">{device.status}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1 capitalize">{device.type}</p>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Hub</p>
                  <p className="font-medium">{typeof device.hub === "object" ? device.hub.name : "Loading..."}</p>
                </div>

                <div>
                  <p className="text-gray-500">Model</p>
                  <p className="font-medium">{device.model || "N/A"}</p>
                </div>

                <div>
                  <p className="text-gray-500">IP Address</p>
                  <p className="font-medium">{device.ipAddress || "N/A"}</p>
                </div>

                <div>
                  <p className="text-gray-500">Serial Number</p>
                  <p className="font-medium">{device.serialNumber || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <Link to={`/devices/${device._id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View Details
              </Link>

              {["admin", "team_lead", "supervisor"].includes(user.role) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(device)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Device"
                  >
                    <Edit size={18} />
                  </button>

                  {["admin", "team_lead"].includes(user.role) && (
                    <button
                      onClick={() => handleDeleteDevice(device._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Device"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredDevices.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
            <Cpu size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No devices found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try a different search term" : "Add your first device to get started"}
            </p>
            {hubs.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-700">
                  <AlertTriangle size={16} className="inline mr-1" />
                  You need to create at least one hub before adding devices
                </p>
                <Link to="/hubs" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
                  Go to Hubs →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Device Modal */}
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Device</h3>

                    <form onSubmit={handleAddDevice}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Device Name *
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

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                              Device Type *
                            </label>
                            <input
                              type="text"
                              id="type"
                              name="type"
                              value={formData.type}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                              placeholder="e.g., sensor, camera, switch"
                            />
                          </div>

                          <div>
                            <label htmlFor="hub" className="block text-sm font-medium text-gray-700 mb-1">
                              Hub *
                            </label>
                            <select
                              id="hub"
                              name="hub"
                              value={formData.hub}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select a hub</option>
                              {hubs.map((hub) => (
                                <option key={hub._id} value={hub._id}>
                                  {hub.name} ({hub.type})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                              Model
                            </label>
                            <input
                              type="text"
                              id="model"
                              name="model"
                              value={formData.model}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Serial Number
                            </label>
                            <input
                              type="text"
                              id="serialNumber"
                              name="serialNumber"
                              value={formData.serialNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              IP Address
                            </label>
                            <input
                              type="text"
                              id="ipAddress"
                              name="ipAddress"
                              value={formData.ipAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              MAC Address
                            </label>
                            <input
                              type="text"
                              id="macAddress"
                              name="macAddress"
                              value={formData.macAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="firmware.version" className="block text-sm font-medium text-gray-700 mb-1">
                            Firmware Version
                          </label>
                          <input
                            type="text"
                            id="firmware.version"
                            name="firmware.version"
                            value={formData.firmware.version}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddDevice}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Device
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

      {/* Edit Device Modal */}
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Device</h3>

                    <form onSubmit={handleEditDevice}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Device Name *
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

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                              Device Type *
                            </label>
                            <input
                              type="text"
                              id="type"
                              name="type"
                              value={formData.type}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              id="status"
                              name="status"
                              value={formData.status}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="online">Online</option>
                              <option value="offline">Offline</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="error">Error</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="hub" className="block text-sm font-medium text-gray-700 mb-1">
                            Hub *
                          </label>
                          <select
                            id="hub"
                            name="hub"
                            value={formData.hub}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a hub</option>
                            {hubs.map((hub) => (
                              <option key={hub._id} value={hub._id}>
                                {hub.name} ({hub.type})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                              Model
                            </label>
                            <input
                              type="text"
                              id="model"
                              name="model"
                              value={formData.model}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Serial Number
                            </label>
                            <input
                              type="text"
                              id="serialNumber"
                              name="serialNumber"
                              value={formData.serialNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              IP Address
                            </label>
                            <input
                              type="text"
                              id="ipAddress"
                              name="ipAddress"
                              value={formData.ipAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              MAC Address
                            </label>
                            <input
                              type="text"
                              id="macAddress"
                              name="macAddress"
                              value={formData.macAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="firmware.version" className="block text-sm font-medium text-gray-700 mb-1">
                            Firmware Version
                          </label>
                          <input
                            type="text"
                            id="firmware.version"
                            name="firmware.version"
                            value={formData.firmware.version}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleEditDevice}
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

export default Devices
