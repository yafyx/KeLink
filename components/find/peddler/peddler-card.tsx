"use client";

import React from "react";

// Minimal Peddler type for props - replace with actual import if available
export interface Peddler {
  id: string;
  name: string;
  type?: string;
  description?: string;
  // Add other relevant fields if needed for the card display
}

interface PeddlerCardProps {
  peddler: Peddler | undefined | null;
  onClose: () => void;
  onGetDirections: () => void;
}

const PeddlerCard: React.FC<PeddlerCardProps> = ({
  peddler,
  onClose,
  onGetDirections,
}) => {
  if (!peddler) {
    return null;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">{peddler.name}</h3>
      {peddler.type && (
        <p className="text-sm text-gray-600">Type: {peddler.type}</p>
      )}
      {peddler.description && (
        <p className="text-sm mt-1">{peddler.description}</p>
      )}
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={onGetDirections}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Get Directions
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PeddlerCard;
