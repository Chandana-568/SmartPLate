import { BrowserRouter, Routes, Route } from "react-router-dom"

import { AuthProvider } from "./context/AuthContext"
import { useDonationsSync } from "./hooks/useDonationsSync"

import AdminRoute from "./components/AdminRoute"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ScrollToTop from "./components/ScrollToTop"
import ProtectedRoute from "./components/ProtectedRoute"
import RoleRedirect from "./components/RoleRedirect"

import Home from "./pages/Home"
import Food from "./pages/Food"
import FoodDetails from "./pages/FoodDetails"
import Donate from "./pages/Donate"
import Volunteers from "./pages/Volunteers"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import MyRescues from "./pages/MyRescues"
import MyDonations from "./pages/MyDonations"
import Onboarding from "./pages/Onboarding"

import Signup from "./pages/Signup"
import Login from "./pages/Login"

function App() {
  // One live Firestore subscription for the whole app
  useDonationsSync()

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />

        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/food" element={<Food />} />
          <Route path="/food/:id" element={<FoodDetails />} />
          <Route path="/volunteers" element={<Volunteers />} />

          {/* Authentication */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/start" element={<RoleRedirect />} />

          {/* Donors */}
          <Route
            path="/donate"
            element={
              <ProtectedRoute roles={["donor"]}>
                <Donate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-donations"
            element={
              <ProtectedRoute roles={["donor"]}>
                <MyDonations />
              </ProtectedRoute>
            }
          />

          {/* NGOs + Volunteers */}
          <Route
            path="/my-rescues"
            element={
              <ProtectedRoute roles={["ngo", "volunteer"]}>
                <MyRescues />
              </ProtectedRoute>
            }
          />

          {/* Any signed-in user */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Only */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Routes>

        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
