import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOperatorFlow } from "../contexts/OperatorContext";
import BadgeInput, { BadgeValue } from "../components/BadgeInput";

const Acknowledge: React.FC = () => {
  const navigate = useNavigate();
  const { setAcks, setCrew, crew } = useOperatorFlow();
  const [checks, setChecks] = useState({
    rwp: false,
    briefed: false,
    dose: false,
    onlyAreasBriefed: false,
  });
  const [workRequest, setWorkRequest] = useState(crew?.workRequest ?? "");
  const [badges, setBadges] = useState<BadgeValue[]>([]);

  useEffect(() => {
    if (crew) {
      setWorkRequest((prev) => (prev.length > 0 ? prev : crew.workRequest));
      if (badges.length === 0 && crew.badges.length > 0) {
        setBadges(
          crew.badges.map((badge, index) => ({
            value: badge,
            isLead: crew.leadBadge ? crew.leadBadge === badge : index === 0,
          }))
        );
      }
    }
  }, [crew, badges.length]);

  const allChecked = useMemo(
    () => Object.values(checks).every(Boolean),
    [checks]
  );

  const hasWorkRequest = workRequest.trim().length > 0;
  const hasBadges = badges.length > 0;
  const canContinue = allChecked && hasWorkRequest && hasBadges;

  const toggle = (field: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const onContinue = () => {
    if (!canContinue) {
      return;
    }
    setAcks(checks);
    const lead = badges.find((badge) => badge.isLead) ?? badges[0];
    setCrew({
      workRequest: workRequest.trim(),
      badges: badges.map((badge) => badge.value),
      leadBadge: lead?.value,
    });
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

          <div className="border-t pt-4 space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="workRequest">
                Work Request #
              </label>
              <p className="text-xs text-slate-500">
                Required before continuing. Provide the work request identifier for this crew.
              </p>
            </div>
            <input
              id="workRequest"
              className="border rounded px-3 py-2 w-full"
              value={workRequest}
              onChange={(event) => setWorkRequest(event.target.value)}
              placeholder="Enter Work Request"
            />

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-700">Crew badges</div>
                <p className="text-xs text-slate-500">
                  Enter each badge number and press Add. Mark one badge as the crew lead.
                </p>
              </div>
              <BadgeInput badges={badges} onChange={setBadges} />
            </div>
          </div>

          <div className="pt-4">
            <button
              className={`k-btn ${!canContinue ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={!canContinue}
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
