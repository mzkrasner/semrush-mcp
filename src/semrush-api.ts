import axios, { AxiosError } from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import NodeCache from 'node-cache'

import { config, logger } from './config.js'

// Base API URL
const SEMRUSH_API_BASE_URL = 'https://api.semrush.com/'
const BACKLINKS_API_BASE_URL = 'https://api.semrush.com/analytics/v1/'
const TRENDS_API_BASE_URL = 'https://api.semrush.com/analytics/ta/v3/'

// Create a cache with TTL from config
const apiCache = new NodeCache({ stdTTL: config.API_CACHE_TTL_SECONDS })

// Rate limiting implementation
class RateLimiter {
  private requestTimestamps: number[] = []
  private readonly rateLimit: number

  constructor(rateLimit = config.API_RATE_LIMIT_PER_SECOND) {
    this.rateLimit = rateLimit
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    const oneSecondAgo = now - 1000

    // Remove timestamps older than 1 second
    this.requestTimestamps = this.requestTimestamps.filter((timestamp) => timestamp > oneSecondAgo)

    // Check if we're under the rate limit
    return this.requestTimestamps.length < this.rateLimit
  }

  recordRequest(): void {
    this.requestTimestamps.push(Date.now())
  }

  async waitForRateLimit(): Promise<void> {
    return new Promise((resolve) => {
      const checkRateLimit = () => {
        if (this.canMakeRequest()) {
          this.recordRequest()
          resolve()
        } else {
          // Wait 100ms and check again
          setTimeout(checkRateLimit, 100)
        }
      }

      checkRateLimit()
    })
  }
}

const rateLimiter = new RateLimiter()

// API response types
export interface SemrushApiResponse {
  data: string
  status: number
  headers: Record<string, string>
}

// Types for API parameters
export interface ApiQueryParams {
  [key: string]: string | number | boolean | undefined
}

// Error handling
export class SemrushApiError extends Error {
  public status: number
  public response?: unknown

  constructor(message: string, status: number, response?: unknown) {
    super(message)
    this.name = 'SemrushApiError'
    this.status = status
    this.response = response
  }
}

const MAX_RETRIES = 3

// Common export column sets
const KEYWORD_DETAIL_COLUMNS = 'Ph,Nq,Cp,Co,Nr,Td,In,Kd'

// Main API client
export class SemrushApiClient {
  private readonly apiKey: string

