import React from 'react';
import { useNavigate } from 'react-router-dom';

const Acknowledge: React.FC = () => {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="k-title mb-4 text-primary">HRA Entry Acknowledgement</h1>

        <div className="k-card space-y-4">
          <p className="text-slate-700">
            Before entering a High Radiation Area, I acknowledge:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-slate-800">
            <li>Workers must be logged onto an RWP that allows access to the area.</li>
            <li>Workers must be briefed and knowledgeable of radiological conditions in the work area and travel path.</li>
            <li>Workers must know their dose estimate. Document expected dose on trip ticket. </li>
            <li>Workers must only enter areas they have been briefed on.</li>
            <li>Entry into High Radiation Areas is controlled by Technical Specifications. Failure to comply with these requirements can result in additional worker dose and NRC violations. Personnel are authorized to enter ONLY area(s) briefed on.</li>
            <li>I understand this alone does not allow access to a HRA without contacting RP to verify I am on the correct RWP and no changes.</li>
          </ol>

          <div className="pt-4">
            <button className="k-btn" onClick={() => nav('/areas')}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Acknowledge;