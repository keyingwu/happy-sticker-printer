export interface StickerState {
  imageUrl: string | null;
  loading: boolean;
  prompt: string;
  error: string | null;
}

export interface PlacedSticker {
  id: string;
  url: string;
  prompt: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface DragItem {
  type: 'fresh' | 'placed';
  id?: string; // if placed
  startX: number;
  startY: number;
  initialItemX: number;
  initialItemY: number;
}