  constructor(apiKey = config.SEMRUSH_API_KEY) {
    if (!apiKey) {
      throw new Error('Semrush API key is required')
    }
    this.apiKey = apiKey
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Extract a nested error message from Axios response data
  private extractAxiosErrorMessage(error: AxiosError): string {
    const responseData: unknown = error.response?.data
    if (typeof responseData !== 'object' || responseData === null || !('error' in responseData)) {
      return error.message
    }
    const errorField: unknown = (responseData as Record<string, unknown>).error
    if (typeof errorField !== 'object' || errorField === null || !('message' in errorField)) {
      return error.message
    }
    const nestedMsg: unknown = (errorField as Record<string, unknown>).message
    return typeof nestedMsg === 'string' ? nestedMsg : error.message
  }

  // Determine whether a failed request should be retried
  private shouldRetry(status: number, retryCount: number): boolean {
    const RETRYABLE = [429, 500, 502, 503, 504]
    return RETRYABLE.includes(status) && retryCount < MAX_RETRIES
  }

  // Make API request with caching, rate limiting, and retry with exponential backoff
  private async makeRequest(
    url: string,
    params: ApiQueryParams = {},
    options: AxiosRequestConfig = {},
    retryCount = 0
  ): Promise<SemrushApiResponse> {
    // Add API key to parameters
    const requestParams: ApiQueryParams = {
      ...params,
      key: this.apiKey,
    }

    // Create cache key from URL and params
    const cacheKey = `${url}:${JSON.stringify(requestParams)}`

    // Check cache first
    const cachedResponse = apiCache.get<SemrushApiResponse>(cacheKey)
    if (cachedResponse) {
      logger.debug(`Cache hit for request: ${url}`)
      return cachedResponse
    }

    // Wait for rate limit allowance
    await rateLimiter.waitForRateLimit()

    try {
      logger.debug(`Making request to: ${url}`)

      const response: AxiosResponse<string> = await axios<string>({
        method: 'get',
        url,
        params: requestParams,
        ...options,
      })

      const apiResponse: SemrushApiResponse = {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      }

      // Cache successful response
      apiCache.set(cacheKey, apiResponse)

      return apiResponse
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 500
        const message = this.extractAxiosErrorMessage(error)

        if (this.shouldRetry(status, retryCount)) {
          const attempt = retryCount + 1
          const delay = attempt * 2000 // 2s, 4s, 6s
          logger.warn(
            `API request failed (${status}), retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})...`
          )
          await this.sleep(delay)
          return this.makeRequest(url, params, options, attempt)
        }

        logger.error(`API request failed: ${message}`)
        throw new SemrushApiError(message, status, error.response?.data)
      }

      // Handle other types of errors
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Unknown error: ${errorMessage}`)
      throw new SemrushApiError(errorMessage, 500)
    }
  }

  // Analytics API methods

  // Domain Analytics
  async getDomainOverview(domain: string, database: string = 'us'): Promise<SemrushApiResponse> {
    return this.makeRequest(SEMRUSH_API_BASE_URL, {
      type: 'domain_ranks',
      domain,
      database,
      export_columns: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv',
    })
  }

  async getDomainOrganicKeywords(
    domain: string,
    database: string = 'us',
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'domain_organic',
      domain,
      database,
      export_columns: 'Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  async getDomainPaidKeywords(
    domain: string,
    database: string = 'us',
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'domain_adwords',
      domain,
      database,
      export_columns: 'Ph,Po,Pp,Pd,Ab,Nq,Cp,Tr,Tc,Co,Nr,Td',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  async getCompetitorsInOrganic(
    domain: string,
    database: string = 'us',
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'domain_organic_organic',
      domain,
      database,
      export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad,At,Ac',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  // Backlinks API
  async getBacklinks(target: string, limit?: number): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'backlinks',
      target,
      target_type: 'root_domain',
      export_columns:
        'page_ascore,source_title,source_url,target_url,anchor,external_num,internal_num,first_seen,last_seen',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(BACKLINKS_API_BASE_URL, params)
  }

  async getBacklinksDomains(target: string, limit?: number): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'backlinks_refdomains',
      target,
      target_type: 'root_domain',
      export_columns: 'domain_ascore,domain,backlinks_num,ip,country,first_seen,last_seen',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(BACKLINKS_API_BASE_URL, params)
  }

  // Keyword Analytics
  async getKeywordOverview(keyword: string, database: string = 'us'): Promise<SemrushApiResponse> {
    return this.makeRequest(SEMRUSH_API_BASE_URL, {
      type: 'phrase_all',
      phrase: keyword,
      database,
      export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
    })
  }

  async getRelatedKeywords(
    keyword: string,
    database: string = 'us',
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'phrase_related',
      phrase: keyword,
      database,
      export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  // Keyword Overview for one database (vs phrase_all which is all databases)
  async getKeywordOverviewSingleDb(keyword: string, database: string): Promise<SemrushApiResponse> {
    return this.makeRequest(SEMRUSH_API_BASE_URL, {
      type: 'phrase_this',
      phrase: keyword,
      database,
      export_columns: KEYWORD_DETAIL_COLUMNS,
    })
  }

  // Batch Keyword Overview - analyze up to 100 keywords at once
  async getBatchKeywordOverview(keywords: string[], database: string): Promise<SemrushApiResponse> {
    return this.makeRequest(SEMRUSH_API_BASE_URL, {
      type: 'phrase_these',
      phrase: keywords.join(';'),
      database,
      export_columns: KEYWORD_DETAIL_COLUMNS,
    })
  }

  // Organic Results - domains ranking in Google's top 100 for a keyword
  async getKeywordOrganicResults(
    keyword: string,
    database: string,
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'phrase_organic',
      phrase: keyword,
      database,
      export_columns: 'Po,Pt,Dn,Ur,Fk,Fp,Fl',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  // Paid Results - domains in Google's paid search results for a keyword
  async getKeywordPaidResults(
    keyword: string,
    database: string,
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'phrase_adwords',
      phrase: keyword,
      database,
      export_columns: 'Dn,Ur,Vu',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  // Keyword Ads History - domains that bid on a keyword in last 12 months
  async getKeywordAdsHistory(
    keyword: string,
    database: string,
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'phrase_adwords_historical',
      phrase: keyword,
      database,
      export_columns: 'Dn,Dt,Po,Ur,Tt,Ds,Vu',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  // Broad Match Keywords - broad matches and alternative search queries
  async getBroadMatchKeywords(
    keyword: string,
    database: string,
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'phrase_fullsearch',
      phrase: keyword,
      database,
      export_columns: 'Ph,Nq,Cp,Co,Nr,Td,Fk,In,Kd',
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  // Phrase Questions - question-based keywords related to a term
  async getPhraseQuestions(
    keyword: string,
    database: string,
    limit?: number
  ): Promise<SemrushApiResponse> {
    const params: ApiQueryParams = {
      type: 'phrase_questions',
      phrase: keyword,
      database,
      export_columns: KEYWORD_DETAIL_COLUMNS,
    }

    if (limit) {
      params.display_limit = limit
    }

    return this.makeRequest(SEMRUSH_API_BASE_URL, params)
  }

  // Keyword Difficulty - estimates difficulty of ranking in top 10
  async getKeywordDifficulty(keywords: string[], database: string): Promise<SemrushApiResponse> {
    return this.makeRequest(SEMRUSH_API_BASE_URL, {
      type: 'phrase_kdi',
      phrase: keywords.join(';'),
      database,
      export_columns: 'Ph,Kd',
    })
  }

  // Traffic Analytics (.Trends API) - Requires separate subscription
  async getTrafficSummary(domains: string[], country: string = 'us'): Promise<SemrushApiResponse> {
    return this.makeRequest(TRENDS_API_BASE_URL + 'summary', {
      domains: domains.join(','),
      country,
      date: 'all',
    })
  }

  async getTrafficSources(domain: string, country: string = 'us'): Promise<SemrushApiResponse> {
    return this.makeRequest(TRENDS_API_BASE_URL + 'sources', {
      domain,
      country,
      date: 'all',
    })
  }

  // Utility to check API units balance
  async getApiUnitsBalance(): Promise<SemrushApiResponse> {
    return this.makeRequest('https://www.semrush.com/users/countapiunits.html', {})
  }
}

// Lazy singleton — the client is only constructed when first accessed,
// so importing this module never throws even if the API key is missing.
let _instance: SemrushApiClient | null = null

export const semrushApi = new Proxy({} as SemrushApiClient, {
  get(_target, prop) {
    if (!_instance) {
      _instance = new SemrushApiClient()
    }
    return (_instance as unknown as Record<string, unknown>)[prop as string]
  },
})
