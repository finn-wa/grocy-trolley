// Code generated by jtd-codegen for TypeScript v0.2.1

export interface ProductSearchResponseHit {
  brand: string | null;
  id: number;
  name: string;
  size: string | null;
  unit: "ea" | "kg";
}

export interface ProductSearchResponse {
  exhaustiveNbHits: boolean;
  hits: ProductSearchResponseHit[];
  limit: number;
  nbHits: number;
  offset: number;
  processingTimeMs: number;
  query: string;
}