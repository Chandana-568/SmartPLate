import { Leaf } from "lucide-react"
import { Link } from "react-router-dom"

function Footer() {
  return (
    <footer className="mt-auto bg-brand-950 text-brand-100">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
                <Leaf className="h-4 w-4 text-white" />
              </span>
              SharePlate
            </h2>
            <p className="mt-3 max-w-sm text-sm text-brand-200/80">
              Connecting surplus food with people who need it, and the rest with farms, compost and biogas.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-white">Platform</p>
              <Link to="/food" className="text-brand-200/80 transition hover:text-white">Find Food</Link>
              <Link to="/donate" className="text-brand-200/80 transition hover:text-white">Donate Food</Link>
              <Link to="/expired" className="text-brand-200/80 transition hover:text-white">Expired Food</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-white">Join</p>
              <Link to="/signup" className="text-brand-200/80 transition hover:text-white">Sign up</Link>
              <Link to="/volunteers" className="text-brand-200/80 transition hover:text-white">Volunteer</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-brand-200/70">
          © 2026 SharePlate. Author : RupaChandana
        </div>
      </div>
    </footer>
  )
}

export default Footer
