import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-primary mb-4">Welcome to the HRA Kiosk</h1>
        <div className="k-card space-y-4">
          <p className="text-slate-700">
            This kiosk guides you through <strong>High Radiation Area (HRA)</strong> entry in a clear, repeatable way. 
            It standardizes the steps before your HRA brief so you can focus on the critical details relayed from RP.
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>This is a pilot program aimed to limit the time needed for interacting with RP.</li>
            <li>This is currently only for Ops Rounds</li>
            <li>Acknowedge you understand the requirements to enter a High Radiation Area</li>
            <li>RP can be contacted via x2169 or in person to let them know you have completed your entry requirements and they will verify you are on the correct RWP then make a Narrative Log Entry</li>
          </ul>
          <div className="pt-2">
            {/* ✅ Continue goes to /ack */}
            <button className="k-btn" onClick={() => nav('/ack')}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;