
export interface GeneratedImage {
  id: string;
  base64: string;
}

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:3" | "3:4";

export type VideoAspectRatio = "16:9" | "9:16";

export type Mode = 'generate' | 'edit' | 'video';
