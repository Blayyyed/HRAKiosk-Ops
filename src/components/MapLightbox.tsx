import React from "react";

type MapLightboxProps = {
  open: boolean;
  title: string;
  imageSrc: string;
  onClose: () => void;
};

const MapLightbox: React.FC<MapLightboxProps> = ({ open, title, imageSrc, onClose }) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} map preview`}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            className="k-btn px-3 py-1"
            onClick={onClose}
            aria-label="Close map preview"
          >
            Close
          </button>
        </div>
        <div className="bg-slate-100 p-4 overflow-auto">
          <img
            src={imageSrc}
            alt={`${title} enlarged map`}
            className="w-full h-auto rounded-md border"
          />
        </div>
      </div>
    </div>
  );
};

export default MapLightbox;
