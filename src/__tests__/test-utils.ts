/**
 * Test utilities for Semrush API tests
 *
 * Provides mock factories for axios responses/errors and assertion helpers.
 * Semrush API returns semicolon-delimited CSV text, NOT JSON — mock data reflects this.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import type { SemrushApiResponse } from '../semrush-api.js'

// ============================================================================
// Mock CSV Data — Semrush returns semicolon-delimited text
// ============================================================================

/** Domain overview CSV (domain_ranks) */
export const MOCK_DOMAIN_OVERVIEW_CSV =
  'Database;Domain;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;PLA keywords;PLA uniques\r\n' +
  'us;example.com;1500;45000;1200000;890000;1200;50000;120000;300;150'

/** Domain organic keywords CSV (domain_organic) */
export const MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV =
  'Keyword;Position;Previous Position;Position Difference;Search Volume;CPC;Url;Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends\r\n' +
  'example keyword;3;5;2;12000;1.50;https://example.com/page;8.5;12000;0.65;1500000;1,1,1,0.8,0.9,1,1,0.7,0.8,1,1,1\r\n' +
  'another keyword;7;8;1;8000;2.30;https://example.com/other;3.2;7500;0.45;890000;0.8,0.9,1,1,0.7,0.8,1,1,0.9,0.8,1,1'

/** Domain paid keywords CSV (domain_adwords) */
export const MOCK_DOMAIN_PAID_KEYWORDS_CSV =
  'Keyword;Position;Previous Position;Position Difference;Ad Budget;Search Volume;CPC;Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends\r\n' +
  'buy example;1;1;0;5000;9000;3.20;12.5;28000;0.85;450000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1'

/** Competitors CSV (domain_organic_organic) */
export const MOCK_COMPETITORS_CSV =
  'Domain;Competition Level;Common Keywords;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost\r\n' +
  'competitor1.com;0.15;5000;35000;900000;650000;800;30000;80000\r\n' +
  'competitor2.com;0.12;3500;28000;750000;500000;600;25000;65000'

/** Backlinks CSV */
export const MOCK_BACKLINKS_CSV =
  'Source Title;Source Url;Target Url;Anchor;Page Score;Domain Score;External Num;Internal Num;First Seen;Last Seen\r\n' +
  'Example Page;https://source.com/page;https://example.com;click here;45;62;150;80;20240101;20240315'

/** Backlinks domains CSV */
export const MOCK_BACKLINKS_DOMAINS_CSV =
  'Domain;Domain Score;Backlinks;IP;Country;First Seen;Last Seen\r\n' +
  'source.com;62;25;1.2.3.4;us;20230601;20240315'

/** Keyword overview CSV (phrase_all) */
export const MOCK_KEYWORD_OVERVIEW_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends\r\n' +
  'seo;110000;4.50;0.82;2500000000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1'

/** Related keywords CSV (phrase_related) */
export const MOCK_RELATED_KEYWORDS_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends\r\n' +
  'seo tools;22000;3.80;0.75;1200000000;0.9,1,0.8,0.7,1,1,0.8,0.9,1,0.9,1,1\r\n' +
  'seo agency;18000;5.20;0.88;890000000;1,0.9,0.8,0.9,1,1,0.9,1,0.8,0.9,1,1'

/** Keyword overview single db CSV (phrase_this) */
export const MOCK_KEYWORD_SINGLE_DB_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Intent;Keyword Difficulty\r\n' +
  'seo;110000;4.50;0.82;2500000000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1;0;67.5'

/** Batch keyword overview CSV (phrase_these) */
export const MOCK_BATCH_KEYWORD_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Intent;Keyword Difficulty\r\n' +
  'seo;110000;4.50;0.82;2500000000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1;0;67.5\r\n' +
  'marketing;90000;3.20;0.78;3100000000;0.9,1,0.8,0.9,1,0.8,0.9,1,0.9,1,0.8,1;0;72.1'

/** Keyword organic results CSV (phrase_organic) */
export const MOCK_KEYWORD_ORGANIC_RESULTS_CSV =
  'Position;Position Type;Domain;Url;Features Keyword;Features Snippet;Features Link\r\n' +
  '1;organic;moz.com;https://moz.com/seo;1;0;1\r\n' +
  '2;organic;searchengineland.com;https://searchengineland.com/guide/seo;0;1;1'

/** Keyword paid results CSV (phrase_adwords) */
export const MOCK_KEYWORD_PAID_RESULTS_CSV =
  'Domain;Url;Visible Url\r\n' + 'semrush.com;https://semrush.com/lp;semrush.com/seo-tools'

