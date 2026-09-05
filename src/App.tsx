import { BrowserRouter, Routes, Route } from "react-router-dom"

import { AuthProvider } from "./context/AuthContext"

import AdminRoute from "./components/AdminRoute"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ScrollToTop from "./components/ScrollToTop"
import ProtectedRoute from "./components/ProtectedRoute"

import Home from "./pages/Home"
import Food from "./pages/Food"
import FoodDetails from "./pages/FoodDetails"
import Donate from "./pages/Donate"
import Volunteers from "./pages/Volunteers"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import MyRescues from "./pages/MyRescues"

import Signup from "./pages/Signup"
import Login from "./pages/Login"
import MyDonations from "./pages/MyDonations"
function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <ScrollToTop />

        <Navbar />

        <Routes>

          {/* Public Pages */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/food"
            element={<Food />}
          />

          <Route
            path="/food/:id"
            element={<FoodDetails />}
          />

          <Route
            path="/volunteers"
            element={<Volunteers />}
          />

          {/* Authentication Pages */}

          <Route
            path="/signup"
            element={<Signup />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          {/* Protected: My Rescues */}

          <Route
            path="/my-rescues"
            element={
              <ProtectedRoute>
                <MyRescues />
              </ProtectedRoute>
            }
          />
          <Route
  path="/my-donations"
  element={
    <ProtectedRoute>
      <MyDonations />
    </ProtectedRoute>
  }
/>

          {/* Protected: Donate */}

          <Route
            path="/donate"
            element={
              <ProtectedRoute>
                <Donate />
              </ProtectedRoute>
            }
          />

          {/* Protected: Dashboard */}

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