import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const navItems = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/app', label: 'CV & Lettres', icon: '✦' },
  { to: '/ats', label: 'Candidatures', icon: '📋' },
  { to: '/email', label: 'Comptes Email', icon: '✉' },
];

function isActive(item, pathname) {
  return pathname === item.to;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={isActive(item, location.pathname)
              ? { backgroundColor: '#7395AE20', color: '#557A95' }
              : { color: '#5D5C61' }}
            onMouseEnter={e => { if (!isActive(item, location.pathname)) e.currentTarget.style.backgroundColor = '#7395AE15'; }}
            onMouseLeave={e => { if (!isActive(item, location.pathname)) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {user?.isAdmin && (
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              location.pathname === '/admin'
                ? 'bg-red-50 text-red-700'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <span className="w-5 text-center text-base">⚙</span>
            Admin
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 space-y-1" style={{ borderTop: '1px solid #d5cdc9' }}>
        <p className="text-xs truncate mb-2" style={{ color: '#7395AE' }}>{user?.email}</p>
        <Link
          to="/account"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
          style={{ color: '#5D5C61' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7395AE15'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <span className="text-base">👤</span> Mon compte
        </Link>
        <button
          onClick={logout}
          className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
          style={{ color: '#5D5C61' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7395AE15'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <span className="text-base">↩</span> Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#f5f1ef' }}>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden h-12 flex items-center justify-between px-4 sticky top-0 z-30" style={{ backgroundColor: '#5D5C61' }}>
        <Logo size={24} textColor="white" />
        <button
          onClick={() => setOpen(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-xl"
          style={{ color: '#B1A296' }}
          aria-label="Menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Mobile overlay sidebar ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-20"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute left-0 top-12 bottom-0 w-56 flex flex-col shadow-xl"
            style={{ backgroundColor: 'white', borderRight: '1px solid #d5cdc9' }}
            onClick={e => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── Desktop sidebar (always visible) ── */}
      <aside className="hidden md:flex md:w-52 shrink-0 flex-col sticky top-0 h-screen z-20"
        style={{ backgroundColor: 'white', borderRight: '1px solid #d5cdc9' }}>
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #d5cdc9' }}>
          <Logo size={26} textColor="#557A95" />
        </div>
        {sidebarContent}
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
