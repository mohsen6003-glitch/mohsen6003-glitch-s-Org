
import { GoogleGenAI, Modality } from "@google/genai";
import type { AspectRatio, VideoAspectRatio } from '../types';

export const generateWallpapers = async (prompt: string, aspectRatio: AspectRatio): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `phone wallpaper, ${prompt}, high-resolution, cinematic, detailed`,
        config: {
          numberOfImages: 4,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("No images were generated. The prompt may have been blocked.");
    }
    
    return response.generatedImages.map(img => img.image.imageBytes);

  } catch (error) {
    console.error('Error calling Gemini API for image generation:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate images: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating images.');
  }
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = { inlineData: { data: base64Image, mimeType: mimeType } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const resultPart = response.candidates?.[0]?.content?.parts?.[0];
        if (resultPart && resultPart.inlineData) {
            return resultPart.inlineData.data;
        }
        throw new Error("Image editing failed or returned no image. The prompt may have been blocked.");
    } catch (error) {
        console.error('Error calling Gemini API for image editing:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to edit image: ${error.message}`);
        }
        throw new Error('An unknown error occurred while editing the image.');
    }
};

export const generateVideo = async (
    base64Image: string,
    mimeType: string,
    prompt: string,
    aspectRatio: VideoAspectRatio,
    onStatusUpdate: (status: string) => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    // Re-create instance to use the latest key from the selection dialog
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    onStatusUpdate("Starting video generation...");
    let operation;
    try {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: { imageBytes: base64Image, mimeType: mimeType },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });
    } catch (e) {
        console.error("Error initiating video generation:", e);
        if (e instanceof Error && e.message.includes("API key not valid")) {
             throw new Error("API_KEY_INVALID");
        }
        throw e;
    }

    onStatusUpdate("Processing your video... This may take a few minutes.");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
            operation = await ai.operations.getVideosOperation({ operation });
        } catch (e) {
            console.error("Polling error during video generation:", e);
            if (e instanceof Error && e.message.includes("Requested entity was not found.")) {
                throw new Error("API_KEY_INVALID");
            }
            // For other polling errors, we can let it continue or fail fast.
            // For now, we'll let it retry.
        }
    }

    onStatusUpdate("Finalizing video...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        console.error("Video generation operation:", operation);
        throw new Error("Video generation succeeded, but no download link was found.");
    }

    return downloadLink;
};
