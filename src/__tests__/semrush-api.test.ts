/**
 * Semrush API Client — Unit Tests (Mocked)
 *
 * All HTTP calls are mocked via vi.mock('axios').
 * These tests run WITHOUT an API key.
 */
import axios, { AxiosError } from 'axios'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SemrushApiClient, SemrushApiError } from '../semrush-api.js'
import {
  MOCK_API_UNITS_BALANCE,
  MOCK_BACKLINKS_CSV,
  MOCK_BACKLINKS_DOMAINS_CSV,
  MOCK_BATCH_KEYWORD_CSV,
  MOCK_BROAD_MATCH_CSV,
  MOCK_COMPETITORS_CSV,
  MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV,
  MOCK_DOMAIN_OVERVIEW_CSV,
  MOCK_DOMAIN_PAID_KEYWORDS_CSV,
  MOCK_KEYWORD_ADS_HISTORY_CSV,
  MOCK_KEYWORD_DIFFICULTY_CSV,
  MOCK_KEYWORD_ORGANIC_RESULTS_CSV,
  MOCK_KEYWORD_OVERVIEW_CSV,
  MOCK_KEYWORD_PAID_RESULTS_CSV,
  MOCK_KEYWORD_SINGLE_DB_CSV,
  MOCK_PHRASE_QUESTIONS_CSV,
  MOCK_RELATED_KEYWORDS_CSV,
  MOCK_TRAFFIC_SOURCES_JSON,
  MOCK_TRAFFIC_SUMMARY_JSON,
  assertHasData,
  assertValidResponse,
  createMockAxiosResponse,
} from './test-utils.js'

// Mock axios — the API client calls `axios({...})` as a function (default export)
vi.mock('axios', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  const mockFn = vi.fn()
  // Preserve AxiosError class so `instanceof AxiosError` works
  return {
    ...actual,
    default: Object.assign(mockFn, {
      ...actual.default,
      // Keep the AxiosError class reference intact
    }),
  }
})

// Mock node-cache to avoid module-level cache interference between tests
vi.mock('node-cache', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const store = new Map<string, { value: unknown; ttl: number }>()
      return {
        get: vi.fn((key: string) => store.get(key)?.value),
        set: vi.fn((key: string, value: unknown) => {
          store.set(key, { value, ttl: 300 })
          return true
        }),
        del: vi.fn((key: string) => store.delete(key)),
        flushAll: vi.fn(() => store.clear()),
        keys: vi.fn(() => [...store.keys()]),
      }
    }),
  }
})

// Helper: cast mocked axios default as a callable Mock
const mockedAxios = axios as unknown as Mock

/**
 * Create a proper AxiosError instance so `instanceof AxiosError` works
 * inside the API client's catch block.
 */
function createAxiosError(status: number, message: string): AxiosError {
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    String(status),
    undefined,
    undefined,
    {
      status,
      data: { error: { message } },
      statusText: 'Error',
      headers: {},
      config: { headers: {} },
    } as any
  )
  return error
}

