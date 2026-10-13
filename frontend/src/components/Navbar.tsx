import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Car,
  Navigation,
  Activity,
  Layers,
  Terminal,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { adminApi, healthApi } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState<string>('CHECKING');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const res = await healthApi.check();
        setHealthStatus(res.status);
      } catch {
        setHealthStatus('OFFLINE');
      }
    };
    checkSystemHealth();
    const timer = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleResetDemo = async () => {
    if (confirm('Reset demo database to fresh sample users, drivers, and rides?')) {
      try {
        setIsResetting(true);
        const res = await adminApi.resetDemoDatabase();
        setResetMessage('Demo database reset successfully!');
        setTimeout(() => {
          setResetMessage(null);
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        alert('Failed to reset demo: ' + (err?.message || 'Server error'));
      } finally {
        setIsResetting(false);
      }
    }
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/book', label: 'Book a Ride', icon: Compass },
    { to: '/dispatch', label: 'Driver Dispatch', icon: Car },
    { to: '/track', label: 'Ride Tracking', icon: Navigation },
    { to: '/system-design', label: 'System Design', icon: Layers },
    { to: '/api-explorer', label: 'API Explorer', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">FleetPulse</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Round 2 & 3
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-none">Ride-Sharing & Dispatch Platform</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: System Status & Reset Demo */}
          <div className="hidden sm:flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                healthStatus === 'HEALTHY'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
              title="FastAPI Backend Health"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="hidden lg:inline">{healthStatus === 'HEALTHY' ? 'Backend Live' : 'Backend Degraded'}</span>
            </div>

            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer disabled:opacity-50"
              title="Reset Demo Database"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast if reset */}
      {resetMessage && (
        <div className="bg-emerald-600 text-white text-xs font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {resetMessage}
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                location.pathname === to ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Backend: {healthStatus}</span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleResetDemo();
              }}
              className="px-3 py-1 text-xs font-medium bg-slate-100 rounded text-slate-700"
            >
              Reset Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
