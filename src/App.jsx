"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminAssignTask from "./pages/admin/AssignTask"
import DataPage from "./pages/admin/DataPage"
import AdminDataPage from "./pages/admin/admin-data-page"
import AccountDataPage from "./pages/delegation"
import QuickTask from "./pages/QuickTask"
import AdminDelegationTask from "./pages/delegation-data"
import "./index.css"
import Demo from "./pages/user/Demo"
import Setting from "./pages/Setting"
import MisReport from "./pages/MisReport"
import RealtimeLogoutListener from "./components/RealtimeLogoutListener"   // ✅ Added listener
import Approval from "./pages/admin/Approval"
import License from "./pages/License"
import TrainingVideo from "./pages/TrainingVideo"
import HolidayList from "./pages/HolidayList"
import Calendar from "./pages/Calendar"

import TaskUpdate from"./pages/admin/Task-update"
import WorkingDate from "./pages/admin/WorkingDate"

// Auth wrapper component to protect routes
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const username = localStorage.getItem("user-name")
  const userRole = localStorage.getItem("role")

  // If no user is logged in, redirect to login
  if (!username) {
    return <Navigate to="/login" replace />
  }

  // If this is an admin-only route and user is not admin, redirect to tasks
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard/admin" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      {/* ✅ Realtime listener inside Router so useNavigate works */}
      <RealtimeLogoutListener />

      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/demo" element={<Demo />} />

        {/* Dashboard redirect */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Admin & User Dashboard route */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/quick-task"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <QuickTask />
            </ProtectedRoute>
          }
        />

        {/* Assign Task route - only for admin */}
        <Route
          path="/dashboard/assign-task"
          element={
            <ProtectedRoute>
              <AdminAssignTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/delegation-task"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDelegationTask />
            </ProtectedRoute>
          }
        />

        {/* Delegation route for user */}
        <Route
          path="/dashboard/delegation"
          element={
            <ProtectedRoute>
              <AccountDataPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/setting"
          element={
            <ProtectedRoute>
              <Setting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/approval"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Approval />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/mis-report"
          element={
            <ProtectedRoute>
              <MisReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/holiday-list"
          element={
            <ProtectedRoute>
              <HolidayList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/license"
          element={
            <ProtectedRoute>
              <License />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/training-video"
          element={
            <ProtectedRoute>
              <TrainingVideo />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard/task-update"
          element={
            <ProtectedRoute>
              <TaskUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/working-date"
          element={
            <ProtectedRoute>
              <WorkingDate />
            </ProtectedRoute>
          }
        />

        {/* Data routes */}
        <Route
          path="/dashboard/data/:category"
          element={
            <ProtectedRoute>
              <DataPage />
            </ProtectedRoute>
          }
        />

        {/* Specific route for Admin Data Page */}
        <Route
          path="/dashboard/data/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDataPage />
            </ProtectedRoute>
          }
        />

        {/* Backward compatibility redirects */}
        <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/quick" element={<Navigate to="/dashboard/quick-task" replace />} />
        <Route path="/admin/assign-task" element={<Navigate to="/dashboard/assign-task" replace />} />
        <Route path="/admin/delegation-task" element={<Navigate to="/dashboard/delegation-task" replace />} />
        <Route path="/admin/mis-report" element={<Navigate to="/dashboard/mis-report" replace />} />
        <Route path="/admin/data/:category" element={<Navigate to="/dashboard/data/:category" replace />} />
        <Route path="/user/*" element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </Router>
  )
}

export default App
