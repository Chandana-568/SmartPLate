import { Link, NavLink, useNavigate } from "react-router-dom"
import { Heart, Menu, X } from "lucide-react"
import { useState } from "react"
import { signOut } from "firebase/auth"

import { auth } from "../firebase"
import { useAuth } from "../context/auth"

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navigate = useNavigate()

  const { user, profile, role } = useAuth()

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Find Food", path: "/food" },
    // Logged-out visitors see Donate (it leads to login); donors always do
    ...(!user || role === "donor" || role === "admin"
      ? [{ name: "Donate Food", path: "/donate" }]
      : []),
    // Food whose pickup timer ran out moves here from Find Food
    { name: "Expired Food", path: "/expired" },
    ...(!user ? [{ name: "Volunteer", path: "/volunteers" }] : []),
  ]

  // Role-specific page next to Dashboard
  const roleLink =
    role === "donor"
      ? { name: "My Donations", path: "/my-donations" }
      : role === "ngo"
        ? { name: "My Rescues", path: "/my-rescues" }
        : role === "volunteer"
          ? { name: "My Pickups", path: "/my-rescues" }
          : role === "admin"
            ? { name: "Admin", path: "/admin" }
            : null

  const roleLabel =
    role === "ngo"
      ? "NGO"
      : role === "recycler"
        ? profile?.recyclerType === "poultry"
          ? "Poultry farm"
          : profile?.recyclerType === "biogas"
            ? "Biogas unit"
            : "Compost unit"
      : role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : null

  const displayName =
    profile?.orgName || profile?.name || user?.displayName

  const handleLogout = async () => {
    try {
      await signOut(auth)

      setIsOpen(false)

      navigate("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 shadow-md shadow-brand-700/30">
            <Heart className="h-5 w-5 fill-white text-white" />
          </span>
          <span>
            Share<span className="text-brand-700">Plate</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">

          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">

          {user ? (
            <>
              {/* User Name + role */}
              {displayName && (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  Hi, {displayName}
                  {roleLabel && (
                    <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-xs font-semibold text-saffron-600">
                      {roleLabel}
                    </span>
                  )}
                </span>
              )}

              {/* Dashboard */}
              <Link
                to="/dashboard"
                className="text-sm font-medium"
              >
                Dashboard
              </Link>

              {/* Role page */}
              {roleLink && (
                <Link
                  to={roleLink.path}
                  className="text-sm font-medium"
                >
                  {roleLink.name}
                </Link>
              )}

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Login */}
              <Link
                to="/login"
                className="text-sm font-medium"
              >
                Login
              </Link>

              {/* Sign Up */}
              <Link
                to="/signup"
                className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Sign Up
              </Link>
            </>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="border-t px-6 py-5 md:hidden">

          <div className="flex flex-col gap-5">

            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="font-medium"
              >
                {link.name}
              </NavLink>
            ))}

            {user ? (
              <>
                {/* Mobile User Name */}
                {displayName && (
                  <span className="font-semibold">
                    Hi, {displayName}
                    {roleLabel && ` · ${roleLabel}`}
                  </span>
                )}

                {/* Dashboard */}
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="font-medium"
                >
                  Dashboard
                </Link>

                {/* Role page */}
                {roleLink && (
                  <Link
                    to={roleLink.path}
                    onClick={() => setIsOpen(false)}
                    className="font-medium"
                  >
                    {roleLink.name}
                  </Link>
                )}

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login */}
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="font-medium"
                >
                  Login
                </Link>

                {/* Sign Up */}
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}

          </div>

        </div>
      )}

    </nav>
  )
}

export default Navbar