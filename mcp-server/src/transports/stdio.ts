/**
 * Model Context Protocol - Standard I/O (stdio) Transport
 * Reads line-delimited JSON-RPC from standard input and writes JSON-RPC responses to standard output.
 * Designed for direct integration with Claude Desktop, Cursor, or CLI agents.
 */

import * as readline from 'readline';
import { FoodifyMcpServer } from '../server';
import { JsonRpcRequest } from '../types';

async function startStdioTransport() {
  const mcpServer = new FoodifyMcpServer();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  process.stderr.write('[Foodify-MCP] Stdio Transport Initialized. Listening for JSON-RPC 2.0...\n');

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request: JsonRpcRequest = JSON.parse(trimmed);
      const response = await mcpServer.handleRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: `Parse error: ${message}`
          }
        }) + '\n'
      );
    }
  });
}

if (process.env.RUN_STDIO === 'true' || require.main === module) {
  startStdioTransport();
}

export { startStdioTransport };
