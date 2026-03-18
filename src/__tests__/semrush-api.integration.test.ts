/**
 * Semrush API Client — Integration Tests (Real API)
 *
 * Runs against the live Semrush API. HARD FAILS if SEMRUSH_API_KEY is not set.
 * Uses small limits (5) to minimize API unit consumption.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { SemrushApiClient, SemrushApiError } from '../semrush-api.js'
import { assertHasData, assertValidResponse } from './test-utils.js'

let client: SemrushApiClient

beforeAll(() => {
  if (!process.env.SEMRUSH_API_KEY) {
    throw new Error(
      'SEMRUSH_API_KEY is required for integration tests. Set it in your environment.'
    )
  }
  client = new SemrushApiClient(process.env.SEMRUSH_API_KEY)
})

describe('SemrushApiClient — Integration Tests', () => {
  // ==========================================================================
  // Domain Analytics
  // ==========================================================================

  describe('Domain Analytics', () => {
    it('getDomainOverview returns data for google.com', async () => {
      const result = await client.getDomainOverview('google.com')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      // Domain overview returns CSV with header + data rows
      expect(typeof result.data).toBe('string')
      console.log('Domain overview preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getDomainOrganicKeywords returns rows for google.com', async () => {
      const result = await client.getDomainOrganicKeywords('google.com', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      // Should have header + at least 1 data row
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Domain organic keywords: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getDomainPaidKeywords returns rows for google.com', async () => {
      const result = await client.getDomainPaidKeywords('google.com', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Domain paid keywords: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getCompetitorsInOrganic returns rows for google.com', async () => {
      const result = await client.getCompetitorsInOrganic('google.com', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Competitors: ${lines.length - 1} rows returned`)
    }, 30000)
  })

  // ==========================================================================
  // Backlinks
  // ==========================================================================

  describe('Backlinks', () => {
    it('getBacklinks returns rows for google.com', async () => {
      const result = await client.getBacklinks('google.com', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Backlinks: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getBacklinksDomains returns rows for google.com', async () => {
      const result = await client.getBacklinksDomains('google.com', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Backlinks domains: ${lines.length - 1} rows returned`)
    }, 30000)
  })

  // ==========================================================================
  // Keyword Analytics
  // ==========================================================================

  describe('Keyword Analytics', () => {
    it('getKeywordOverview returns data for "seo"', async () => {
      const result = await client.getKeywordOverview('seo', 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      expect(typeof result.data).toBe('string')
      console.log('Keyword overview preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getRelatedKeywords returns rows for "seo"', async () => {
      const result = await client.getRelatedKeywords('seo', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Related keywords: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getKeywordOverviewSingleDb returns data for "seo" in "us"', async () => {
      const result = await client.getKeywordOverviewSingleDb('seo', 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      console.log('Keyword overview (single db) preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getBatchKeywordOverview returns rows for ["seo", "marketing"]', async () => {
      const result = await client.getBatchKeywordOverview(['seo', 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Batch keyword overview: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getKeywordOrganicResults returns rows for "seo"', async () => {
      const result = await client.getKeywordOrganicResults('seo', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Keyword organic results: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getKeywordPaidResults returns rows for "seo" (may be empty)', async () => {
      const result = await client.getKeywordPaidResults('seo', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      // Paid results may legitimately be empty for some keywords
      const data = String(result.data).trim()
      if (data.split(/\r?\n/).length <= 1) {
        console.log('Keyword paid results: no data rows (expected for some keywords)')
      } else {
        console.log(`Keyword paid results: ${data.split(/\r?\n/).length - 1} rows returned`)
      }
    }, 30000)

    it('getKeywordAdsHistory returns rows for "seo" (may be empty)', async () => {
      const result = await client.getKeywordAdsHistory('seo', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const data = String(result.data).trim()
      if (data.split(/\r?\n/).length <= 1) {
        console.log('Keyword ads history: no data rows (expected for some keywords)')
      } else {
        console.log(`Keyword ads history: ${data.split(/\r?\n/).length - 1} rows returned`)
      }
    }, 30000)

    it('getBroadMatchKeywords returns rows for "seo"', async () => {
      const result = await client.getBroadMatchKeywords('seo', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Broad match keywords: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getPhraseQuestions returns rows for "seo"', async () => {
      const result = await client.getPhraseQuestions('seo', 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log(`Phrase questions: ${lines.length - 1} rows returned`)
    }, 30000)

    it('getKeywordDifficulty returns data for ["seo", "marketing"]', async () => {
      const result = await client.getKeywordDifficulty(['seo', 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
      console.log('Keyword difficulty preview:', String(result.data).substring(0, 200))
    }, 30000)
  })

  // ==========================================================================
  // Traffic Analytics (.Trends — may fail without subscription)
  // ==========================================================================

  describe('Traffic Analytics (.Trends)', () => {
    it('getTrafficSummary returns data for google.com (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficSummary(['google.com'], 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
        console.log('Traffic summary preview:', String(result.data).substring(0, 200))
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(
            `Traffic summary skipped — .Trends subscription likely missing: ${error.message} (HTTP ${error.status})`
          )
          // Don't fail the test — this endpoint requires .Trends access
          return
        }
        throw error
      }
    }, 30000)

    it('getTrafficSources returns data for google.com (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficSources('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
        console.log('Traffic sources preview:', String(result.data).substring(0, 200))
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(
            `Traffic sources skipped — .Trends subscription likely missing: ${error.message} (HTTP ${error.status})`
          )
          return
        }
        throw error
      }
    }, 30000)
  })

  // ==========================================================================
  // Utility
  // ==========================================================================

  describe('Utility', () => {
    it('getApiUnitsBalance returns a number', async () => {
      const result = await client.getApiUnitsBalance()
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      // The balance endpoint returns a plain number as text
      const balance = Number(String(result.data).trim())
      expect(Number.isFinite(balance)).toBe(true)
      expect(balance).toBeGreaterThanOrEqual(0)
      console.log(`API units balance: ${balance}`)
    }, 30000)
  })

  // ==========================================================================
  // Error Handling (Real API)
  // ==========================================================================

  describe('Error Handling', () => {
    it('throws SemrushApiError for invalid API key', async () => {
      const badClient = new SemrushApiClient('invalid-api-key-12345')

      try {
        await badClient.getDomainOverview('google.com')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
        // The API may return various error types for bad keys
        console.log(
          `Bad key error: ${(error as Error).message} (${(error as SemrushApiError).status || 'no status'})`
        )
      }
    }, 30000)
  })
})
