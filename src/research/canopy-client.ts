/**
 * A typed client for the Canopy Amazon data API.
 *
 * The field names here are not guesses. They were read from Canopy's own
 * open-source MCP server (`canopy-api/canopy-api-mcp`, `src/types/api.d.ts`),
 * which is generated against the live API and therefore names the fields the
 * service actually returns. See docs/CANOPY_ACCESS_FINDINGS.md.
 *
 * Every request goes through MeteredApiBudget.spend(). There is no other door:
 * a test scans this directory and fails if any file makes a network call
 * without one.
 */

import { MeteredApiBudget } from './metered-api-budget.ts';

const API_BASE_URL = 'https://rest.canopyapi.co';

/** The provider says the allowance is gone. Never retried — retrying costs money. */
export class CanopyPaymentRequired extends Error {
  constructor() {
    super(
      'Canopy returned 402 Payment Required: the request allowance is exhausted. ' +
        'This is a terminal stop, not a transient error.',
    );
    this.name = 'CanopyPaymentRequired';
  }
}

export class CanopyRequestFailed extends Error {
  readonly status: number;
  constructor(status: number, body: string) {
    super(`Canopy request failed: HTTP ${status}. ${body.slice(0, 300)}`);
    this.name = 'CanopyRequestFailed';
    this.status = status;
  }
}

export interface CanopyPrice {
  symbol: string;
  value: number;
  currency: string;
  display: string;
}

export interface BestSellerResult {
  title?: string;
  url?: string;
  asin?: string;
  price?: CanopyPrice;
  mainImageUrl?: string;
  rating?: number;
  ratingsTotal?: number;
  bestSellersRank?: number;
}

export interface CategoryRef {
  name?: string;
  url?: string;
  id?: string;
}

export interface BestSellersResponse {
  data: {
    amazonBestSellers: {
      productResults?: {
        results?: BestSellerResult[];
        pageInfo?: {
          currentPage?: number;
          totalPages?: number;
          totalResults?: number;
          hasNextPage?: boolean;
        };
      };
      categoryInfo?: {
        currentCategory?: CategoryRef;
        parentCategory?: CategoryRef;
        /** The reason a taxonomy walk costs one request per node, not per product. */
        childCategories?: CategoryRef[];
      };
    };
  };
}

export interface BestSellerCategoriesResponse {
  data: {
    amazonBestSellerCategories: {
      categories: { id: string | null; name: string | null; url: string | null }[];
    };
  };
}

/**
 * The category endpoint reaches subcategories, which the bestsellers endpoint
 * does not — but it carries no rank. What it does carry, and bestsellers does
 * not, is totalResults: how many products are in the category at all.
 */
export interface CategoryResponse {
  data: {
    amazonProductCategory: {
      id?: string;
      name?: string;
      breadcrumbPath?: string;
      subcategories?: { id?: string; name?: string; breadcrumbPath?: string }[];
      productResults?: {
        results?: {
          title?: string;
          asin?: string;
          price?: CanopyPrice;
          rating?: number;
          ratingsTotal?: number;
          sponsored?: boolean;
        }[];
        pageInfo?: { currentPage?: number; totalPages?: number; totalResults?: number };
      };
    };
  };
}

export type CategorySort =
  | 'FEATURED'
  | 'MOST_RECENT'
  | 'PRICE_ASCENDING'
  | 'PRICE_DESCENDING'
  | 'AVERAGE_CUSTOMER_REVIEW';

export interface SearchResponse {
  data: {
    amazonProductSearchResults: {
      productResults?: {
        results?: {
          title?: string;
          asin?: string;
          price?: CanopyPrice;
          rating?: number;
          ratingsTotal?: number;
          isPrime?: boolean;
          sponsored?: boolean;
        }[];
        pageInfo?: {
          currentPage?: number;
          totalPages?: number;
          /** The load-bearing field for a competition screen. Verify it is populated. */
          totalResults?: number;
        };
      };
    };
  };
}

export interface SalesEstimateResponse {
  data: {
    amazonProduct: {
      salesEstimate?: {
        weeklyUnitSales?: number;
        monthlyUnitSales?: number;
        annualUnitSales?: number;
      };
    };
  };
}

export class CanopyClient {
  private readonly apiKey: string;
  private readonly budget: MeteredApiBudget;

  constructor(options: { apiKey: string; budget: MeteredApiBudget }) {
    if (!options.apiKey) throw new Error('Canopy client requires an API key.');
    this.apiKey = options.apiKey;
    this.budget = options.budget;
  }

  private async get<T>(path: string, query: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }
    // The counter increments inside spend() BEFORE the request leaves, so a
    // timeout or a provider-side retry still consumes budget.
    return this.budget.spend(async () => {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'API-KEY': this.apiKey, 'Content-Type': 'application/json' },
      });
      if (response.status === 402) throw new CanopyPaymentRequired();
      if (!response.ok) throw new CanopyRequestFailed(response.status, await response.text());
      return (await response.json()) as T;
    });
  }

  /** One request. Seeds a taxonomy walk with the top-level bestseller category ids. */
  bestSellerCategories(domain = 'US'): Promise<BestSellerCategoriesResponse> {
    return this.get<BestSellerCategoriesResponse>('/api/amazon/bestseller-categories', { domain });
  }

  /**
   * One request returns up to ~50 ranked products AND the child categories
   * beneath this node, which is what makes a breadth-first screen affordable.
   */
  bestSellers(options: {
    categoryId?: string;
    url?: string;
    domain?: string;
    page?: number;
    limit?: number;
  }): Promise<BestSellersResponse> {
    if (!options.categoryId && !options.url) {
      throw new Error('bestSellers requires either a categoryId or a url.');
    }
    return this.get<BestSellersResponse>('/api/amazon/bestsellers', {
      categoryId: options.categoryId,
      url: options.url,
      domain: options.domain ?? 'US',
      page: options.page,
      limit: options.limit,
    });
  }

  /**
   * How many titles compete for a term, and what the visible ones look like.
   * Unlike the category endpoint, this one declares totalResults in a position
   * where it plausibly means something — which is a claim to be tested, not
   * assumed. See EXPERIMENTAL_PROTOCOL.md §19.
   */
  search(options: {
    searchTerm: string;
    categoryId?: string;
    domain?: string;
    page?: number;
    limit?: number;
    sort?: CategorySort;
  }): Promise<SearchResponse> {
    return this.get<SearchResponse>('/api/amazon/search', {
      searchTerm: options.searchTerm,
      categoryId: options.categoryId,
      domain: options.domain ?? 'US',
      page: options.page,
      limit: options.limit,
      sort: options.sort,
    });
  }

  /**
   * The only route into a subcategory. Returns the subcategory tree, a page of
   * products with their rating counts, and the size of the field.
   */
  category(options: {
    categoryId: string;
    domain?: string;
    page?: number;
    sort?: CategorySort;
  }): Promise<CategoryResponse> {
    return this.get<CategoryResponse>('/api/amazon/category', {
      categoryId: options.categoryId,
      domain: options.domain ?? 'US',
      page: options.page,
      sort: options.sort,
    });
  }

  /**
   * One request PER ASIN — a shortlist instrument, never a screening one. The
   * figures are Canopy's model output, not observed sales.
   */
  salesEstimate(asin: string, domain = 'US'): Promise<SalesEstimateResponse> {
    return this.get<SalesEstimateResponse>('/api/amazon/product/sales', { asin, domain });
  }
}
