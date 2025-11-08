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
      <div className="k-card space-y-3">
        <h2 className="text-xl font-semibold text-primary">Operator Rounds</h2>
        <p className="text-slate-600">
          Review CTMT layouts, confirm RHR/RCIC needs, then continue your entry packet.
        </p>
        <button className="k-btn w-full" onClick={() => navigate("/ctmt")}>CTMT Maps</button>
      </div>

      <div className="k-card space-y-2 text-sm text-slate-600">
        <p>Need to make updates?</p>
        <div className="flex gap-3">
          <Link to="/admin" className="k-btn px-4 py-2 text-sm">Admin Dashboard</Link>
          <Link to="/" className="k-btn px-4 py-2 text-sm">Welcome</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
