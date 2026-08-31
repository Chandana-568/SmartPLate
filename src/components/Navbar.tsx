import { Link, NavLink } from "react-router-dom"
import { Heart, Menu, X } from "lucide-react"
import { useState } from "react"

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Find Food", path: "/food" },
    { name: "Donate Food", path: "/donate" },
    { name: "Volunteer", path: "/volunteers" },
  ]

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold"
        >
          <Heart className="h-7 w-7" />
          <span>SharePlate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive ? "font-semibold" : "text-gray-600"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/dashboard"
            className="text-sm font-medium"
          >
            Dashboard
          </Link>

          <Link
            to="/donate"
            className="rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Button */}
        <button
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

            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar