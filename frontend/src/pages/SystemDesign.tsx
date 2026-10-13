import React, { useState } from 'react';
import {
  Layers,
  Database,
  Cpu,
  Server,
  Zap,
  ShieldCheck,
  Radio,
  Share2,
  CheckCircle2,
  ArrowRight,
  GitBranch,
  Table,
  HardDrive,
  FileCode,
} from 'lucide-react';

export const SystemDesign: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'microservices' | 'apis' | 'database' | 'caching' | 'messaging' | 'scalability' | 'matrix'>('architecture');

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            Round 3 System Architecture (25 Marks)
          </span>
          <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Round 2 Low-Level Design (30 Marks)
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Architecture, Microservices & Low-Level Design
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete end-to-end technical blueprint demonstrating microservices decomposition, event-driven choreography, geospatial indexing, and production scaling.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {[
          { key: 'architecture', label: 'Architecture Topology', icon: Layers },
          { key: 'microservices', label: '9 Microservices Decomposition', icon: Server },
          { key: 'apis', label: 'REST API Contracts', icon: Table },
          { key: 'database', label: 'Data Models & Storage Selection', icon: Database },
          { key: 'caching', label: 'Redis Caching & Invalidation', icon: Zap },
          { key: 'messaging', label: 'Event-Driven Messaging', icon: Radio },
          { key: 'scalability', label: 'High-Traffic Scalability', icon: GitBranch },
          { key: 'matrix', label: 'Implemented vs Production Matrix', icon: CheckCircle2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ARCHITECTURE TOPOLOGY */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">End-to-End System Architecture Topology</h2>
              <p className="text-xs text-slate-500">
                Visualizing tier-by-tier flow: Clients → API Gateway / Reverse Proxy → Core Microservices → Caching & Message Broker → Distributed Persistence.
              </p>
            </div>

            {/* Visual Box Architecture Diagram */}
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-6 overflow-x-auto">
              {/* Client Tier */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">1. CLIENT LAYER (WEB & MOBILE APPS)</span>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-center">
                    <div className="font-bold text-sm text-blue-400">Rider App (React / iOS / Android)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Booking, GPS Search, Live Tracking, UPI Payments</div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-center">
                    <div className="font-bold text-sm text-emerald-400">Driver Console (React / Mobile)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Accept Dispatch, Lifecycle Controls, GPS Ping</div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-500 text-xs font-mono">
                ↓ HTTPS (REST) & WSS (WebSocket Feeds)
              </div>

              {/* Gateway & Load Balancer Tier */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">2. INGRESS & EDGE TIER</span>
                <div className="w-full max-w-2xl p-4 bg-slate-800/90 rounded-xl border border-blue-500/40 text-center space-y-1">
                  <div className="font-bold text-sm text-blue-300">NGINX / AWS ALB + API Gateway (FastAPI Middleware)</div>
                  <div className="text-xs text-slate-300">
                    SSL Termination • Rate Limiting (Token Bucket) • JWT Auth Verification • CORS Policy • Request Logging
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-500 text-xs font-mono">
                ↓ Internal Microservice Service Mesh (gRPC / HTTP/2)
              </div>

              {/* Microservices Cluster */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block text-center">
                  3. LOGICAL MICROSERVICES CLUSTER
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-indigo-300">Ride Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">Lifecycle state machine, atomic assignment</div>
                  </div>
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-emerald-300">Driver Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">Fleet state, vehicle profiles, ratings</div>
                  </div>
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-cyan-300">Location Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">Haversine & Redis GEO nearby driver queries</div>
                  </div>
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-amber-300">Pricing Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">Base rate + Per KM + Surge multipliers</div>
                  </div>
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-rose-300">Payment Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">Transactional writes, idempotency keys</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-purple-300">User Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">User identity & accounts</div>
                  </div>
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-pink-300">Notification Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">Push, SMS, WS dispatch</div>
                  </div>
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-teal-300">Analytics Service</div>
                    <div className="text-[10px] text-slate-400 mt-1">Operational KPIs & metrics</div>
                  </div>
                  <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-center">
                    <div className="font-bold text-xs text-sky-300">WebSocket Gateway</div>
                    <div className="text-[10px] text-slate-400 mt-1">Live pub/sub connections</div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-500 text-xs font-mono">
                ↓ Async Domain Events & Caching Lookups
              </div>

              {/* Message Broker & Cache Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/90 rounded-xl border border-red-500/40 space-y-1">
                  <div className="font-bold text-xs text-red-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Redis Cluster (Cache + Geospatial GEO)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Driver availability cache (TTL: 60s) • Active ride status cache (TTL: 30s) • In-memory fallback handler
                  </div>
                </div>

                <div className="p-4 bg-slate-800/90 rounded-xl border border-amber-500/40 space-y-1">
                  <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <Radio className="w-4 h-4" /> Event Broker (Apache Kafka / Local Broker)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Topics: ride.requested, driver.assigned, ride.started, ride.completed, payment.completed
                  </div>
                </div>
              </div>

              {/* Persistence Tier */}
              <div className="p-4 bg-slate-800/90 rounded-xl border border-emerald-500/40 space-y-2">
                <div className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Persistence Layer (PostgreSQL with PostGIS / SQLite Local)
                </div>
                <div className="text-[11px] text-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>• RDBMS: Users, Drivers, Rides, Payments (ACID transactions)</div>
                  <div>• Geospatial: PostGIS spatial indexes (GIST index on POINT)</div>
                  <div>• Read Replicas: Read/write splitting for analytics queries</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 9 MICROSERVICES DECOMPOSITION */}
      {activeTab === 'microservices' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              id: '1. API Gateway',
              desc: 'Single entry point for all client requests. Enforces rate limits, validates CORS, checks authorization, and routes traffic.',
              local: 'FastAPI routing, CORS middleware, and request logging.',
              prod: 'Kong / AWS API Gateway with Token Bucket rate limiting & Envoy proxy.',
            },
            {
              id: '2. User Service',
              desc: 'Manages user accounts, contact details, payment profiles, and rider preferences.',
              local: 'User model in SQLite with CRUD endpoints.',
              prod: 'Dedicated Go/Python service with OAuth2/OIDC and Postgres user partition.',
            },
            {
              id: '3. Driver Service',
              desc: 'Tracks driver fleet records, vehicle classes, ratings, current shift state, and availability.',
              local: 'Driver model, availability state machine, and status updates.',
              prod: 'Independently deployable fleet service with Redis state caches.',
            },
            {
              id: '4. Ride Service',
              desc: 'Core ride request coordinator. Manages strict state transitions (REQUESTED -> ACCEPTED -> IN_PROGRESS -> COMPLETED).',
              local: 'RideService with atomic DB transactions and 409 conflict checks.',
              prod: 'Orchestrator microservice publishing domain events to Kafka partitions.',
            },
            {
              id: '5. Location Service',
              desc: 'Handles high-frequency GPS coordinate pings and nearby available driver searches.',
              local: 'Haversine formula distance calculations with cache invalidation.',
              prod: 'Redis GEO commands (`GEOSEARCH`, `GEOADD`) and PostGIS spatial indexing.',
            },
            {
              id: '6. Pricing Service',
              desc: 'Calculates estimated and final fares based on distance, duration, and demand surge.',
              local: 'Deterministic pricing model (₹50 base + ₹15/km + surge).',
              prod: 'Dynamic surge pricing engine reading real-time demand-to-supply ratios.',
            },
            {
              id: '7. Payment Service',
              desc: 'Handles payment collection, simulated gateways, transaction references, and idempotency.',
              local: 'Transactional writes to payments table with idempotency keys.',
              prod: 'Stripe/Razorpay/UPI webhook consumer with two-phase commit.',
            },
            {
              id: '8. Notification Service',
              desc: 'Dispatches real-time alerts on driver assignment, arrival, trip start, and receipt generation.',
              local: 'In-memory pub/sub broker forwarding events to WebSocket clients.',
              prod: 'Kafka consumer triggering Firebase Cloud Messaging (FCM) & SMS gateways.',
            },
            {
              id: '9. Analytics Service',
              desc: 'Aggregates fleet utilization, ride completion rates, average fare, and driver ratings.',
              local: 'SQL aggregation endpoints for dashboard charts and metrics.',
              prod: 'ClickHouse / Snowflake data warehouse fed by Kafka event streams.',
            },
          ].map((srv) => (
            <div key={srv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 text-blue-700">{srv.id}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{srv.desc}</p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div>
                  <span className="font-semibold text-emerald-700">Local Implementation: </span>
                  <span className="text-slate-600">{srv.local}</span>
                </div>
                <div>
                  <span className="font-semibold text-indigo-700">Production Evolution: </span>
                  <span className="text-slate-600">{srv.prod}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: REST API CONTRACTS */}
      {activeTab === 'apis' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Round 2 REST API Design Specifications</h2>
            <p className="text-xs text-slate-500">
              Complete catalog of implemented HTTP methods, endpoints, payloads, status codes, and error semantics.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3">Status Code</th>
                  <th className="px-4 py-3">Purpose & Request Payload</th>
                  <th className="px-4 py-3">Error Semantics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  {
                    m: 'POST',
                    url: '/api/rides',
                    code: '201 Created',
                    color: 'bg-emerald-100 text-emerald-800',
                    desc: 'Request a new ride. Input: userId, pickup (lat/lng/address), destination (lat/lng/address).',
                    err: '422 Unprocessable (validation), 404 User not found.',
                  },
                  {
                    m: 'GET',
                    url: '/api/drivers/nearby',
                    code: '200 OK',
                    color: 'bg-blue-100 text-blue-800',
                    desc: 'Find available drivers within radius_km sorted by Haversine distance.',
                    err: '422 Invalid lat/lng coordinates.',
                  },
                  {
                    m: 'POST',
                    url: '/api/rides/{rideId}/accept',
                    code: '200 OK',
                    color: 'bg-emerald-100 text-emerald-800',
                    desc: 'Driver accepts ride. Atomically assigns driver and marks BUSY.',
                    err: '409 Conflict if already taken; 404 Ride or Driver not found.',
                  },
                  {
                    m: 'GET',
                    url: '/api/rides/{rideId}/status',
                    code: '200 OK',
                    color: 'bg-blue-100 text-blue-800',
                    desc: 'Fetches ride status, driver details, fare, and current GPS telemetry.',
                    err: '404 Ride not found.',
                  },
                  {
                    m: 'PATCH',
                    url: '/api/rides/{rideId}/cancel',
                    code: '200 OK',
                    color: 'bg-amber-100 text-amber-800',
                    desc: 'Cancel ride with reason. Releases driver if already assigned.',
                    err: '409 Conflict if ride already IN_PROGRESS or COMPLETED.',
                  },
                  {
                    m: 'POST',
                    url: '/api/rides/{rideId}/start',
                    code: '200 OK',
                    color: 'bg-emerald-100 text-emerald-800',
                    desc: 'Transition ride from ACCEPTED to IN_PROGRESS.',
                    err: '409 Conflict if ride not in ACCEPTED state.',
                  },
                  {
                    m: 'POST',
                    url: '/api/rides/{rideId}/complete',
                    code: '200 OK',
                    color: 'bg-emerald-100 text-emerald-800',
                    desc: 'Transition ride from IN_PROGRESS to COMPLETED. Releases driver to AVAILABLE.',
                    err: '409 Conflict if ride not in IN_PROGRESS state.',
                  },
                  {
                    m: 'PUT',
                    url: '/api/drivers/location',
                    code: '200 OK',
                    color: 'bg-amber-100 text-amber-800',
                    desc: 'Driver updates GPS coordinates (lat, lng) & availability status.',
                    err: '404 Driver not found.',
                  },
                  {
                    m: 'POST',
                    url: '/api/pricing/estimate',
                    code: '200 OK',
                    color: 'bg-emerald-100 text-emerald-800',
                    desc: 'Compute estimated fare, distance (km), duration (mins) based on coordinates.',
                    err: '422 Invalid coordinate range.',
                  },
                  {
                    m: 'POST',
                    url: '/api/payments',
                    code: '201 Created',
                    color: 'bg-emerald-100 text-emerald-800',
                    desc: 'Simulate transactional payment with idempotency key.',
                    err: '404 Ride not found; 409 Duplicate idempotency key.',
                  },
                  {
                    m: 'GET',
                    url: '/api/health',
                    code: '200 OK',
                    color: 'bg-blue-100 text-blue-800',
                    desc: 'Liveness & readiness probe for DB, Redis cache, and Event Broker.',
                    err: '503 Service Unavailable if database is unreachable.',
                  },
                ].map((api, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${api.color}`}>
                        {api.m}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{api.url}</td>
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-emerald-700">{api.code}</td>
                    <td className="px-4 py-3 text-slate-600">{api.desc}</td>
                    <td className="px-4 py-3 text-rose-700 font-medium text-[11px]">{api.err}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE SELECTION & DATA MODEL */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Production vs Local Storage Selection</h2>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-sm">PostgreSQL (Relational Store)</span>
                  <p>
                    Primary source of truth for Users, Drivers, Rides, and Payments. Uses ACID transactions for ride assignment and payment guarantees. Supports row-level locking (`SELECT ... FOR UPDATE`) to eliminate race conditions.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-sm">PostGIS / Redis GEO (Geospatial Store)</span>
                  <p>
                    PostGIS spatial indexes (`GIST`) enable microsecond bounding box and KNN distance queries. Redis GEO (`GEOADD`, `GEOSEARCH`) handles driver coordinates with sub-millisecond in-memory lookups.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-sm">SQLite (Local Demonstration)</span>
                  <p>
                    Ideal for zero-dependency local evaluation and running automated unit tests. Seamlessly runs through SQLAlchemy ORM, ensuring identical schema contracts when swapping to PostgreSQL.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Database Indexes & Transaction Boundaries</h2>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-sm">Indexes Configured</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                    <li><code className="font-mono text-blue-600">idx_rides_status_user</code>: Composite index on (status, user_id)</li>
                    <li><code className="font-mono text-blue-600">idx_drivers_avail_coords</code>: Composite index on (availability_status, lat, lng)</li>
                    <li><code className="font-mono text-blue-600">idx_payments_ride</code>: Foreign key index on payments(ride_id)</li>
                  </ul>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-sm">Concurrency & Double-Booking Guard</span>
                  <p>
                    When a driver accepts a ride:
                    1. Ride state is verified to be REQUESTED.
                    2. Driver is verified to be AVAILABLE.
                    3. Both rows are updated in a single atomic database transaction.
                    4. Any simultaneous attempt returns HTTP 409 Conflict.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CACHING STRATEGY */}
      {activeTab === 'caching' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Redis Caching Architecture & Invalidation Policies</h2>
            <p className="text-xs text-slate-500">
              Low-latency read caching with resilient fallback and event-driven invalidation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Zap className="w-4 h-4 text-amber-500" />
                Cache-Aside Pattern
              </div>
              <p className="text-slate-600 leading-relaxed">
                Ride status queries check Redis first (<code className="font-mono text-blue-600">ride:status:{'{rideId}'}</code>). On cache miss, the service queries SQLite/Postgres and writes back to Redis with a 30-second TTL.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Safe Invalidation Triggers
              </div>
              <p className="text-slate-600 leading-relaxed">
                Cache is immediately evicted on state transitions:
                • Driver acceptance → Evicts ride & driver caches.
                • Driver GPS update → Evicts nearby driver cache.
                • Trip completion/cancellation → Invalidates cached status.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Cpu className="w-4 h-4 text-blue-500" />
                Resilient Memory Fallback
              </div>
              <p className="text-slate-600 leading-relaxed">
                If Redis is offline, the application seamlessly switches to an in-memory TTL dictionary cache without throwing exceptions or degrading REST endpoints.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MESSAGING & EVENT BROKER */}
      {activeTab === 'messaging' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Event-Driven Architecture & Domain Events</h2>
            <p className="text-xs text-slate-500">
              Decoupling microservices via asynchronous event streams.
            </p>
          </div>

          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Event Name</th>
                    <th className="px-4 py-3">Triggering Action</th>
                    <th className="px-4 py-3">Subscribed Handlers</th>
                    <th className="px-4 py-3">Kafka Topic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    { e: 'RideRequested', t: 'POST /api/rides', s: 'LocationService (find drivers), NotificationService (rider alert)', k: 'rides.events.requested' },
                    { e: 'DriverAssigned', t: 'POST /api/rides/{id}/accept', s: 'NotificationService (push to rider), Cache Invalidator', k: 'rides.events.assigned' },
                    { e: 'RideStarted', t: 'POST /api/rides/{id}/start', s: 'TelemetryTracker, WebSocket broadcaster', k: 'rides.events.started' },
                    { e: 'RideCompleted', t: 'POST /api/rides/{id}/complete', s: 'PaymentService, AnalyticsService, DriverService (free driver)', k: 'rides.events.completed' },
                    { e: 'RideCancelled', t: 'PATCH /api/rides/{id}/cancel', s: 'DriverService (release driver), NotificationService', k: 'rides.events.cancelled' },
                    { e: 'PaymentCompleted', t: 'POST /api/payments', s: 'ReceiptGenerator, LedgerService, AnalyticsService', k: 'payments.events.completed' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{row.e}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{row.t}</td>
                      <td className="px-4 py-3 text-slate-700">{row.s}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-emerald-700">{row.k}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: HIGH-TRAFFIC SCALABILITY */}
      {activeTab === 'scalability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: '1. Stateless Horizontal Scaling',
              desc: 'Application services (Ride, Driver, Pricing) maintain zero local session state. Instances scale horizontally behind an ALB based on CPU utilization and request latency.',
            },
            {
              title: '2. City / Geohash Partitioning',
              desc: 'Rides and drivers are geographically partitioned using Geohash or City ID (e.g., Coimbatore: CJB). Prevents global locks and confines spatial searches to regional shards.',
            },
            {
              title: '3. Message Queue Spike Absorption',
              desc: 'Sudden spikes (rain surges, office departures) are queued in Kafka / RabbitMQ. Driver matching workers consume requests smoothly without overloading database connection pools.',
            },
            {
              title: '4. Database Read Replicas & Connection Pooling',
              desc: 'Read operations (ride status, fleet queries) are routed to PostgreSQL read replicas. PgBouncer manages connection pooling to maintain sub-10ms query performance.',
            },
            {
              title: '5. Circuit Breaker & Graceful Degradation',
              desc: 'If external routing or pricing fails, fallback cached estimates and base rates are utilized. Services return HTTP 503 with Retry-After headers rather than cascading failures.',
            },
            {
              title: '6. WebSocket Cluster with Redis Pub/Sub',
              desc: 'Multiple WebSocket gateway nodes synchronize real-time location broadcasts across connected mobile clients using Redis Pub/Sub backplane.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h3 className="font-bold text-sm text-slate-900 text-blue-700">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 8: IMPLEMENTED VS PRODUCTION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Implemented Features vs Proposed Production Architecture</h2>
            <p className="text-xs text-slate-500">
              Clear distinction between working local implementations and enterprise cloud additions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Architectural Component</th>
                  <th className="px-4 py-3">Implemented in Project</th>
                  <th className="px-4 py-3">Proposed Production Roadmap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  {
                    c: 'API Gateway',
                    i: 'FastAPI routing, CORS policy, request logging, and Pydantic validation.',
                    p: 'Kong / Envoy Gateway with distributed Token Bucket rate limiting & mTLS.',
                  },
                  {
                    c: 'Data Persistence',
                    i: 'SQLite with full SQLAlchemy ORM models, indexes, and transactions.',
                    p: 'PostgreSQL cluster with PostGIS extension, connection pooling, and read replicas.',
                  },
                  {
                    c: 'Caching Tier',
                    i: 'Redis connector with automatic resilient in-memory TTL dictionary fallback.',
                    p: 'Redis Enterprise Cluster with Redis GEO spatial indexing.',
                  },
                  {
                    c: 'Event Broker',
                    i: 'Asynchronous domain event broker with multi-handler subscribers.',
                    p: 'Managed Apache Kafka with partitioned event topics & schema registry.',
                  },
                  {
                    c: 'Real-Time Telemetry',
                    i: 'WebSocket endpoint with ping/pong keepalives and coordinate radar.',
                    p: 'Distributed WebSocket gateway cluster backed by Redis Pub/Sub backplane.',
                  },
                  {
                    c: 'Concurrency Protection',
                    i: 'Atomic database transactions returning HTTP 409 Conflict on double assignment.',
                    p: 'Distributed Redlock / Redis locks combined with PostgreSQL row-level locks.',
                  },
                  {
                    c: 'Simulated Payments',
                    i: 'Transactional payments table with idempotency keys and simulated gateway.',
                    p: 'Stripe / Razorpay webhooks with payment state reconciliation worker.',
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.c}</td>
                    <td className="px-4 py-3 text-emerald-800 font-medium">✓ {row.i}</td>
                    <td className="px-4 py-3 text-indigo-700">{row.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
