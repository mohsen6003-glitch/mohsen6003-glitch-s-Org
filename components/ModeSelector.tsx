
import React from 'react';
import type { Mode } from '../types';

interface ModeSelectorProps {
  currentMode: Mode;
  setMode: (mode: Mode) => void;
}

const modes: { id: Mode; label: string }[] = [
  { id: 'generate', label: 'Generate' },
  { id: 'edit', label: 'Edit' },
  { id: 'video', label: 'Video' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode }) => {
  return (
    <div className="flex justify-center mt-8 bg-light-bg p-1 rounded-full border border-gray-700">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setMode(mode.id)}
          className={`px-4 sm:px-8 py-2 text-sm sm:text-base font-semibold rounded-full transition-colors duration-300 ${
            currentMode === mode.id
              ? 'bg-brand-purple text-white'
              : 'text-medium-text hover:text-light-text'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};
