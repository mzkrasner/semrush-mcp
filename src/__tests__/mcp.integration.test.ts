/**
 * MCP Server — Integration Test (stdio transport)
 *
 * Spawns the compiled MCP server as a child process, sends JSON-RPC messages
 * over stdin, and validates responses from stdout.
 *
 * Requirements:
 *   - Project must be built first: npm run build
 *   - SEMRUSH_API_KEY must be set in the environment
 */
import { type ChildProcess, spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SERVER_PATH = resolve(import.meta.dirname, '../../dist/index.js')

/** All 19 expected MCP tool names */
const EXPECTED_TOOL_NAMES = [
  'semrush_domain_overview',
  'semrush_domain_organic_keywords',
  'semrush_domain_paid_keywords',
  'semrush_competitors',
  'semrush_backlinks',
  'semrush_backlinks_domains',
  'semrush_keyword_overview',
  'semrush_related_keywords',
  'semrush_keyword_overview_single_db',
  'semrush_batch_keyword_overview',
  'semrush_keyword_organic_results',
  'semrush_keyword_paid_results',
  'semrush_keyword_ads_history',
  'semrush_broad_match_keywords',
  'semrush_phrase_questions',
  'semrush_keyword_difficulty',
  'semrush_traffic_summary',
  'semrush_traffic_sources',
  'semrush_api_units_balance',
]

let serverProcess: ChildProcess
let responseBuffer = ''
let messageId = 0

/**
 * Send a JSON-RPC message to the server via stdin and wait for a response.
 */
function sendRpcMessage(method: string, params: Record<string, unknown> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++messageId
    const message = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    })

    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to ${method} (id=${id})`))
    }, 15000)

    const onData = (chunk: Buffer) => {
      responseBuffer += chunk.toString()

      // Try to parse complete JSON-RPC messages from the buffer.
      // MCP uses newline-delimited JSON or Content-Length headers.
      const lines = responseBuffer.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          const parsed = JSON.parse(line)
          if (parsed.id === id) {
            clearTimeout(timeout)
            serverProcess.stdout?.removeListener('data', onData)
            // Remove processed lines from buffer
            responseBuffer = lines.slice(i + 1).join('\n')
            resolve(parsed)
            return
          }
        } catch {
          // Not a complete JSON line yet, continue
        }
      }
    }

    serverProcess.stdout?.on('data', onData)

    // Write the message to stdin
    serverProcess.stdin?.write(message + '\n')
  })
}

beforeAll(() => {
  if (!process.env.SEMRUSH_API_KEY) {
    throw new Error(
      'SEMRUSH_API_KEY is required for MCP integration tests. Set it in your environment.'
    )
  }
})

describe('MCP Server — stdio Integration', () => {
  beforeAll(async () => {
    // Spawn the MCP server
    serverProcess = spawn('node', [SERVER_PATH], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Drain stderr so the process doesn't block (server logs go there)
    serverProcess.stderr?.resume()

    // Give the server a moment to start up
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }, 10000)

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM')
    }
  })

  it('responds to initialize request', async () => {
    const response = await sendRpcMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    })

    expect(response).toBeDefined()
    expect(response.result).toBeDefined()
    expect(response.result.protocolVersion).toBeDefined()
    expect(response.result.serverInfo).toBeDefined()
    expect(response.result.serverInfo.name).toBeDefined()

    console.log('MCP server info:', response.result.serverInfo)

    // Send initialized notification (required by protocol)
    serverProcess.stdin?.write(
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'
    )
  }, 15000)

  it('lists all 19 tools via tools/list', async () => {
    const response = await sendRpcMessage('tools/list', {})

    expect(response).toBeDefined()
    expect(response.result).toBeDefined()
    expect(response.result.tools).toBeDefined()
    expect(Array.isArray(response.result.tools)).toBe(true)

    const toolNames = response.result.tools.map((t: { name: string }) => t.name)
    console.log(`MCP server exposes ${toolNames.length} tools:`, toolNames)

    // Verify all 19 expected tools are present
    expect(toolNames.length).toBe(19)
    for (const expectedName of EXPECTED_TOOL_NAMES) {
      expect(toolNames).toContain(expectedName)
    }

    // Verify each tool has required fields
    for (const tool of response.result.tools) {
      expect(tool.name).toBeDefined()
      expect(typeof tool.name).toBe('string')
      expect(tool.description).toBeDefined()
      expect(typeof tool.description).toBe('string')
      expect(tool.inputSchema).toBeDefined()
    }
  }, 15000)

  it('calls semrush_api_units_balance tool and returns content', async () => {
    const response = await sendRpcMessage('tools/call', {
      name: 'semrush_api_units_balance',
      arguments: { check: true },
    })

    expect(response).toBeDefined()
    expect(response.result).toBeDefined()
    expect(response.result.content).toBeDefined()
    expect(Array.isArray(response.result.content)).toBe(true)
    expect(response.result.content.length).toBeGreaterThan(0)

    const textContent = response.result.content[0]
    expect(textContent.type).toBe('text')
    expect(textContent.text).toBeDefined()

    // The balance should be a parseable number
    const balanceText = textContent.text.replace(/"/g, '')
    const balance = Number(balanceText)
    expect(Number.isFinite(balance)).toBe(true)
    expect(balance).toBeGreaterThanOrEqual(0)

    console.log(`API units balance via MCP: ${balance}`)
  }, 30000)
})
