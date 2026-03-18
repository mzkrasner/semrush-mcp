/**
 * Shared Zod validation schemas for Semrush MCP + CLI
 *
 * All parameter schemas live here so both entry points (MCP server and CLI)
 * validate inputs identically. TypeScript types are inferred from the schemas
 * via z.infer — never define a parallel interface by hand.
 */
import { z } from 'zod'

// ============================================================================
// Domain Schemas
// ============================================================================

export const DomainParamsSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type DomainParams = z.infer<typeof DomainParamsSchema>

// ============================================================================
// Target (Backlinks) Schemas
// ============================================================================

export const TargetParamsSchema = z.object({
  target: z.string().min(1, 'Target domain/URL is required'),
  limit: z.number().positive().optional(),
})

export type TargetParams = z.infer<typeof TargetParamsSchema>

// ============================================================================
// Keyword Schemas
// ============================================================================

export const KeywordParamsSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type KeywordParams = z.infer<typeof KeywordParamsSchema>

/** Keyword overview requiring a specific database (phrase_this, phrase_organic, etc.) */
export const KeywordDbRequiredParamsSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  database: z.string().min(1, 'Database is required'),
  limit: z.number().positive().optional(),
})

export type KeywordDbRequiredParams = z.infer<typeof KeywordDbRequiredParamsSchema>

// ============================================================================
// Batch Keyword Schemas
// ============================================================================

export const BatchKeywordParamsSchema = z.object({
  keywords: z
    .array(z.string().min(1))
    .min(1, 'At least one keyword is required')
    .max(100, 'Maximum 100 keywords'),
  database: z.string().optional().default('us'),
})

export type BatchKeywordParams = z.infer<typeof BatchKeywordParamsSchema>

// ============================================================================
// Traffic Schemas
// ============================================================================

export const TrafficDomainsParamsSchema = z.object({
  domains: z.array(z.string().min(1)).min(1, 'At least one domain is required'),
  country: z.string().optional().default('us'),
})

export type TrafficDomainsParams = z.infer<typeof TrafficDomainsParamsSchema>

export const TrafficDomainParamsSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  country: z.string().optional().default('us'),
})

export type TrafficDomainParams = z.infer<typeof TrafficDomainParamsSchema>

// ============================================================================
// Utility Schemas
// ============================================================================

export const CheckParamsSchema = z.object({
  check: z.boolean(),
})

export type CheckParams = z.infer<typeof CheckParamsSchema>

// ============================================================================
// Keyword Gap Schemas (CLI only — not exposed as MCP tool yet)
// ============================================================================

export const KeywordGapParamsSchema = z.object({
  domains: z.array(z.string().min(1)).min(2, 'At least two domains are required'),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type KeywordGapParams = z.infer<typeof KeywordGapParamsSchema>
