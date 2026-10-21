export type QualityPreset = '1080p' | '720p';

export interface VideoMetadata {
  file: File;
  name: string;
  sizeMb: number;
  durationSeconds: number;
  previewUrl: string;
  width?: number;
  height?: number;
}

export interface OptimizerSettings {
  autoSplit30s: boolean;
  quality: QualityPreset;
  muteAudio: boolean;
}

export interface TranscodeClipResult {
  index: number;
  blob: Blob;
  downloadUrl: string;
  filename: string;
  startTime: number;
  endTime: number;
  duration: number;
  sizeMb: number;
}

export type ProcessingStage = 
  | 'idle'
  | 'loading-wasm'
  | 'analyzing'
  | 'transcoding'
  | 'splitting'
  | 'completed'
  | 'error';

