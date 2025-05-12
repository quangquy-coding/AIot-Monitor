"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import {
  Cpu,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Network,
  Terminal,
  RefreshCw,
  ExternalLink,
  X,
  Play,
  Square,
  RotateCw,
  FileText,
  BarChart3,
  Send,
  DockIcon as Docker,
} from "lucide-react"

const Devices = () => {
  const { user } = useAuth()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSSHModal, setShowSSHModal] = useState(false)
  const [showDockerModal, setShowDockerModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [showCommandModal, setShowCommandModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dockerStats, setDockerStats] = useState(null)
  const [dockerLogs, setDockerLogs] = useState("")
  const [commandOutput, setCommandOutput] = useState("")
  const [command, setCommand] = useState("")
  const [commandLoading, setCommandLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    ipAddress: "",
    sshPort: 22,
    sshUsername: "",
    sshPassword: "",
    status: "offline",
    isDocker: false,
    dockerId: "",
  })

  useEffect(() => {
    fetchDevices()
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
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

  const handleTestSSH = async () => {
    if (!selectedDevice) return

    try {
      const response = await api.post(`/devices/${selectedDevice._id}/test-ssh`)
      if (response.data.success) {
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error("Error testing SSH connection:", error)
      toast.error("Failed to test SSH connection")
    }
  }

  const handleDockerAction = async (action) => {
    if (!selectedDevice) return

    try {
      const response = await api.post(`/devices/${selectedDevice._id}/docker-action`, { action })
      toast.success(response.data.message)

      // Update device status in the list
      setDevices(
        devices.map((device) =>
          device._id === selectedDevice._id ? { ...device, status: response.data.status } : device,
        ),
      )

      // Update selected device
      setSelectedDevice({
        ...selectedDevice,
        status: response.data.status,
      })
    } catch (error) {
      console.error(`Error ${action} Docker container:`, error)
      toast.error(error.response?.data?.message || `Failed to ${action} Docker container`)
    }
  }

  const fetchDockerStats = async () => {
    if (!selectedDevice) return

    try {
      const response = await api.get(`/devices/${selectedDevice._id}/docker-stats`)
      setDockerStats(response.data.stats)
    } catch (error) {
      console.error("Error fetching Docker stats:", error)
      toast.error(error.response?.data?.message || "Failed to fetch Docker stats")
    }
  }

  const fetchDockerLogs = async () => {
    if (!selectedDevice) return

    try {
      const response = await api.get(`/devices/${selectedDevice._id}/docker-logs`)
      setDockerLogs(response.data.logs)
    } catch (error) {
      console.error("Error fetching Docker logs:", error)
      toast.error(error.response?.data?.message || "Failed to fetch Docker logs")
    }
  }

  const executeCommand = async () => {
    if (!selectedDevice || !command.trim()) return

    setCommandLoading(true)
    try {
      const response = await api.post(`/devices/${selectedDevice._id}/execute-command`, { command })
      setCommandOutput(response.data.output || response.data.error || "Command executed successfully with no output")
      toast.success("Command executed successfully")
    } catch (error) {
      console.error("Error executing command:", error)
      setCommandOutput(error.response?.data?.stderr || error.response?.data?.error || "Failed to execute command")
      toast.error(error.response?.data?.message || "Failed to execute command")
    } finally {
      setCommandLoading(false)
    }
  }

  const openEditModal = (device) => {
    setSelectedDevice(device)
    setFormData({
      name: device.name,
      type: device.type,
      ipAddress: device.ipAddress || "",
      sshPort: device.sshPort || 22,
      sshUsername: device.sshUsername || "",
      sshPassword: device.sshPassword || "",
      status: device.status || "offline",
      isDocker: device.isDocker || false,
      dockerId: device.dockerId || "",
    })
    setShowEditModal(true)
  }

  const openSSHModal = (device) => {
    setSelectedDevice(device)
    setShowSSHModal(true)
  }

  const openDockerModal = (device) => {
    setSelectedDevice(device)
    setDockerStats(null)
    fetchDockerStats()
    setShowDockerModal(true)
  }

  const openLogsModal = (device) => {
    setSelectedDevice(device)
    setDockerLogs("")
    fetchDockerLogs()
    setShowLogsModal(true)
  }

  const openCommandModal = (device) => {
    setSelectedDevice(device)
    setCommand("")
    setCommandOutput("")
    setShowCommandModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      ipAddress: "",
      sshPort: 22,
      sshUsername: "",
      sshPassword: "",
      status: "offline",
      isDocker: false,
      dockerId: "",
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

  const getDeviceIcon = (device) => {
    if (device.isDocker) {
      return <Docker size={24} className="text-blue-500" />
    }

    switch (device.type.toLowerCase()) {
      case "router":
      case "switch":
      case "gateway":
        return <Network size={24} className="text-indigo-500" />
      default:
        return <Cpu size={24} className="text-gray-500" />
    }
  }

  const filteredDevices = devices.filter((device) => {
    // Search term filter
    return (
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.ipAddress && device.ipAddress.includes(searchTerm)) ||
      (device.dockerId && device.dockerId.includes(searchTerm))
    )
  })

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
                <div className="flex items-center">
                  {getDeviceIcon(device)}
                  <div className="ml-3">
                    <h2 className="text-lg font-semibold text-gray-800">{device.name}</h2>
                    <p className="text-sm text-gray-500 capitalize">{device.type}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(device.status)}
                  <span className="ml-2 text-sm capitalize">{device.status}</span>
                </div>
              </div>
              {device.isDocker && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Docker
                  </span>
                  {device.dockerId && (
                    <span className="ml-2 text-xs text-gray-500">ID: {device.dockerId.substring(0, 12)}</span>
                  )}
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">IP Address</p>
                  <p className="font-medium">{device.ipAddress}</p>
                </div>

                <div>
                  <p className="text-gray-500">SSH Port</p>
                  <p className="font-medium">{device.sshPort || 22}</p>
                </div>

                <div>
                  <p className="text-gray-500">SSH Username</p>
                  <p className="font-medium">{device.sshUsername || "N/A"}</p>
                </div>

                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {device.updatedAt ? new Date(device.updatedAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div className="flex space-x-2">
                {device.sshUsername && (
                  <button
                    onClick={() => openSSHModal(device)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
                  >
                    <Terminal size={16} className="mr-1" />
                    SSH
                  </button>
                )}

                {device.isDocker && (
                  <>
                    <button
                      onClick={() => openDockerModal(device)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                    >
                      <Docker size={16} className="mr-1" />
                      Docker
                    </button>

                    <button
                      onClick={() => openLogsModal(device)}
                      className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
                    >
                      <FileText size={16} className="mr-1" />
                      Logs
                    </button>
                  </>
                )}

                <button
                  onClick={() => openCommandModal(device)}
                  className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center"
                >
                  <Send size={16} className="mr-1" />
                  Command
                </button>
              </div>

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
                        {/* Docker Toggle */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDocker"
                            name="isDocker"
                            checked={formData.isDocker}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isDocker" className="ml-2 block text-sm text-gray-900">
                            This is a Docker container
                          </label>
                        </div>

                        {/* Basic Information */}
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
                            placeholder="e.g., router, switch, server"
                          />
                        </div>

                        {/* Network Information */}
                        <div>
                          <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">
                            IP Address *
                          </label>
                          <input
                            type="text"
                            id="ipAddress"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        {/* SSH Information */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">SSH Access</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="sshPort" className="block text-xs text-gray-500 mb-1">
                                Port
                              </label>
                              <input
                                type="number"
                                id="sshPort"
                                name="sshPort"
                                value={formData.sshPort}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="sshUsername" className="block text-xs text-gray-500 mb-1">
                                Username
                              </label>
                              <input
                                type="text"
                                id="sshUsername"
                                name="sshUsername"
                                value={formData.sshUsername}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="sshPassword" className="block text-xs text-gray-500 mb-1">
                                Password
                              </label>
                              <input
                                type="password"
                                id="sshPassword"
                                name="sshPassword"
                                value={formData.sshPassword}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Docker Information */}
                        {formData.isDocker && (
                          <div>
                            <label htmlFor="dockerId" className="block text-sm font-medium text-gray-700 mb-1">
                              Docker Container ID/Name *
                            </label>
                            <input
                              type="text"
                              id="dockerId"
                              name="dockerId"
                              value={formData.dockerId}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required={formData.isDocker}
                              placeholder="e.g., aiot-core-router-01 or container ID"
                            />
                          </div>
                        )}

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
                        {/* Docker Toggle */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDocker"
                            name="isDocker"
                            checked={formData.isDocker}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isDocker" className="ml-2 block text-sm text-gray-900">
                            This is a Docker container
                          </label>
                        </div>

                        {/* Basic Information */}
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

                        {/* Network Information */}
                        <div>
                          <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">
                            IP Address *
                          </label>
                          <input
                            type="text"
                            id="ipAddress"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        {/* SSH Information */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">SSH Access</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="sshPort" className="block text-xs text-gray-500 mb-1">
                                Port
                              </label>
                              <input
                                type="number"
                                id="sshPort"
                                name="sshPort"
                                value={formData.sshPort}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="sshUsername" className="block text-xs text-gray-500 mb-1">
                                Username
                              </label>
                              <input
                                type="text"
                                id="sshUsername"
                                name="sshUsername"
                                value={formData.sshUsername}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label htmlFor="sshPassword" className="block text-xs text-gray-500 mb-1">
                                Password
                              </label>
                              <input
                                type="password"
                                id="sshPassword"
                                name="sshPassword"
                                value={formData.sshPassword}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Docker Information */}
                        {formData.isDocker && (
                          <div>
                            <label htmlFor="dockerId" className="block text-sm font-medium text-gray-700 mb-1">
                              Docker Container ID/Name *
                            </label>
                            <input
                              type="text"
                              id="dockerId"
                              name="dockerId"
                              value={formData.dockerId}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required={formData.isDocker}
                            />
                          </div>
                        )}
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

      {/* SSH Modal */}
      {showSSHModal && selectedDevice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gray-900 px-4 py-3 sm:px-6 flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-white">SSH Connection - {selectedDevice.name}</h3>
                <button onClick={() => setShowSSHModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-gray-800 p-6 text-white">
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Host</p>
                      <p className="font-mono">{selectedDevice.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Port</p>
                      <p className="font-mono">{selectedDevice.sshPort || 22}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Username</p>
                      <p className="font-mono">{selectedDevice.sshUsername}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Password</p>
                      <p className="font-mono">••••••••</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-black rounded-md p-4 font-mono text-sm h-48 overflow-auto">
                  <p className="text-green-500">
                    $ ssh {selectedDevice.sshUsername}@{selectedDevice.ipAddress} -p {selectedDevice.sshPort || 22}
                  </p>
                  <p className="text-gray-400 mt-2">Connecting to {selectedDevice.name}...</p>
                  <p className="text-yellow-500 mt-1">
                    The authenticity of host '{selectedDevice.ipAddress}' can't be established.
                  </p>
                  <p className="text-yellow-500">ECDSA key fingerprint is SHA256:uNiS8Jzf5/UJ/hHvmZFQEVV8OTd6V.</p>
                  <p className="text-yellow-500">Are you sure you want to continue connecting (yes/no)? yes</p>
                  <p className="text-gray-400 mt-1">
                    Warning: Permanently added '{selectedDevice.ipAddress}' (ECDSA) to the list of known hosts.
                  </p>
                  <p className="text-gray-400 mt-1">
                    {selectedDevice.sshUsername}@{selectedDevice.ipAddress}'s password:{" "}
                  </p>
                  <p className="text-gray-400 mt-1">Last login: Sat May 11 18:30:22 2025 from 192.168.1.100</p>
                  <p className="text-green-500 mt-1">
                    {selectedDevice.sshUsername}@{selectedDevice.name}:~$ _
                  </p>
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleTestSSH}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Test Connection
                  </button>

                  <a
                    href={`ssh://${selectedDevice.sshUsername}@${selectedDevice.ipAddress}:${selectedDevice.sshPort || 22}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Open in Terminal
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Docker Modal */}
      {showDockerModal && selectedDevice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-blue-600 px-4 py-3 sm:px-6 flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-white">Docker Container - {selectedDevice.name}</h3>
                <button onClick={() => setShowDockerModal(false)} className="text-white hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-white p-6">
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Container ID</p>
                      <p className="font-mono">{selectedDevice.dockerId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium capitalize">{selectedDevice.status}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium flex items-center">
                      <BarChart3 size={18} className="mr-2 text-blue-500" />
                      Container Stats
                    </h4>
                    <button
                      onClick={fetchDockerStats}
                      className="text-blue-600 hover:text-blue-800"
                      title="Refresh Stats"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  {dockerStats ? (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-gray-500 mb-1">CPU Usage</p>
                        <p className="font-medium">{dockerStats.cpuUsage}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-gray-500 mb-1">Memory</p>
                        <p className="font-medium">{dockerStats.memoryUsage}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-gray-500 mb-1">Network I/O</p>
                        <p className="font-medium">{dockerStats.networkIO}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>Click refresh to load container stats</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => handleDockerAction("start")}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Play size={16} className="mr-1" />
                    Start
                  </button>

                  <button
                    onClick={() => handleDockerAction("stop")}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Square size={16} className="mr-1" />
                    Stop
                  </button>

                  <button
                    onClick={() => handleDockerAction("restart")}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <RotateCw size={16} className="mr-1" />
                    Restart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && selectedDevice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-green-600 px-4 py-3 sm:px-6 flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-white">Container Logs - {selectedDevice.name}</h3>
                <button onClick={() => setShowLogsModal(false)} className="text-white hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium flex items-center">
                    <FileText size={18} className="mr-2 text-green-500" />
                    Container Logs
                  </h4>
                  <button
                    onClick={fetchDockerLogs}
                    className="text-green-600 hover:text-green-800"
                    title="Refresh Logs"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div className="bg-gray-900 rounded-md p-4 font-mono text-sm text-gray-300 h-96 overflow-auto">
                  {dockerLogs ? (
                    <pre>{dockerLogs}</pre>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>Click refresh to load container logs</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Modal */}
      {showCommandModal && selectedDevice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-purple-600 px-4 py-3 sm:px-6 flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-white">Execute Command - {selectedDevice.name}</h3>
                <button onClick={() => setShowCommandModal(false)} className="text-white hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-white p-6">
                <div className="mb-4">
                  <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-2">
                    Command
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="command"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter command to execute (e.g., ls -la)"
                    />
                    <button
                      onClick={executeCommand}
                      disabled={commandLoading || !command.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {commandLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
                  <div className="bg-gray-900 rounded-md p-4 font-mono text-sm text-gray-300 h-64 overflow-auto">
                    {commandOutput ? (
                      <pre>{commandOutput}</pre>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>Execute a command to see output</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Devices
