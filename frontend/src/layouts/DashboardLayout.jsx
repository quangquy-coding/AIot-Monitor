"use client"

import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { LayoutDashboard, Cpu, Users, LogOut, User, Menu, X, Layers, Terminal, FileText } from "lucide-react"

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const menuItems = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      roles: ["admin", "team_lead", "supervisor", "operator"],
    },
    {
      path: "/devices",
      name: "Devices",
      icon: <Cpu size={20} />,
      roles: ["admin", "team_lead", "supervisor", "operator"],
    },
    {
      path: "/device-groups",
      name: "Device Groups",
      icon: <Layers size={20} />,
      roles: ["admin", "team_lead", "supervisor"],
    },
    {
      path: "/command-lists",
      name: "Command Lists",
      icon: <Terminal size={20} />,
      roles: ["admin", "team_lead", "supervisor"],
    },
    {
      path: "/profiles",
      name: "Profiles",
      icon: <FileText size={20} />,
      roles: ["admin", "team_lead", "supervisor"],
    },
    {
      path: "/users",
      name: "Users",
      icon: <Users size={20} />,
      roles: ["admin", "team_lead"],
    },
    {
      path: "/profile",
      name: "My Profile",
      icon: <User size={20} />,
      roles: ["admin", "team_lead", "supervisor", "operator"],
    },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 lg:h-20">
          <Link to="/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold">AIoT Monitor</h1>
          </Link>
          <button onClick={toggleSidebar} className="rounded-md p-1 text-white hover:bg-gray-800 lg:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {menuItems
              .filter((item) => item.roles.includes(user.role))
              .map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                        isActive ? "bg-blue-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </NavLink>
                </li>
              ))}

            <li>
              <button
                onClick={handleLogout}
                className="flex w-full items-center rounded-md px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <span className="mr-3">
                  <LogOut size={20} />
                </span>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:h-20">
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-blue-500 text-center text-white">
              <span className="leading-8">{user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
