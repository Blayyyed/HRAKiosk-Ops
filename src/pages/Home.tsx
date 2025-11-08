// src/pages/Home.tsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOperatorFlow } from "../contexts/OperatorContext";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { acks } = useOperatorFlow();

  useEffect(() => {
    if (!acks) {
      navigate("/ack", { replace: true });
    }
  }, [acks, navigate]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-primary">HRA Kiosk</h1>
        <p className="text-slate-600">
          Review CTMT layouts, confirm RHR/RCIC needs, and finish the crew packet.
        </p>
      </header>

      <section className="k-card space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">Operator Rounds</h2>
        <p className="text-sm text-slate-600">
          Start with the CTMT scroll to review each elevation, mark map updates, and capture
          the crew&apos;s access needs.
        </p>
        <button className="k-btn w-full" onClick={() => navigate("/ctmt")}>CTMT Maps</button>
      </section>

      <section className="k-card space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">RHR / RCIC Gallery</h2>
        <p className="text-sm text-slate-600">
          If additional access is required, continue to the RHR view to select the proper map
          before finalizing the entry packet.
        </p>
        <button className="k-btn w-full" onClick={() => navigate("/rhr")}>RHR / RCIC Maps</button>
      </section>

      <footer className="flex justify-between text-sm text-slate-600">
        <span>Need to manage maps or the queue?</span>
        <Link to="/admin" className="text-blue-600 hover:underline">
          Open Admin
        </Link>
      </footer>
    </div>
  );
};

export default Home;
