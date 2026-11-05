import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"

import { auth } from "../firebase"
import RolePicker from "../components/RolePicker"
import {
  createUserProfile,
  homeForRole,
} from "../services/userService"
import type { Role } from "../types"

function Signup() {
  const navigate = useNavigate()

  const [role, setRole] = useState<Exclude<Role, "admin">>("donor")
  const [orgName, setOrgName] = useState("")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError("")

    // Check required fields
    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.")
      return
    }

    if (role === "ngo" && !orgName.trim()) {
      setError("Please enter your NGO / organisation name.")
      return
    }

    // Check password length
    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      )
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    try {
      setLoading(true)

      // Create Firebase account
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        )

      // Save user's name in Firebase profile
      await updateProfile(
        userCredential.user,
        {
          displayName: name.trim(),
        }
      )

      // Save role + organisation in Firestore (users/{uid})
      await createUserProfile(userCredential.user, {
        name,
        role,
        orgName,
        phone,
      })

      // Signup successful: user is already signed in
      navigate(homeForRole(role))

    } catch (error: any) {
      console.error(error)

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "An account already exists with this email."
        )
      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        )
      } else if (
        error.code ===
        "auth/weak-password"
      ) {
        setError(
          "Password must be at least 6 characters."
        )
      } else {
        setError(
          "Unable to create account. Please try again."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">

      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-widest">
            Join SharePlate
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Create an account
          </h1>

          <p className="mt-3 text-gray-600">
            Start rescuing and sharing food
            with your community.
          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border bg-white p-8"
        >

          {/* Role */}
          <div>
            <label className="text-sm font-semibold">
              I am joining as
            </label>
            <div className="mt-2">
              <RolePicker value={role} onChange={setRole} />
            </div>
          </div>

          {/* Organisation (donors + NGOs) */}
          {role !== "volunteer" && (
            <div className="mt-6">
              <label className="text-sm font-semibold">
                {role === "ngo"
                  ? "NGO / Organisation Name"
                  : "Restaurant / Organisation (optional)"}
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder={
                  role === "ngo" ? "e.g. Hope Ashram" : "e.g. Green Leaf Restaurant"
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
              />
            </div>
          )}

          {/* Phone */}
          <div className="mt-6">
            <label className="text-sm font-semibold">
              Phone / WhatsApp (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {/* Full Name */}
          <div className="mt-6">

            <label className="text-sm font-semibold">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your name"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />

          </div>

          {/* Email */}
          <div className="mt-6">

            <label className="text-sm font-semibold">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />

          </div>

          {/* Password */}
          <div className="mt-6">

            <label className="text-sm font-semibold">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 6 characters"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />

          </div>

          {/* Confirm Password */}
          <div className="mt-6">

            <label className="text-sm font-semibold">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your password"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />

          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* Create Account */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-500">

            Already have an account?{" "}

            <Link
              to="/login"
              className="font-semibold text-black hover:underline"
            >
              Login
            </Link>

          </p>

        </form>

      </div>

    </main>
  )
}

export default Signup