/** Keyword ads history CSV (phrase_adwords_historical) */
export const MOCK_KEYWORD_ADS_HISTORY_CSV =
  'Domain;Date;Position;Url;Title;Description;Visible Url\r\n' +
  'semrush.com;202401;1;https://semrush.com/lp;SEMrush SEO Tools;Best SEO tools suite;semrush.com'

/** Broad match keywords CSV (phrase_fullsearch) */
export const MOCK_BROAD_MATCH_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Features Keyword;Intent;Keyword Difficulty\r\n' +
  'seo tips;14000;2.10;0.55;900000000;0.8,0.9,1,0.7,0.8,1,0.9,1,0.8,0.9,1,1;1;45.2\r\n' +
  'seo guide;12000;1.80;0.48;750000000;0.9,1,0.8,0.9,1,0.7,0.8,1,0.9,1,0.8,1;0;42.8'

/** Phrase questions CSV (phrase_questions) */
export const MOCK_PHRASE_QUESTIONS_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Intent;Keyword Difficulty\r\n' +
  'what is seo;33000;2.80;0.62;1800000000;1,0.9,0.8,1,1,0.9,1,0.8,0.9,1,1,0.9;0;52.3\r\n' +
  'how to do seo;22000;3.10;0.58;1200000000;0.9,1,0.8,0.9,1,1,0.8,0.9,1,0.9,1,1;0;48.7'

/** Keyword difficulty CSV (phrase_kdi) */
export const MOCK_KEYWORD_DIFFICULTY_CSV =
  'Keyword;Keyword Difficulty\r\n' + 'seo;67.5\r\n' + 'marketing;72.1'

/** Traffic summary JSON (Trends API returns JSON, not CSV) */
export const MOCK_TRAFFIC_SUMMARY_JSON = JSON.stringify({
  'google.com': {
    visits: 89000000000,
    desktop_visits: 45000000000,
    mobile_visits: 44000000000,
  },
})

/** Traffic sources JSON */
export const MOCK_TRAFFIC_SOURCES_JSON = JSON.stringify({
  direct: 0.65,
  referral: 0.12,
  search: 0.18,
  social: 0.03,
  paid: 0.02,
})

/** API units balance */
export const MOCK_API_UNITS_BALANCE = '45230'

// ============================================================================
// Mock Response Builders
// ============================================================================

/**
 * Create a mock successful API response wrapping CSV/text data
 */
export function createMockApiResponse(data: string, status = 200): SemrushApiResponse {
  return {
    data,
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  }
}

/**
 * Create a mock Axios response (for use with vi.mocked(axios))
 */
export function createMockAxiosResponse<T = string>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
    config: {
      headers: {},
    } as InternalAxiosRequestConfig,
  }
}

/**
 * Create a mock Axios error with response
 */
export function createMockApiError(status: number, message: string) {
  const error = new Error(`Request failed with status code ${status}`) as Error & {
    isAxiosError: boolean
    response: {
      status: number
      data: { error: { message: string } }
      statusText: string
      headers: Record<string, unknown>
      config: { headers: Record<string, unknown> }
    }
  }

  error.isAxiosError = true
  error.response = {
    status,
    data: { error: { message } },
    statusText: 'Error',
    headers: {},
    config: { headers: {} },
  }

  return error
}

/**
 * Create a network-level error (no response object)
 */
export function createNetworkError(message: string): Error {
  return new Error(message)
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a response has the expected SemrushApiResponse shape
 */
export function assertValidResponse(result: unknown): asserts result is SemrushApiResponse {
  if (!result || typeof result !== 'object') {
    throw new Error('Response must be an object')
  }

  const r = result as Record<string, unknown>

  if (!('data' in r)) {
    throw new Error('Response must have a "data" property')
  }

  if (typeof r.status !== 'number') {
    throw new Error('Response must have a numeric "status" property')
  }

  if (!r.headers || typeof r.headers !== 'object') {
    throw new Error('Response must have a "headers" object')
  }
}

/**
 * Assert that a response contains non-empty data
 */
export function assertHasData(result: SemrushApiResponse): void {
  if (result.data === null || result.data === undefined) {
    throw new Error('Response data must not be null or undefined')
  }

  if (typeof result.data === 'string' && result.data.trim().length === 0) {
    throw new Error('Response data must not be an empty string')
  }
}

/**
 * Assert that CSV response has at least N data rows (excluding header)
 */
export function assertCsvRowCount(data: string, minRows: number): void {
  const lines = data.trim().split(/\r?\n/)
  const dataRows = lines.length - 1 // first line is header
  if (dataRows < minRows) {
    throw new Error(`Expected at least ${minRows} data rows, got ${dataRows}`)
  }
}
