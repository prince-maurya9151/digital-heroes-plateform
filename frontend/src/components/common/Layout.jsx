import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Btn } from './ui';

export function Navbar() {
  const { user, logout, active } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const link = 'text-white/70 hover:text-white transition';
  const close = () => setOpen(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold">digital
          <span className="text-brand italic">.heroes</span>
        </Link>
        <button className="md:hidden text-2xl" onClick={() => setOpen(!open)} aria-label="menu">☰</button>
        
        <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col gap-4 border-b border-white/10 bg-ink p-4 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}>

          <NavLink to="/charities" className={link} onClick={close}>Charities</NavLink>
          <NavLink to="/draws" className={link} onClick={close}>Draws</NavLink>
          
          <a href="/#how" className={link} onClick={close}>How it works</a>
          {user && 
          <NavLink to="/dashboard" className={link} onClick={close}>Dashboard</NavLink>
          }
          {user?.role === 'admin' && 
          <NavLink to="/admin" className={link} onClick={close}>Admin</NavLink>
          }
          {user ? (
            <Btn variant="ghost" onClick={() => { logout(); close(); nav('/'); }}>Logout</Btn>
          ) : (
            <Link to="/login" className={link} onClick={close}>Login</Link>
          )}
          {!active && 
          <Link to="/pricing" onClick={close}>
            <Btn>Subscribe</Btn>
          </Link>}
        </nav>  
      </div>
    </header>
  );
}

export const Footer = () => (
  <footer className="mt-24 border-t border-white/10 py-8 text-center text-sm text-white/40">
    © 2026 Digital Heroes · Play. Win. Give.
  </footer>
);
