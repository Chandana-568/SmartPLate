
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

import Home from "./pages/Home"
import Food from "./pages/Food"
import FoodDetails from "./pages/FoodDetails"
import Donate from "./pages/Donate"
import Volunteers from "./pages/Volunteers"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import MyRescues from "./pages/MyRescues"

function App() {
  return (
    <BrowserRouter>
     <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/food" element={<Food />} />
        <Route path="/food/:id" element={<FoodDetails />} />
         <Route path="/my-rescues" element={<MyRescues />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
       
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App