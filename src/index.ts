#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import chalk from 'chalk'

import { logConfigStatus, logger } from './config.js'
import {
  BatchKeywordParamsSchema,
  CheckParamsSchema,
  DomainParamsSchema,
  KeywordDbRequiredParamsSchema,
  KeywordParamsSchema,
  TargetParamsSchema,
  TrafficDomainParamsSchema,
  TrafficDomainsParamsSchema,
} from './schemas.js'
import { SemrushApiError, semrushApi } from './semrush-api.js'

// Shared tool annotations — all tools are read-only API calls
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true as const,
  destructiveHint: false as const,
  idempotentHint: true as const,
}

// Helper to wrap API errors in MCP error response format
function handleApiError(error: unknown) {
  if (error instanceof SemrushApiError) {
    return {
      isError: true as const,
      content: [
        {
          type: 'text' as const,
          text: `Error: ${error.message}. Status: ${error.status}`,
        },
      ],
    }
  }

  return {
    isError: true as const,
    content: [
      {
        type: 'text' as const,
        text: `Unexpected error: ${(error as Error).message || 'Unknown error'}`,
      },
    ],
  }
}

// Create the MCP server
const server = new McpServer({
  name: 'semrush-mcp',
  version: '0.2.0',
})

// ---------------------------------------------------------------------------
// Domain Tools
// ---------------------------------------------------------------------------

server.tool(
  'semrush_domain_overview',
  'Get domain overview data including organic/paid search traffic, keywords, and rankings',
  DomainParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ domain, database }) => {
    try {
      const response = await semrushApi.getDomainOverview(domain, database)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_domain_overview: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_domain_organic_keywords',
  'Get organic keywords for a specific domain',
  DomainParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ domain, database, limit }) => {
    try {
      const response = await semrushApi.getDomainOrganicKeywords(domain, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_domain_organic_keywords: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_domain_paid_keywords',
  'Get paid keywords for a specific domain',
  DomainParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ domain, database, limit }) => {
    try {
      const response = await semrushApi.getDomainPaidKeywords(domain, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_domain_paid_keywords: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_competitors',
  'Get competitors for a specific domain in organic search',
  DomainParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ domain, database, limit }) => {
    try {
      const response = await semrushApi.getCompetitorsInOrganic(domain, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_competitors: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

// ---------------------------------------------------------------------------
// Backlinks Tools
// ---------------------------------------------------------------------------

server.tool(
  'semrush_backlinks',
  'Get backlinks for a specific domain or URL',
  TargetParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ target, limit }) => {
    try {
      const response = await semrushApi.getBacklinks(target, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_backlinks: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_backlinks_domains',
  'Get referring domains for a specific domain or URL',
  TargetParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ target, limit }) => {
    try {
      const response = await semrushApi.getBacklinksDomains(target, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_backlinks_domains: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

// ---------------------------------------------------------------------------
// Keyword Tools (database optional)
// ---------------------------------------------------------------------------

server.tool(
  'semrush_keyword_overview',
  'Get overview data for a specific keyword',
  KeywordParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database }) => {
    try {
      const response = await semrushApi.getKeywordOverview(keyword, database)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_keyword_overview: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_related_keywords',
  'Get related keywords for a specific keyword',
  KeywordParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database, limit }) => {
    try {
      const response = await semrushApi.getRelatedKeywords(keyword, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_related_keywords: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

// ---------------------------------------------------------------------------
// Keyword Tools (database required)
// ---------------------------------------------------------------------------

server.tool(
  'semrush_keyword_overview_single_db',
  'Get detailed overview data for a keyword from a specific database (10 API units per line)',
  KeywordDbRequiredParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database }) => {
    try {
      const response = await semrushApi.getKeywordOverviewSingleDb(keyword, database)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_keyword_overview_single_db: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_batch_keyword_overview',
  'Analyze up to 100 keywords at once in a specific database (10 API units per line)',
  BatchKeywordParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keywords, database }) => {
    try {
      const response = await semrushApi.getBatchKeywordOverview(keywords, database)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_batch_keyword_overview: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_keyword_organic_results',
  "Get domains ranking in Google's top 100 for a keyword (10 API units per line)",
  KeywordDbRequiredParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database, limit }) => {
    try {
      const response = await semrushApi.getKeywordOrganicResults(keyword, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_keyword_organic_results: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_keyword_paid_results',
  "Get domains in Google's paid search results for a keyword (20 API units per line)",
  KeywordDbRequiredParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database, limit }) => {
    try {
      const response = await semrushApi.getKeywordPaidResults(keyword, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_keyword_paid_results: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_keyword_ads_history',
  'Get domains that bid on a keyword in the last 12 months (100 API units per line)',
  KeywordDbRequiredParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database, limit }) => {
    try {
      const response = await semrushApi.getKeywordAdsHistory(keyword, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_keyword_ads_history: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_broad_match_keywords',
  'Get broad matches and alternate search queries for a keyword (20 API units per line)',
  KeywordDbRequiredParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database, limit }) => {
    try {
      const response = await semrushApi.getBroadMatchKeywords(keyword, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_broad_match_keywords: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_phrase_questions',
  'Get question-based keywords related to a term (40 API units per line)',
  KeywordDbRequiredParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keyword, database, limit }) => {
    try {
      const response = await semrushApi.getPhraseQuestions(keyword, database, limit)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_phrase_questions: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_keyword_difficulty',
  "Get difficulty index for ranking in Google's top 10 (50 API units per line)",
  BatchKeywordParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ keywords, database }) => {
    try {
      const response = await semrushApi.getKeywordDifficulty(keywords, database)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_keyword_difficulty: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

// ---------------------------------------------------------------------------
// Traffic Tools
// ---------------------------------------------------------------------------

server.tool(
  'semrush_traffic_summary',
  'Get traffic summary data for domains (requires .Trends API access)',
  TrafficDomainsParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ domains, country }) => {
    try {
      const response = await semrushApi.getTrafficSummary(domains, country)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_traffic_summary: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

server.tool(
  'semrush_traffic_sources',
  'Get traffic sources data for a domain (requires .Trends API access)',
  TrafficDomainParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async ({ domain, country }) => {
    try {
      const response = await semrushApi.getTrafficSources(domain, country)
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_traffic_sources: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

// ---------------------------------------------------------------------------
// Utility Tools
// ---------------------------------------------------------------------------

server.tool(
  'semrush_api_units_balance',
  'Check the remaining API units balance',
  CheckParamsSchema.shape,
  READ_ONLY_ANNOTATIONS,
  async () => {
    try {
      const response = await semrushApi.getApiUnitsBalance()
      return { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
    } catch (error) {
      logger.error(`Error in semrush_api_units_balance: ${(error as Error).message}`)
      return handleApiError(error)
    }
  }
)

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

async function runServer() {
  try {
    logConfigStatus()
    logger.info(chalk.green('Starting Semrush MCP Server...'))

    const transport = new StdioServerTransport()
    await server.connect(transport)

    logger.info(chalk.green('Semrush MCP Server is running and ready to process requests'))
  } catch (error) {
    logger.error(`Failed to start server: ${(error as Error).message}`)
    process.exit(1)
  }
}

runServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  logger.error(`Unhandled error: ${message}`)
  process.exit(1)
})
