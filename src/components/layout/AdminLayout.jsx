"use client";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Database,
  ChevronDown,
  ChevronRight,
  Zap,
  Settings,
  CirclePlus,
  UserRound,
  CalendarCheck,
  BookmarkCheck,
  CrossIcon,
  X,
  UserCheck,
  Calendar,
  Gift,
  Key,
  Video,
  ClipboardCheck,
} from "lucide-react";

import Logo from "../../assets/Logo.PNG"

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("user-name");
    const storedRole = localStorage.getItem("role");
    const storedEmail = localStorage.getItem("email_id");

    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }

    setUsername(storedUsername);
    setUserRole(storedRole || "user");
    setUserEmail(storedEmail);
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user-name");
    localStorage.removeItem("role");
    localStorage.removeItem("email_id");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Filter dataCategories based on user role
  const dataCategories = [
    { id: "sales", name: "Checklist", link: "/dashboard/data/sales" },
  ];

  // Update the routes array based on user role
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Home,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin"],
    },
    {
      href: "/dashboard/quick-task",
      label: "Quick Task",
      icon: Zap,
      active: location.pathname === "/dashboard/quick-task",
      showFor: ["admin"],
    },
    {
      href: "/dashboard/delegation",
      label: "Delegation",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation",
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/data/sales",
      label: "Checklist",
      icon: Database,
      active: location.pathname === "/dashboard/data/sales",
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/approval",
      label: "Admin Approvals",
      icon: UserCheck,
      active: location.pathname.includes("/dashboard/approval"),
      showFor: ["admin"],
    },
    {
      href: "/dashboard/calendar",
      label: "Calendar",
      icon: Calendar,
      active: location.pathname.includes("/dashboard/calendar"),
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/holiday-list",
      label: "Holiday+Working List",
      icon: Gift,
      active: location.pathname.includes("/dashboard/holiday-list"),
      showFor: ["admin"],
    },
    {
      href: "/dashboard/setting",
      label: "Settings",
      icon: Settings,
      active: location.pathname.includes("/dashboard/setting"),
      showFor: ["admin"],
    },
    {
      href: "/dashboard/task-update",
      label: "Task Update",
      icon: ClipboardCheck,
      active: location.pathname.includes("/dashboard/task-update"),
      showFor: ["admin"],
    },
    {
      href: "/dashboard/working-date",
      label: "Working Date",
      icon: Calendar,
      active: location.pathname.includes("/dashboard/working-date"),
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/license",
      label: "License",
      icon: Key,
      active: location.pathname.includes("/dashboard/license"),
      showFor: ["admin", "user"],
    },
    {
      href: "/dashboard/training-video",
      label: "Training Video",
      icon: Video,
      active: location.pathname.includes("/dashboard/training-video"),
      showFor: ["admin", "user"],
    },
  ];

  const getAccessibleDepartments = () => {
    const userRole = localStorage.getItem("role") || "user";
    return dataCategories.filter(
      (cat) => !cat.showFor || cat.showFor.includes(userRole)
    );
  };

  // Filter routes based on user role
  const getAccessibleRoutes = () => {
    const userRole = localStorage.getItem("role") || "user";
    return routes.filter((route) => route.showFor.includes(userRole));
  };

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/");

  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true);
    }
  }, [isDataPage, isDataSubmenuOpen]);

  // Get accessible routes and departments
  const accessibleRoutes = getAccessibleRoutes();
  const accessibleDepartments = getAccessibleDepartments();

  return (
    <div
      className={`flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50`}
    >
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-blue-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-2 font-semibold text-blue-700"
          >
            <img
              src={Logo}
              alt="Company Logo"
              className="h-8 w-auto text-blue-600"
            />
            <span>Checklist & Delegation </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={`${route.label}-${route.href}`}>
                {route.submenu ? (
                  <div className="mb-1">
                    <button
                      onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon
                          className={`h-4 w-4 ${route.active ? "text-blue-600" : ""
                            }`}
                        />
                        <span className="font-medium">{route.label}</span>
                      </div>
                      <div className="flex items-center">
                        {isDataSubmenuOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                    {isDataSubmenuOpen && (
                      <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                        {accessibleDepartments.map((category) => (
                          <li key={category.id}>
                            <Link
                              to={
                                category.link ||
                                `/dashboard/data/${category.id}`
                              }
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname ===
                                (category.link ||
                                  `/dashboard/data/${category.id}`)
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 "
                                }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Database className="h-3 w-3 text-gray-500" />
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={route.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                      ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-700 hover:bg-blue-50 hover:border-l-4 hover:border-blue-300"
                      }`}
                  >
                    <route.icon
                      className={`h-4 w-4 ${route.active ? "text-blue-600" : ""
                        }`}
                    />
                    <span>{route.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col">
            {/* User info section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
                  <span className="text-sm font-medium text-black">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {username || "User"}{" "}
                    {userRole === "admin" ? "(Admin)" : ""}
                  </p>
                  <p className="text-xs text-blue-600 truncate">
                    {userEmail || "user@example.com"}
                  </p>
                </div>
              </div>

              {/* Dark mode toggle (if available) */}
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                >
                  {darkMode ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.600 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                  <span className="sr-only">
                    {darkMode ? "Light mode" : "Dark mode"}
                  </span>
                </button>
              )}
            </div>

            {/* Logout button positioned below user info */}
            <div className="mt-2 flex justify-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-md hover:bg-blue-100 text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button and sidebar - similar structure as desktop but with mobile classes */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-4 top-3 z-50 text-blue-700 p-2 rounded-md hover:bg-blue-100"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2 font-semibold text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <img
              src={Logo}
              alt="Company Logo"
              className="h-8 w-auto text-blue-600"
            />
                <span>Checklist & Delegation </span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 bg-white">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={`${route.label}-${route.href}`}>
                    {route.submenu ? (
                      <div className="mb-1">
                        <button
                          onClick={() =>
                            setIsDataSubmenuOpen(!isDataSubmenuOpen)
                          }
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                            : "text-gray-700 hover:bg-blue-50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <route.icon
                              className={`h-4 w-4 ${route.active ? "text-blue-600" : ""
                                }`}
                            />
                            <span className="font-medium">{route.label}</span>
                          </div>
                          <div className="flex items-center">
                            {isDataSubmenuOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </button>
                        {isDataSubmenuOpen && (
                          <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                            {accessibleDepartments.map((category) => (
                              <li key={category.id}>
                                <Link
                                  to={
                                    category.link ||
                                    `/dashboard/data/${category.id}`
                                  }
                                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname ===
                                    (category.link ||
                                      `/dashboard/data/${category.id}`)
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                    }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <Database className="h-3 w-3 text-gray-500" />
                                  {category.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={route.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${route.active
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-l-4 border-blue-500"
                          : "text-gray-700 hover:bg-blue-50 hover:border-l-4 hover:border-blue-300"
                          }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <route.icon
                          className={`h-4 w-4 ${route.active ? "text-blue-600" : ""
                            }`}
                        />
                        <span>{route.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-sm font-medium text-black">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"}{" "}
                      {userRole === "admin" ? "(Admin)" : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {userEmail || "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {toggleDarkMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                    >
                      {darkMode ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.600 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      )}
                      <span className="sr-only">
                        {darkMode ? "Light mode" : "Dark mode"}
                      </span>
                    </button>
                  )}

                </div>
              </div>
              <div className="mt-2 flex justify-center">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-md hover:bg-blue-100 text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-blue-200 bg-white px-4 md:px-6">
          <div className="flex md:hidden w-8"></div>
          <h1 className="text-lg font-semibold text-blue-700">
            Checklist & Delegation
          </h1>
          <div className="flex items-center">
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 pb-20 sm:pb-6">
          {children}

          <div className="fixed md:left-64 left-0 right-0 bottom-0 py-1 px-4 gradient-bg text-white text-center text-sm shadow-lg z-10 backdrop-blur-sm">  <div className="sm:hidden flex justify-between items-center mb-[-10px]">
            <div className="p-2 rounded-full hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-110">
              <Link
                to={"/dashboard/admin"}
                className={` ${location.pathname === `/dashboard/admin`
                  ? "bg-white/20"
                  : ""
                  }`}
              // onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={29} className="drop-shadow-md" />
              </Link>
            </div>
            <div className="p-2 rounded-full hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-110">
              <Link
                to={"/dashboard/data/sales"}
                className={` ${location.pathname === `/dashboard/data/sales`
                  ? "bg-white/20"
                  : ""
                  }`}
              >
                <CalendarCheck size={29} className="drop-shadow-md" />
              </Link>
            </div>
            <div className="p-3 rounded-full bg-white text-purple-600 hover:bg-purple-100 transition-all duration-300 cursor-pointer transform hover:scale-110 shadow-lg -mt-6">
              <Link
                to={"/dashboard/assign-task"}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname === `/dashboard/assign-task`
                  ? "bg-white/20"
                  : ""
                  }`}
              >
                <CirclePlus size={29} className="drop-shadow-md" />
              </Link>
            </div>
            <div className="p-2 rounded-full hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-110">
              <Link
                to={"/dashboard/delegation"}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname === `/dashboard/delegation`
                  ? "bg-white/20"
                  : ""
                  }`}
              >
                <BookmarkCheck size={29} className="drop-shadow-md" />
              </Link>
            </div>
            <div
              className="p-2 rounded-full hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-110"
              onClick={() => setIsUserPopupOpen(true)}
            >
              <UserRound size={29} className="drop-shadow-md" />
            </div>
          </div>
            <div className="flex items-center justify-center gap-4 mt-2 mb-[-5px]">
              <a
                // href="https://www.botivate.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="sm:hidden sm:hover:underline flex items-center justify-center gap-1 text-gray-900 transition-colors duration-300"
              >
                Powerd by -
                <span className="font-bold drop-shadow-md text-gray-900">
                  Botivate
                </span>
              </a>

              <a
                href="https://www.botivate.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden hover:underline sm:flex items-center justify-center gap-1 text-white/90 hover:text-white transition-colors duration-300"
              >
                Powerd by -
                <span className="font-bold text-white drop-shadow-md">
                  Botivate
                </span>
              </a>

              <div className="flex items-center gap-2">
                {toggleDarkMode && (
                  <button
                    onClick={toggleDarkMode}
                    className="text-white hover:text-white/80 p-1 rounded-full hover:bg-white/10"
                  >
                    {darkMode ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 08 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    )}
                    <span className="sr-only">
                      {darkMode ? "Light mode" : "Dark mode"}
                    </span>
                  </button>
                )}

              </div>
            </div>
          </div>
        </main>

        {/* User Popup */}
        {isUserPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
              {/* <div onClick={() => setIsUserPopupOpen(false)}  className="flex justify-end"><X size={25}/></div> */}

              <div className="flex flex-col items-center justify-between">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-20 w-20 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-3xl font-medium text-white">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"}{" "}
                      {userRole === "admin" ? "(Admin)" : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {userEmail || "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center  justify-around w-full gap-2 mt-4">
                  <button
                    onClick={() => setIsUserPopupOpen(false)}
                    className="outline p-1 rounded-md px-2"
                  >
                    <span className="flex justify-center items-center">
                      Cancel
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 text-white hover:bg-blue-900 p-1 rounded-md px-2"
                  >
                    <span className="flex justify-center items-center">
                      Log out <LogOut className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
