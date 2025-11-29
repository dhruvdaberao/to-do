
export interface StickerDefinition {
  id: string;
  src: string;
  label: string;
}

// Default list is empty. Stickers will be populated by user uploads.
export const AVAILABLE_STICKERS: StickerDefinition[] = [];
