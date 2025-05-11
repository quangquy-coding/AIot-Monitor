"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import { List, Plus, Edit, Trash2, Search, Terminal, Info } from "lucide-react"

const CommandLists = () => {
  const { user } = useAuth()
  const [commandLists, setCommandLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCommandModal, setShowCommandModal] = useState(false)
  const [selectedCommandList, setSelectedCommandList] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    commands: [],
  })

  // Command form state
  const [commandForm, setCommandForm] = useState({
    name: "",
    command: "",
    parameters: "",
    description: "",
  })

  useEffect(() => {
    fetchCommandLists()
  }, [])

  const fetchCommandLists = async () => {
    try {
      setLoading(true)
      const response = await api.get("/command-lists")
      setCommandLists(response.data)
    } catch (error) {
      console.error("Error fetching command lists:", error)
      toast.error("Failed to fetch command lists")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCommandInputChange = (e) => {
    const { name, value } = e.target
    setCommandForm({
      ...commandForm,
      [name]: value,
    })
  }

  const handleAddCommandList = async (e) => {
    e.preventDefault()

    try {
      const response = await api.post("/command-lists", {
        name: formData.name,
        description: formData.description,
        commands: formData.commands,
      })
      toast.success("Command list created successfully")
      setCommandLists([...commandLists, response.data.commandList])
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error("Error creating command list:", error)
      toast.error(error.response?.data?.message || "Failed to create command list")
    }
  }

  const handleEditCommandList = async (e) => {
    e.preventDefault()

    try {
      const response = await api.put(`/command-lists/${selectedCommandList._id}`, {
        name: formData.name,
        description: formData.description,
        commands: formData.commands,
      })
      toast.success("Command list updated successfully")

      // Update command lists
      setCommandLists(
        commandLists.map((list) => (list._id === selectedCommandList._id ? response.data.commandList : list)),
      )

      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating command list:", error)
      toast.error(error.response?.data?.message || "Failed to update command list")
    }
  }

  const handleDeleteCommandList = async (listId) => {
    if (!confirm("Are you sure you want to delete this command list?")) {
      return
    }

    try {
      await api.delete(`/command-lists/${listId}`)
      toast.success("Command list deleted successfully")
      setCommandLists(commandLists.filter((list) => list._id !== listId))
    } catch (error) {
      console.error("Error deleting command list:", error)
      toast.error(error.response?.data?.message || "Failed to delete command list")
    }
  }

  const handleAddCommand = (e) => {
    e.preventDefault()

    // Validate command form
    if (!commandForm.name || !commandForm.command) {
      toast.error("Command name and command are required")
      return
    }

    // Parse parameters
    const parameters = commandForm.parameters ? commandForm.parameters.split(",").map((param) => param.trim()) : []

    // Add command to form data
    const newCommand = {
      name: commandForm.name,
      command: commandForm.command,
      parameters,
      description: commandForm.description,
    }

    // If editing an existing command list, add command via API
    if (selectedCommandList && showCommandModal) {
      addCommandToList(newCommand)
    } else {
      // Otherwise add to local form state
      setFormData({
        ...formData,
        commands: [...formData.commands, newCommand],
      })

      resetCommandForm()
    }
  }

  const addCommandToList = async (command) => {
    try {
      const response = await api.post(`/command-lists/${selectedCommandList._id}/commands`, command)
      toast.success("Command added successfully")

      // Update command lists
      setCommandLists(
        commandLists.map((list) => (list._id === selectedCommandList._id ? response.data.commandList : list)),
      )

      resetCommandForm()
      setShowCommandModal(false)
    } catch (error) {
      console.error("Error adding command:", error)
      toast.error(error.response?.data?.message || "Failed to add command")
    }
  }

  const handleRemoveCommand = (index) => {
    const updatedCommands = [...formData.commands]
    updatedCommands.splice(index, 1)
    setFormData({
      ...formData,
      commands: updatedCommands,
    })
  }

  const handleRemoveCommandFromList = async (commandId) => {
    try {
      const response = await api.delete(`/command-lists/${selectedCommandList._id}/commands/${commandId}`)
      toast.success("Command removed successfully")

      // Update command lists
      setCommandLists(
        commandLists.map((list) => (list._id === selectedCommandList._id ? response.data.commandList : list)),
      )
    } catch (error) {
      console.error("Error removing command:", error)
      toast.error(error.response?.data?.message || "Failed to remove command")
    }
  }

  const openEditModal = (commandList) => {
    setSelectedCommandList(commandList)
    setFormData({
      name: commandList.name,
      description: commandList.description || "",
      commands: commandList.commands || [],
    })
    setShowEditModal(true)
  }

  const openCommandModal = (commandList) => {
    setSelectedCommandList(commandList)
    resetCommandForm()
    setShowCommandModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      commands: [],
    })
    resetCommandForm()
  }

  const resetCommandForm = () => {
    setCommandForm({
      name: "",
      command: "",
      parameters: "",
      description: "",
    })
  }

  const filteredCommandLists = commandLists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase())),
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
        <h1 className="text-2xl font-bold text-gray-800">Command Lists</h1>

        {["admin", "team_lead"].includes(user.role) && (
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Command List
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
            placeholder="Search command lists..."
          />
        </div>
      </div>

      {/* Command Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommandLists.map((list) => (
          <div key={list._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{list.name}</h2>
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {list.commands?.length || 0} commands
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{list.description || "No description"}</p>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Commands:</h3>
              <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                {list.commands && list.commands.length > 0 ? (
                  list.commands.map((cmd) => (
                    <li key={cmd._id} className="flex items-center">
                      <Terminal size={14} className="text-gray-400 mr-2" />
                      {cmd.name}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No commands in this list</li>
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
                    onClick={() => openCommandModal(list)}
                    className="text-green-600 hover:text-green-900"
                    title="Add Command"
                  >
                    <Plus size={18} />
                  </button>

                  <button
                    onClick={() => openEditModal(list)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Command List"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleDeleteCommandList(list._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Command List"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredCommandLists.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
            <List size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No command lists found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try a different search term" : "Add your first command list to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Add Command List Modal */}
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Command List</h3>

                    <form onSubmit={handleAddCommandList}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            List Name *
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

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Commands</h4>
                          </div>

                          {/* Command list */}
                          <div className="bg-gray-50 rounded-md p-2 mb-4 max-h-40 overflow-y-auto">
                            {formData.commands.length > 0 ? (
                              <ul className="divide-y divide-gray-200">
                                {formData.commands.map((cmd, index) => (
                                  <li key={index} className="py-2 flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium">{cmd.name}</p>
                                      <p className="text-xs text-gray-500">{cmd.command}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCommand(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-2">No commands added yet</p>
                            )}
                          </div>

                          {/* Add command form */}
                          <div className="bg-gray-50 rounded-md p-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Add Command</h5>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Command Name"
                                    name="name"
                                    value={commandForm.name}
                                    onChange={handleCommandInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Command"
                                    name="command"
                                    value={commandForm.command}
                                    onChange={handleCommandInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Parameters (comma separated)"
                                  name="parameters"
                                  value={commandForm.parameters}
                                  onChange={handleCommandInputChange}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Description"
                                  name="description"
                                  value={commandForm.description}
                                  onChange={handleCommandInputChange}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleAddCommand}
                                className="w-full bg-blue-500 text-white text-sm py-1 rounded-md hover:bg-blue-600"
                              >
                                Add Command
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddCommandList}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create Command List
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

      {/* Edit Command List Modal */}
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Command List</h3>

                    <form onSubmit={handleEditCommandList}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            List Name *
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

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Commands</h4>
                          </div>

                          {/* Command list */}
                          <div className="bg-gray-50 rounded-md p-2 mb-4 max-h-40 overflow-y-auto">
                            {formData.commands && formData.commands.length > 0 ? (
                              <ul className="divide-y divide-gray-200">
                                {formData.commands.map((cmd, index) => (
                                  <li key={cmd._id || index} className="py-2 flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium">{cmd.name}</p>
                                      <p className="text-xs text-gray-500">{cmd.command}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        cmd._id ? handleRemoveCommandFromList(cmd._id) : handleRemoveCommand(index)
                                      }
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-2">No commands added yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleEditCommandList}
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

      {/* Add Command Modal */}
      {showCommandModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Add Command to {selectedCommandList?.name}
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleAddCommand(e)
                      }}
                    >
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="cmdName" className="block text-sm font-medium text-gray-700 mb-1">
                            Command Name *
                          </label>
                          <input
                            type="text"
                            id="cmdName"
                            name="name"
                            value={commandForm.name}
                            onChange={handleCommandInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-1">
                            Command *
                          </label>
                          <input
                            type="text"
                            id="command"
                            name="command"
                            value={commandForm.command}
                            onChange={handleCommandInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="parameters" className="block text-sm font-medium text-gray-700 mb-1">
                            Parameters (comma separated)
                          </label>
                          <input
                            type="text"
                            id="parameters"
                            name="parameters"
                            value={commandForm.parameters}
                            onChange={handleCommandInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="param1, param2, param3"
                          />
                        </div>

                        <div>
                          <label htmlFor="cmdDescription" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            id="cmdDescription"
                            name="description"
                            value={commandForm.description}
                            onChange={handleCommandInputChange}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          ></textarea>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddCommand}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Command
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommandModal(false)}
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

export default CommandLists
