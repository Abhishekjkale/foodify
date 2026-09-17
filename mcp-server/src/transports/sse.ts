/**
 * Model Context Protocol - Server-Sent Events (SSE) Transport Handler
 * Facilitates remote MCP connectivity over HTTP/SSE.
 */

import { Request, Response } from 'express';
import { FoodifyMcpServer } from '../server';
import { JsonRpcRequest } from '../types';

export class McpSseTransport {
  private mcpServer: FoodifyMcpServer;
  private sseClients: Set<Response> = new Set();

  constructor(mcpServer: FoodifyMcpServer) {
    this.mcpServer = mcpServer;
  }

  handleSseConnect = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    this.sseClients.add(res);

    // Send endpoint notification per MCP SSE specification
    const endpointEvent = {
      event: 'endpoint',
      data: '/api/mcp/message'
    };
    res.write(`event: ${endpointEvent.event}\ndata: ${endpointEvent.data}\n\n`);

    req.on('close', () => {
      this.sseClients.delete(res);
    });
  };

  handleJsonRpcMessage = async (req: Request, res: Response) => {
    try {
      const request: JsonRpcRequest = req.body;
      const response = await this.mcpServer.handleRequest(request);
      res.json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id ?? null,
        error: {
          code: -32603,
          message: `Internal error: ${message}`
        }
      });
    }
  };
}
