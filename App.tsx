
import React, { useState, useCallback, useEffect } from 'react';
import { PromptForm } from './components/PromptForm';
import { ImageGrid } from './components/ImageGrid';
import { FullScreenView } from './components/FullScreenView';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { IntroMessage } from './components/IntroMessage';
import { ModeSelector } from './components/ModeSelector';
import { generateWallpapers, editImage, generateVideo } from './services/geminiService';
import type { GeneratedImage, AspectRatio, Mode, VideoAspectRatio } from './types';

const App: React.FC = () => {
  // Global state
  const [mode, setMode] = useState<Mode>('generate');

  // Generate Mode State
  const [prompt, setPrompt] = useState<string>('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [lastSuccessfulPrompt, setLastSuccessfulPrompt] = useState<string>('');

  // Edit Mode State
  const [imageToEdit, setImageToEdit] = useState<GeneratedImage | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editedImage, setEditedImage] = useState<GeneratedImage | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Video Mode State
  const [imageForVideo, setImageForVideo] = useState<GeneratedImage | null>(null);
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('9:16');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean>(true);

  useEffect(() => {
    if (mode === 'video') {
      window.aistudio.hasSelectedApiKey().then(setIsApiKeySelected);
    }
  }, [mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setImage: (img: GeneratedImage) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({
          id: file.name,
          base64: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- GENERATE LOGIC ---
  const handleGenerate = useCallback(async (currentPrompt: string, aspectRatio: AspectRatio) => {
    if (!currentPrompt || isLoading) return;
    setIsLoading(true);
    setError(null);
    setImages([]);
    try {
      const base64Images = await generateWallpapers(currentPrompt, aspectRatio);
      setImages(base64Images.map((base64, index) => ({
        id: `${Date.now()}-${index}`,
        base64: `data:image/jpeg;base64,${base64}`,
      })));
      setLastSuccessfulPrompt(currentPrompt);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // --- EDIT LOGIC ---
  const handleEdit = async () => {
    if (!imageToEdit || !editPrompt || isEditing) return;
    setIsEditing(true);
    setEditError(null);
    setEditedImage(null);
    try {
      const { base64, mimeType } = await base64ToParts(imageToEdit.base64);
      const resultBase64 = await editImage(base64, mimeType, editPrompt);
      setEditedImage({ id: `edit-${Date.now()}`, base64: `data:${mimeType};base64,${resultBase64}` });
    } catch (err) {
      console.error(err);
      setEditError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsEditing(false);
    }
  };

  // --- VIDEO LOGIC ---
  const handleGenerateVideo = async () => {
    if (!imageForVideo || !videoPrompt || isGeneratingVideo) return;

    // API Key Check for Veo
    if (!isApiKeySelected) {
      try {
        await window.aistudio.openSelectKey();
        setIsApiKeySelected(true); // Assume success to avoid race condition
      } catch (e) {
        setVideoError("You must select an API key to generate videos.");
        return;
      }
    }

    setIsGeneratingVideo(true);
    setVideoError(null);
    setGeneratedVideoUrl(null);
    try {
      const { base64, mimeType } = await base64ToParts(imageForVideo.base64);
      const videoUri = await generateVideo(base64, mimeType, videoPrompt, videoAspectRatio, setVideoStatus);
      
      setVideoStatus('Fetching video...');
      const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch the generated video.');
      const videoBlob = await response.blob();
      setGeneratedVideoUrl(URL.createObjectURL(videoBlob));

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage === "API_KEY_INVALID") {
          setVideoError("API Key is invalid. Please select a valid key to continue.");
          setIsApiKeySelected(false);
      } else {
          setVideoError(errorMessage);
      }
    } finally {
      setIsGeneratingVideo(false);
      setVideoStatus('');
    }
  };

  const handleSelectImage = (image: GeneratedImage) => setSelectedImage(image);
  const handleCloseFullScreen = () => setSelectedImage(null);
  
  const handleRemix = useCallback(() => {
    setPrompt(lastSuccessfulPrompt);
    setSelectedImage(null);
    setMode('generate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lastSuccessfulPrompt]);

  const handleStartEdit = useCallback((image: GeneratedImage) => {
    setImageToEdit(image);
    setEditedImage(null);
    setEditPrompt('');
    setSelectedImage(null);
    setMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDownload = useCallback((base64: string, extension = 'jpeg') => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `vibe-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);
  
  const base64ToParts = async (base64String: string): Promise<{ base64: string, mimeType: string }> => {
    const response = await fetch(base64String);
    const blob = await response.blob();
    const mimeType = blob.type;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  };

  const commonFileUploader = (image: GeneratedImage | null, onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean) => (
      <div className="w-full aspect-video bg-light-bg rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center relative overflow-hidden">
        {image ? (
          <img src={image.base64} alt="Upload preview" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-medium-text">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="mt-2">Upload an image</p>
          </div>
        )}
        <input type="file" accept="image/*" capture="environment" onChange={onFileChange} disabled={disabled} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
  );

  // FIX: Added explicit types for the ActionButton component's props to resolve TypeScript errors.
  const ActionButton = ({ onClick, disabled, children, isLoading = false, loadingText = "Generating..." }: {
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {loadingText}
        </>
      ) : children}
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <Header />
        <ModeSelector currentMode={mode} setMode={setMode} />
        
        <main className="mt-8">
          {mode === 'generate' && (
            <>
              <PromptForm 
                initialPrompt={prompt} 
                isLoading={isLoading} 
                onSubmit={handleGenerate} 
                setPrompt={setPrompt}
              />
              {error && <div className="mt-8 text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg"><p>{error}</p></div>}
              <div className="mt-8">
                {isLoading ? <Spinner message="Generating your vibe..." /> : images.length > 0 ? <ImageGrid images={images} onImageClick={handleSelectImage} /> : <IntroMessage />}
              </div>
            </>
          )}

          {mode === 'edit' && (
             <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {commonFileUploader(imageToEdit, (e) => handleFileChange(e, setImageToEdit), isEditing)}
                  <div className="w-full aspect-video bg-light-bg rounded-lg border-2 border-gray-700 flex items-center justify-center relative">
                    {isEditing ? <Spinner message="Applying edits..."/> : editedImage ? <img src={editedImage.base64} alt="Edited result" className="w-full h-full object-contain"/> : <p className="text-medium-text">Your edited image will appear here</p>}
                  </div>
               </div>
                {/* FIX: Added the missing 'disabled' prop. */}
                {editedImage && <ActionButton onClick={() => handleDownload(editedImage.base64, 'png')} disabled={false}>Download Edited Image</ActionButton>}
               <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g., 'Add a retro filter', 'Make it black and white'" className="w-full bg-light-bg border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-brand-purple focus:outline-none transition duration-200 text-light-text placeholder-medium-text resize-none" rows={2} disabled={isEditing} />
               <ActionButton onClick={handleEdit} disabled={!imageToEdit || !editPrompt} isLoading={isEditing} loadingText="Applying...">Edit Image</ActionButton>
               {editError && <div className="mt-4 text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg"><p>{editError}</p></div>}
             </div>
          )}

          {mode === 'video' && (
              <div className="space-y-4">
                {commonFileUploader(imageForVideo, (e) => handleFileChange(e, setImageForVideo), isGeneratingVideo)}
                {isGeneratingVideo ? <Spinner message={videoStatus} subMessage="This can take several minutes. Please stay on this page." /> : generatedVideoUrl ? (
                  <div>
                    <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-lg bg-black"></video>
                    <ActionButton onClick={() => handleDownload(generatedVideoUrl, 'mp4')} disabled={false} isLoading={false}>Download Video</ActionButton>
                  </div>
                ) : <div className="text-center p-4 text-medium-text">Your generated video will appear here.</div>}
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} placeholder="e.g., 'A cinematic zoom out, revealing a bustling city'" className="w-full flex-grow bg-light-bg border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-brand-purple focus:outline-none transition" rows={2} disabled={isGeneratingVideo} />
                    <select value={videoAspectRatio} onChange={(e) => setVideoAspectRatio(e.target.value as VideoAspectRatio)} className="bg-light-bg border border-gray-600 rounded-lg p-3 h-full focus:ring-2 focus:ring-brand-purple" disabled={isGeneratingVideo}>
                        <option value="9:16">9:16 (Portrait)</option>
                        <option value="16:9">16:9 (Landscape)</option>
                    </select>
                </div>
                 {!isApiKeySelected && (
                    <div className="p-4 bg-yellow-900/50 border border-yellow-500 text-yellow-200 rounded-lg text-center space-y-2">
                        <p>Video generation requires a Google AI Studio API key.</p>
                        <p className="text-sm">More information about billing can be found on the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Google AI billing documentation page</a>.</p>
                        <button onClick={() => window.aistudio.openSelectKey()} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded">Select API Key</button>
                    </div>
                )}
                <ActionButton onClick={handleGenerateVideo} disabled={!imageForVideo || !videoPrompt || !isApiKeySelected} isLoading={isGeneratingVideo} loadingText="Generating...">Generate Video</ActionButton>
                {videoError && <div className="mt-4 text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg"><p>{videoError}</p></div>}
              </div>
          )}
        </main>
      </div>

      {selectedImage && (
        <FullScreenView
          image={selectedImage}
          onClose={handleCloseFullScreen}
          onDownload={handleDownload}
          onRemix={handleRemix}
          onEdit={handleStartEdit}
        />
      )}
    </div>
  );
};

export default App;