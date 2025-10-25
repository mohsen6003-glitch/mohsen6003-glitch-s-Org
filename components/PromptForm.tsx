
import React, { useState, useEffect } from 'react';
import type { AspectRatio } from '../types';

interface PromptFormProps {
  initialPrompt: string;
  isLoading: boolean;
  onSubmit: (prompt: string, aspectRatio: AspectRatio) => void;
  setPrompt: (prompt: string) => void;
}

export const PromptForm: React.FC<PromptFormProps> = ({ initialPrompt, isLoading, onSubmit, setPrompt }) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt, setPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(initialPrompt, aspectRatio);
  };
  
  const aspectRatios: AspectRatio[] = ["9:16", "16:9", "1:1", "4:3", "3:4"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sticky top-4 z-10 bg-dark-bg/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
      <div className="flex flex-col md:flex-row gap-4">
        <textarea
          value={initialPrompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'rainy cyberpunk lo-fi street scene'"
          className="w-full flex-grow bg-light-bg border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-brand-purple focus:outline-none transition duration-200 text-light-text placeholder-medium-text resize-none"
          rows={2}
          disabled={isLoading}
        />
        <div className="flex flex-col sm:flex-row gap-4 md:gap-2">
            <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="bg-light-bg border border-gray-600 rounded-lg p-3 h-full focus:ring-2 focus:ring-brand-purple focus:outline-none transition duration-200 text-light-text"
                disabled={isLoading}
            >
                {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
            </select>
            <button
                type="submit"
                disabled={isLoading || !initialPrompt}
                className="w-full h-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center"
            >
                {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </>
                ) : 'Generate'}
            </button>
        </div>
      </div>
    </form>
  );
};
