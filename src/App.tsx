import { lazy, Suspense } from "react"
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

// Every page except Home loads on demand (smaller first download)
const Food = lazy(() => import("./pages/Food"))
const FoodDetails = lazy(() => import("./pages/FoodDetails"))
const Donate = lazy(() => import("./pages/Donate"))
const Volunteers = lazy(() => import("./pages/Volunteers"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Admin = lazy(() => import("./pages/Admin"))
const MyRescues = lazy(() => import("./pages/MyRescues"))
const MyDonations = lazy(() => import("./pages/MyDonations"))
const Onboarding = lazy(() => import("./pages/Onboarding"))
const Signup = lazy(() => import("./pages/Signup"))
const Login = lazy(() => import("./pages/Login"))

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <p className="text-gray-500">Loading...</p>
  </div>
)

function App() {
  // One live Firestore subscription for the whole app
  useDonationsSync()

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />

        <Suspense fallback={pageFallback}>
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
        </Suspense>

        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
