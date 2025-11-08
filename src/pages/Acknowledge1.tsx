import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOperatorFlow } from "../contexts/OperatorContext";

const Acknowledge: React.FC = () => {
  const navigate = useNavigate();
  const { setAcks } = useOperatorFlow();
  const [checks, setChecks] = useState({
    rwp: false,
    briefed: false,
    dose: false,
    onlyAreasBriefed: false,
  });

  const allChecked = useMemo(
    () => Object.values(checks).every(Boolean),
    [checks]
  );

  const toggle = (field: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const onContinue = () => {
    if (!allChecked) {
      return;
    }
    setAcks(checks);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="k-title mb-4 text-primary">HRA Entry Acknowledgement</h1>

        <div className="k-card space-y-4">
          <p className="text-slate-700">
            Before entering a High Radiation Area, I acknowledge:
          </p>
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={checks.rwp}
                onChange={() => toggle("rwp")}
              />
              <span>
                Workers must be logged onto an RWP that allows access to the area.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={checks.briefed}
                onChange={() => toggle("briefed")}
              />
              <span>
                Workers must be briefed and knowledgeable of radiological conditions in the work area and travel path.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={checks.dose}
                onChange={() => toggle("dose")}
              />
              <span>
                Workers must know their dose estimate. Document expected dose on the trip ticket.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={checks.onlyAreasBriefed}
                onChange={() => toggle("onlyAreasBriefed")}
              />
              <span>Workers must only enter areas they have been briefed on.</span>
            </label>
          </div>

          <div className="pt-4">
            <button
              className={`k-btn ${!allChecked ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={!allChecked}
              onClick={onContinue}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Acknowledge;