describe('SemrushApiClient — Unit Tests', () => {
  let client: SemrushApiClient
  const TEST_API_KEY = 'test-api-key-unit-tests'

  // Unique call counter to make cache keys unique per test
  let callId = 0

  beforeEach(() => {
    client = new SemrushApiClient(TEST_API_KEY)
    vi.clearAllMocks()
    callId++
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('Constructor', () => {
    it('throws if API key is empty string', () => {
      expect(() => new SemrushApiClient('')).toThrow('Semrush API key is required')
    })

    it('accepts a valid API key', () => {
      expect(() => new SemrushApiClient('valid-key-123')).not.toThrow()
    })
  })

  // ==========================================================================
  // API Method Response Shapes (all 19 methods)
  // Each test uses a unique domain/keyword param to avoid cache collisions
  // ==========================================================================

  describe('API Methods — Response Shapes', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getDomainOverview returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_OVERVIEW_CSV)
      const result = await client.getDomainOverview(`shape-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      expect(typeof result.data).toBe('string')
      expect(result.data).toContain('example.com')
    })

    it('getDomainOrganicKeywords returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV)
      const result = await client.getDomainOrganicKeywords(`organic-${callId}.com`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Keyword')
      expect(result.data).toContain('example keyword')
    })

    it('getDomainPaidKeywords returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_PAID_KEYWORDS_CSV)
      const result = await client.getDomainPaidKeywords(`paid-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('buy example')
    })

    it('getCompetitorsInOrganic returns expected shape', async () => {
      mockSuccess(MOCK_COMPETITORS_CSV)
      const result = await client.getCompetitorsInOrganic(`comp-${callId}.com`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('competitor1.com')
    })

    it('getBacklinks returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_CSV)
      const result = await client.getBacklinks(`backlinks-${callId}.com`, 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Source Title')
    })

    it('getBacklinksDomains returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_DOMAINS_CSV)
      const result = await client.getBacklinksDomains(`bldomains-${callId}.com`, 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('source.com')
    })

    it('getKeywordOverview returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_OVERVIEW_CSV)
      const result = await client.getKeywordOverview(`kwov-${callId}`, 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('seo')
    })

    it('getRelatedKeywords returns expected shape', async () => {
      mockSuccess(MOCK_RELATED_KEYWORDS_CSV)
      const result = await client.getRelatedKeywords(`related-${callId}`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('seo tools')
    })

    it('getKeywordOverviewSingleDb returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_SINGLE_DB_CSV)
      const result = await client.getKeywordOverviewSingleDb(`single-${callId}`, 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Keyword Difficulty')
    })

    it('getBatchKeywordOverview returns expected shape', async () => {
      mockSuccess(MOCK_BATCH_KEYWORD_CSV)
      const result = await client.getBatchKeywordOverview([`batch-${callId}`, 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('marketing')
    })

    it('getKeywordOrganicResults returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_ORGANIC_RESULTS_CSV)
      const result = await client.getKeywordOrganicResults(`organic-res-${callId}`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('moz.com')
    })

    it('getKeywordPaidResults returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_PAID_RESULTS_CSV)
      const result = await client.getKeywordPaidResults(`paid-res-${callId}`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('semrush.com')
    })

    it('getKeywordAdsHistory returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_ADS_HISTORY_CSV)
      const result = await client.getKeywordAdsHistory(`ads-hist-${callId}`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('semrush.com')
    })

    it('getBroadMatchKeywords returns expected shape', async () => {
      mockSuccess(MOCK_BROAD_MATCH_CSV)
      const result = await client.getBroadMatchKeywords(`broad-${callId}`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('seo tips')
    })

    it('getPhraseQuestions returns expected shape', async () => {
      mockSuccess(MOCK_PHRASE_QUESTIONS_CSV)
      const result = await client.getPhraseQuestions(`questions-${callId}`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('what is seo')
    })

    it('getKeywordDifficulty returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_DIFFICULTY_CSV)
      const result = await client.getKeywordDifficulty([`kd-${callId}`, 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('67.5')
    })

    it('getTrafficSummary returns expected shape', async () => {
      mockSuccess(MOCK_TRAFFIC_SUMMARY_JSON)
      const result = await client.getTrafficSummary([`traffic-${callId}.com`], 'us')
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficSources returns expected shape', async () => {
      mockSuccess(MOCK_TRAFFIC_SOURCES_JSON)
      const result = await client.getTrafficSources(`sources-${callId}.com`, 'us')
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getApiUnitsBalance returns expected shape', async () => {
      mockSuccess(MOCK_API_UNITS_BALANCE)
      const result = await client.getApiUnitsBalance()
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toBe('45230')
    })
  })

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('throws SemrushApiError on 400 Bad Request', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(400, 'Bad request'))

      await expect(client.getDomainOverview(`err400-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
    })

    it('throws SemrushApiError on 401 Unauthorized', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(401, 'Invalid API key'))

      await expect(client.getDomainOverview(`err401-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
    })

    it('throws SemrushApiError on 403 Forbidden', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(403, 'Access denied'))

      await expect(client.getDomainOverview(`err403-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
    })

    it('wraps non-Axios errors in SemrushApiError with status 500', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      try {
        await client.getDomainOverview(`errnet-${callId}.com`)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SemrushApiError)
        expect((error as SemrushApiError).status).toBe(500)
        expect((error as SemrushApiError).message).toContain('ECONNREFUSED')
      }
    })

    it('preserves HTTP status on SemrushApiError', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(401, 'Invalid API key'))

      try {
        await client.getDomainOverview(`errstatus-${callId}.com`)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SemrushApiError)
        expect((error as SemrushApiError).status).toBe(401)
      }
    })

    it('preserves error response body on SemrushApiError', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(422, 'Validation failed'))

      try {
        await client.getDomainOverview(`errresp-${callId}.com`)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SemrushApiError)
        expect((error as SemrushApiError).response).toBeDefined()
      }
    })
  })

  // ==========================================================================
  // Caching
  // ==========================================================================

  describe('Caching', () => {
    it('returns cached response on second identical call (only 1 HTTP request)', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const uniqueDomain = `cache-hit-${callId}.com`
      const result1 = await client.getDomainOverview(uniqueDomain, 'us')
      const result2 = await client.getDomainOverview(uniqueDomain, 'us')

      // axios should only have been called once — second call came from cache
      expect(mockedAxios).toHaveBeenCalledTimes(1)
      expect(result1.data).toBe(result2.data)
    })

    it('makes separate requests for different parameters', async () => {
      mockedAxios
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const uniqueDomain = `cache-diff-${callId}.com`
      await client.getDomainOverview(uniqueDomain, 'us')
      await client.getDomainOverview(uniqueDomain, 'uk')

      expect(mockedAxios).toHaveBeenCalledTimes(2)
    })

    it('does not cache error responses', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(400, 'Bad request'))
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const uniqueDomain = `cache-err-${callId}.com`

      // First call fails
      await expect(client.getDomainOverview(uniqueDomain)).rejects.toThrow(SemrushApiError)

      // Second call should make a new request (not serve cached error)
      const result = await client.getDomainOverview(uniqueDomain)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(2)
    })
  })

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================

  describe('Rate Limiting', () => {
    it('makes requests within rate limit without delay', async () => {
      mockedAxios
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_KEYWORD_OVERVIEW_CSV))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_RELATED_KEYWORDS_CSV))

      const [r1, r2] = await Promise.all([
        client.getKeywordOverview(`rl1-${callId}`),
        client.getRelatedKeywords(`rl2-${callId}`),
      ])

      assertValidResponse(r1)
      assertValidResponse(r2)
    })
  })

  // ==========================================================================
  // Retry Logic on 429 / 5xx
  // ==========================================================================

  describe('Retry Logic', () => {
    it('retries on 429 and succeeds on second attempt', async () => {
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(429, 'Rate limit exceeded'))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const result = await client.getDomainOverview(`retry429-${callId}.com`)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(2)
    }, 15000)

    it('retries on 500 and succeeds', async () => {
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(500, 'Internal server error'))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_KEYWORD_OVERVIEW_CSV))

      const result = await client.getKeywordOverview(`retry500-${callId}`)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(2)
    }, 15000)

    it('retries on 502/503/504', async () => {
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(502, 'Bad Gateway'))
        .mockRejectedValueOnce(createAxiosError(503, 'Service Unavailable'))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const result = await client.getDomainOverview(`retry5xx-${callId}.com`)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(3)
    }, 20000)

    it('fails after MAX_RETRIES on persistent 5xx', async () => {
      // First call + 3 retries = 4 total calls
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(500, 'Error 1'))
        .mockRejectedValueOnce(createAxiosError(500, 'Error 2'))
        .mockRejectedValueOnce(createAxiosError(500, 'Error 3'))
        .mockRejectedValueOnce(createAxiosError(500, 'Error 4'))

      await expect(client.getDomainOverview(`retryfail-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(4)
    }, 30000)

    it('does NOT retry on 400 (client error)', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(400, 'Bad request'))

      await expect(client.getDomainOverview(`noretry400-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(1)
    })

    it('does NOT retry on 401 (auth error)', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(401, 'Invalid key'))

      await expect(client.getDomainOverview(`noretry401-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(1)
    })

    it('does NOT retry on 403 (forbidden)', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(403, 'Forbidden'))

      await expect(client.getDomainOverview(`noretry403-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(1)
    })
  })

  // ==========================================================================
  // Request Parameters
  // ==========================================================================

  describe('Request Parameters', () => {
    it('passes API key in request params', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`params-key-${callId}.com`)

      expect(mockedAxios).toHaveBeenCalledTimes(1)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.key).toBe(TEST_API_KEY)
    })

    it('passes domain parameter correctly', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`params-domain-${callId}.com`, 'uk')

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.domain).toBe(`params-domain-${callId}.com`)
      expect(callArgs.params.database).toBe('uk')
      expect(callArgs.params.type).toBe('domain_ranks')
    })

    it('passes display_limit when limit is provided', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV))

      await client.getDomainOrganicKeywords(`params-limit-${callId}.com`, 'us', 25)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.display_limit).toBe(25)
    })

    it('omits display_limit when limit is not provided', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV))

      await client.getDomainOrganicKeywords(`params-nolimit-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.display_limit).toBeUndefined()
    })

    it('joins keywords with semicolons for batch endpoints', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_BATCH_KEYWORD_CSV))

      await client.getBatchKeywordOverview(['seo', 'marketing', 'ppc'], 'us')

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.phrase).toBe('seo;marketing;ppc')
    })

    it('joins domains with commas for traffic summary', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_TRAFFIC_SUMMARY_JSON))

      await client.getTrafficSummary([`ts1-${callId}.com`, `ts2-${callId}.com`], 'us')

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.domains).toBe(`ts1-${callId}.com,ts2-${callId}.com`)
    })

    it('uses correct API URL for traffic endpoints', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_TRAFFIC_SUMMARY_JSON))

      await client.getTrafficSummary([`tsurl-${callId}.com`])

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toContain('analytics/ta/v3/summary')
    })

    it('uses correct API URL for standard endpoints', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`stdurl-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toBe('https://api.semrush.com/')
    })

    it('sends correct export_columns for domain overview', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`cols-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.export_columns).toBe('Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv')
    })
  })

  // ==========================================================================
  // Default Parameters
  // ==========================================================================

  describe('Default Parameters', () => {
    it('defaults database to "us" for getDomainOverview', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`defdb-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.database).toBe('us')
    })

    it('defaults database to "us" for getKeywordOverview', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_KEYWORD_OVERVIEW_CSV))

      await client.getKeywordOverview(`defkw-${callId}`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.database).toBe('us')
    })

    it('defaults country to "us" for getTrafficSummary', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_TRAFFIC_SUMMARY_JSON))

      await client.getTrafficSummary([`defcountry-${callId}.com`])

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.country).toBe('us')
    })
  })
})
