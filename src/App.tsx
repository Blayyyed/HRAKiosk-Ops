import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Acknowledge from "./pages/Acknowledge1";
import Home from "./pages/Home";
import CTMTScroll from "./pages/CTMTScroll";
import RHRScroll from "./pages/RHRScroll";
import MapSelect from "./pages/MapSelect";
import Finalize from "./pages/Finalize";
import Thanks from "./pages/Thanks";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import { useAuth } from "./auth/AuthContext";
import { OperatorProvider } from "./contexts/OperatorContext";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { loggedIn } = useAuth();
  return loggedIn ? children : <Login />;
}

const AppShell: React.FC = () => {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <Router>
      <div className="bg-slate-100 min-h-screen">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="font-semibold text-primary">HRA Kiosk</h1>
            <div className="flex items-center gap-4">
              <nav className="text-sm flex gap-4">
                <Link to="/home" className="k-btn px-4 py-2">
                  Home
                </Link>
                <Link to="/admin" className="k-btn px-4 py-2">
                  Admin
                </Link>
              </nav>
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {online ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </header>

        <main className="py-6">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/ack" element={<Acknowledge />} />
            <Route path="/home" element={<Home />} />
            <Route path="/ctmt" element={<CTMTScroll />} />
            <Route path="/rhr" element={<RHRScroll />} />
            <Route path="/map/:areaId" element={<MapSelect />} />
            <Route path="/finalize" element={<Finalize />} />
            <Route path="/thanks" element={<Thanks />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const App: React.FC = () => (
  <OperatorProvider>
    <AppShell />
  </OperatorProvider>
);

export default App;
