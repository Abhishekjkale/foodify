import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Code, 
  Cpu, 
  Layers, 
  ExternalLink,
  CheckCircle2,
  Wrench,
  FileText
} from 'lucide-react';
import { McpToolDefinition, McpResourceDefinition } from '../../mcp-server/src/types';

export const McpInspector: React.FC = () => {
  const [tools, setTools] = useState<McpToolDefinition[]>([]);
  const [resources, setResources] = useState<McpResourceDefinition[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('get_restaurant_menu');
  const [argsJson, setArgsJson] = useState<string>('{\n  "restaurant_id": "rest_01"\n}');
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  useEffect(() => {
    fetch('/api/mcp/tools')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setTools(res.tools || []);
          setResources(res.resources || []);
        }
      })
      .catch(console.error);

    // Initial execute
    handleExecuteTool('get_restaurant_menu', { restaurant_id: 'rest_01' });
  }, []);

  const handleSelectTool = (toolName: string) => {
    setSelectedTool(toolName);
    if (toolName === 'get_restaurant_menu') {
      setArgsJson('{\n  "restaurant_id": "rest_01"\n}');
    } else if (toolName === 'check_delivery_availability') {
      setArgsJson('{\n  "zip_code": "94107"\n}');
    } else if (toolName === 'analyze_user_order_history') {
      setArgsJson('{\n  "user_id": "usr_sarah_01"\n}');
    }
  };

  const handleExecuteTool = async (tName?: string, directArgs?: any) => {
    const targetTool = tName || selectedTool;
    setExecuting(true);

    let parsedArgs = directArgs;
    if (!parsedArgs) {
      try {
        parsedArgs = JSON.parse(argsJson);
      } catch (e) {
        alert('Invalid JSON in arguments input.');
        setExecuting(false);
        return;
      }
    }

    const jsonRpcRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: targetTool,
        arguments: parsedArgs
      }
    };

    setLastRequest(jsonRpcRequest);

    try {
      const res = await fetch('/api/mcp/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonRpcRequest)
      }).then(r => r.json());

      setLastResponse(res);
    } catch (err) {
      setLastResponse({ error: 'Network failure invoking MCP server.' });
    } finally {
      setExecuting(false);
    }
  };

  const claudeConfigSnippet = JSON.stringify({
    mcpServers: {
      foodify: {
        command: "node",
        args: ["-r", "tsx/register", "./mcp-server/src/transports/stdio.ts"],
        env: {
          NODE_ENV: "production",
          DATABASE_URL: "postgresql://foodify:postgres@localhost:5432/foodify_db"
        }
      }
    }
  }, null, 2);

  return (
    <div className="space-y-10 pb-20 text-slate-100">
      
      {/* View Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Model Context Protocol (MCP) Inspector
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              JSON-RPC 2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Compliant with official Model Context Protocol specifications (v1.0). Exposes Foodify’s internal transactional database safely to Claude Desktop and autonomous AI agents.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Transport:</span>
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400">
            stdio + SSE (/api/mcp/sse)
          </span>
        </div>
      </div>

      {/* Protocol Architecture Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Enterprise MCP Sandbox</h2>
            <p className="text-xs text-slate-400">
              Live testing console allowing full inspection of serialized JSON-RPC 2.0 request/response frames.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right text-xs">
            <span className="text-slate-400 block font-medium">Registered Tools</span>
            <span className="text-emerald-400 font-bold font-mono">{tools.length} Tools</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-right text-xs">
            <span className="text-slate-400 block font-medium">Resources</span>
            <span className="text-teal-400 font-bold font-mono">{resources.length} Resources</span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Registered Tools & Form */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tool Selector */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Registered MCP Tools</span>
            </div>

            <div className="space-y-2">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  onClick={() => handleSelectTool(tool.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTool === tool.name
                      ? 'bg-emerald-950/30 border-emerald-500 text-white'
                      : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">{tool.name}</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                      tool
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{tool.description}</p>
                </div>
              ))}
            </div>

            {/* Arguments Editor */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Tool Arguments (JSON)</span>
                <span className="text-[10px] text-slate-500 font-mono">inputSchema validated</span>
              </div>
              <textarea
                id="mcp-args-textarea"
                rows={4}
                value={argsJson}
                onChange={(e) => setArgsJson(e.target.value)}
                className="w-full bg-slate-950 font-mono text-xs text-emerald-300 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              id="execute-mcp-tool-btn"
              onClick={() => handleExecuteTool()}
              disabled={executing}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md shadow-emerald-500/10"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>{executing ? 'Executing RPC...' : `Execute Tool '${selectedTool}'`}</span>
            </button>
          </div>

          {/* Registered Resources */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Read-Only Resources Exposed</span>
            </div>

            <div className="space-y-2">
              {resources.map((res) => (
                <div key={res.uri} className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800 text-xs">
                  <span className="font-mono text-emerald-400 font-semibold block">{res.uri}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{res.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Serialized JSON-RPC 2.0 Wire Frames */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Request Payload */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white uppercase tracking-wider">JSON-RPC 2.0 Request Frame</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(lastRequest, null, 2));
                  setCopiedReq(true);
                  setTimeout(() => setCopiedReq(false), 1500);
                }}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copiedReq ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReq ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-48 leading-relaxed">
              {lastRequest ? JSON.stringify(lastRequest, null, 2) : '// No call executed yet'}
            </pre>
          </div>

          {/* Response Payload */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-white uppercase tracking-wider">JSON-RPC 2.0 Response Frame</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(lastResponse, null, 2));
                  setCopiedRes(true);
                  setTimeout(() => setCopiedRes(false), 1500);
                }}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copiedRes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRes ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 overflow-x-auto max-h-80 leading-relaxed">
              {lastResponse ? JSON.stringify(lastResponse, null, 2) : '// Awaiting response'}
            </pre>
          </div>

          {/* Claude Desktop Configuration Snippet */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white uppercase tracking-wider">Claude Desktop Integration</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(claudeConfigSnippet);
                  setCopiedConfig(true);
                  setTimeout(() => setCopiedConfig(false), 1500);
                }}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedConfig ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste this block into your local <code className="text-amber-300 font-mono">claude_desktop_config.json</code> to give Claude direct access to Foodify's restaurant catalogs and order analytics.
            </p>
            <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-400 border border-slate-800 overflow-x-auto leading-relaxed">
              {claudeConfigSnippet}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
