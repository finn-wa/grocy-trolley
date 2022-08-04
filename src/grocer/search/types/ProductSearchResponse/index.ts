export interface ProductSearchResponseHit {
  brand: string | null;
  id: number;
  name: string;
  popularity: number;
  size: string | null;
  stores: number[];
  unit: "ea" | "kg";
  /**
   * Category breadcrumbs as a matrix to be read vertically, e.g.
   * ```json
   * "category_1": ["Personal Care", "Hair Care"],
   * "category_2": ["Beauty & Grooming", "Shampoo"],
   * "category_3": ["Hair Care & Treatments"],
   * ```
   * - element 0 from each array is Foodstuffs category:
   *   > _Personal Care -> Beauty & Grooming -> Hair Care & Treatments_
   * - element 1 from each array is Countdown category:
   *   > _Hair Care -> Shampoo_
   * - Sometimes there's another entry for alternative categories that lead to the same product.
   */
  category_1: string[];
  /** See category_1 for explanation */
  category_2: string[];
  /** See category_1 for explanation */
  category_3: string[];
}

export interface ProductSearchResponse {
  estimatedTotalHits: number;
  hits: ProductSearchResponseHit[];
  limit: number;
  offset: number;
  processingTimeMs: number;
  query: string;
}
