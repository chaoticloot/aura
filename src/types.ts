export interface ArtPiece {
  id: string | number;
  title: string;
  artist: string;
  date: string;
  imageUrl: string;
  imageUrlSmall: string;
  museum: string;
  description?: string;
  dimensions?: string;
  medium?: string;
  rights: string;
  attribution?: string;
  objectUrl: string;
  details?: any; // Original object if needed
}

export interface Artwork {
  // Keeping original Met interface for compatibility during transition
  objectID: number;
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  // ... other existing fields
  title: string;
  artistDisplayName: string;
  objectDate: string;
  department: string;
  medium: string;
  dimensions: string;
  objectURL: string;
  artistDisplayBio: string;
}

export interface SearchResponse {
  total: number;
  objectIDs: number[] | null;
}
