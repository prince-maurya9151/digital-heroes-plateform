import { Routes, Route, Link } from 'react-router-dom';
import { Navbar, Footer } from './components/common/Layout';
import Guard from './components/common/guards';
import Home from './pages/Home';
import Charities, { CharityDetail } from './pages/Charities';
import Draws from './pages/Draws';
import { Login, Signup } from './pages/Auth';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/charities/:id" element={<CharityDetail />} />
          <Route path="/draws" element={<Draws />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="*" element={
          <p className="py-20 text-center">Page not found. 
            <Link className="text-brand" to="/">Home</Link>
          </p>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
