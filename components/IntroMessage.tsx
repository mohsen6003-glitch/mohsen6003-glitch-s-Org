
import React from 'react';

export const IntroMessage: React.FC = () => (
  <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-lg">
    <h2 className="text-2xl font-bold text-light-text">Welcome to VibeWallpapers AI</h2>
    <p className="mt-2 text-medium-text">
      Describe any vibe, scene, or idea in the box above to generate your custom wallpaper.
    </p>
    <div className="mt-6 space-y-2 text-left max-w-md mx-auto text-medium-text text-sm">
        <p><span className="font-semibold text-light-text">Try prompts like:</span></p>
        <ul className="list-disc list-inside space-y-1">
            <li>"A serene Japanese garden in the mist"</li>
            <li>"Bioluminescent mushrooms in a fantasy forest"</li>
            <li>"A cozy, cluttered artist's studio at sunset"</li>
            <li>"Minimalist pastel abstract shapes"</li>
        </ul>
    </div>
  </div>
);
