import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"

import { auth } from "../firebase"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Validation
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    setError("")
    setLoading(true)

    try {
      // Firebase login
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      // Login successful
      navigate("/")

    } catch (error: any) {
      console.error("Login error:", error)

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.")
      } else if (
        error.code === "auth/invalid-email"
      ) {
        setError("Please enter a valid email address.")
      } else {
        setError(
          "Unable to login. Please try again."
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
            Welcome Back
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Login to SharePlate
          </h1>

          <p className="mt-3 text-gray-600">
            Continue your food rescue journey.
          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border bg-white p-8"
        >

          {/* Email */}
          <div>

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
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />

          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Signup */}
          <p className="mt-6 text-center text-sm text-gray-500">

            Don't have an account?{" "}

            <Link
              to="/signup"
              className="font-semibold text-black hover:underline"
            >
              Sign up
            </Link>

          </p>

        </form>

      </div>
    </main>
  )
}

export default Login