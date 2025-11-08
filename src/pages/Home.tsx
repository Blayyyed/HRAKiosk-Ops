import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

    </div>
  );
};

export default Home;
