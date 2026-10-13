import React from 'react';
import { Layers, ShieldCheck, Database, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">FleetPulse Architecture</span>
          <span className="text-slate-300">|</span>
          <span>Round 2 (LLD: REST APIs, State Machine, Caching)</span>
          <span className="text-slate-300">|</span>
          <span>Round 3 (HLD: Microservices, Events, Scalability)</span>
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-blue-600" /> FastAPI + SQLite/PostGIS
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-emerald-600" /> Redis Cache / Fallback
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Atomic 409 Concurrency
          </span>
        </div>
      </div>
    </footer>
  );
};
