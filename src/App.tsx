import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/CTMTScroll';
import MapSelect from './pages/MapSelect';
import Finalize from './pages/Finalize';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Acknowledge1 from './pages/Acknowledge1';
import Thanks from './pages/Thanks';
import CTMTScroll from './pages/CTMTScroll';
import RHRScroll from './pages/RHRScroll';

import { useAuth } from './auth/AuthContext';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { loggedIn } = useAuth();
  return loggedIn ? children : <Login />;
}

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-slate-100 min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="font-semibold text-primary">HRA Kiosk</h1>
            <nav className="text-sm flex gap-4">
              <Link to="/" className="k-btn px-4 py-2">Home</Link>
              <Link to="/admin" className="k-btn px-4 py-2">Admin</Link>
            </nav>
          </div>
        </header>

        {/* Routed content */}
        <main className="py-6">
          <Routes>
            {/* Flow */}
            <Route path="/" element={<Welcome />} />
            <Route path="/ack" element={<Acknowledge1 />} />
            <Route path="/areas" element={<Home />} />
            <Route path="/ctmt" element={<CTMTScroll />} />
            <Route path="/rhr" element={<RHRScroll />} />

            <Route path="/map/:areaId" element={<MapSelect />} />
            <Route path="/final/:areaId" element={<Finalize />} />
            <Route path="/thanks" element={<Thanks />} />

            {/* Admin (protected) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Public login (if needed) */}
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
