import React, { useState } from 'react';
import { 
  Layers, 
  Database, 
  Cpu, 
  Terminal, 
  Server, 
  FileCode, 
  Copy, 
  Check, 
  ArrowRight,
  GitBranch,
  ShieldAlert,
  Zap
} from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('docker-compose.yml');
  const [copied, setCopied] = useState(false);

  const fileContents: Record<string, { lang: string; code: string; desc: string }> = {
    'docker-compose.yml': {
      lang: 'yaml',
      desc: 'Multi-service production container topology orchestrating PostgreSQL with pgvector, Redis, Express Backend Gateway, MCP Stdio/SSE Server, and RAG service.',
      code: `version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: foodify_postgres
    environment:
      POSTGRES_USER: foodify
      POSTGRES_PASSWORD: foodify_secure_password
      POSTGRES_DB: foodify_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: foodify_redis
    ports:
      - "6379:6379"

  foodify-backend:
    build: .
    container_name: foodify_backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://foodify:foodify_secure_password@postgres:5432/foodify_db
      REDIS_URL: redis://redis:6379
      GEMINI_API_KEY: \${GEMINI_API_KEY}

  mcp-server:
    build: ./mcp-server
    container_name: foodify_mcp
    ports:
      - "3001:3001"

  rag-service:
    build: ./rag-pipeline
    container_name: foodify_rag
    ports:
      - "8000:8000"`
    },

    'schema.prisma': {
      lang: 'prisma',
      desc: 'Relational ACID schema with pgvector extension for dense 768-dimensional embeddings, user dietary profiles, and order status transitions.',
      code: `datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

model User {
  id                 String         @id @default(uuid())
  email              String         @unique
  name               String
  role               Role           @default(CUSTOMER)
  dietaryPreferences String[]       // ["vegan", "gluten-free"]
  allergens          String[]       // ["peanuts", "dairy"]
  defaultZipCode     String
  orders             Order[]
}

model Restaurant {
  id                 String       @id @default(uuid())
  name               String
  cuisine            String[]
  rating             Decimal      @default(5.0) @db.Decimal(2, 1)
  deliveryFee        Decimal      @db.Decimal(10, 2)
  servicedZipCodes   String[]
  menuItems          MenuItem[]
  orders             Order[]
}

model MenuItem {
  id              String           @id @default(uuid())
  restaurantId    String
  restaurant      Restaurant       @relation(fields: [restaurantId], references: [id])
  name            String
  price           Decimal          @db.Decimal(10, 2)
  dietaryTags     String[]
  allergens       String[]
  calories        Int
  proteinGrams    Int
  embeddingChunk  EmbeddingChunk?
}

model EmbeddingChunk {
  id         String                 @id @default(uuid())
  menuItemId String                 @unique
  menuItem   MenuItem               @relation(fields: [menuItemId], references: [id])
  chunkText  String                 @db.Text
  vector     Unsupported("vector")? // 768-dim Gemini vector
}`
    },

    'hybrid_retriever.py': {
      lang: 'python',
      desc: 'Python hybrid retrieval implementation fusing dense vector cosine similarity with BM25 sparse keyword matching and dietary constraints.',
      code: `def hybrid_search(
    query: str,
    query_embedding: List[float],
    corpus: List[Dict[str, Any]],
    user_dietary_restrictions: Optional[List[str]] = None,
    user_allergens: Optional[List[str]] = None,
    alpha: float = 0.65,  # Weight for dense vector similarity
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    1. Hard filter: Purge fatal allergens
    2. Dense similarity: Cosine(query_embedding, chunk_vector)
    3. Sparse similarity: BM25 token overlap
    4. Fusion score: alpha * dense + (1 - alpha) * sparse + dietary_bonus
    """
    user_dietary = set(d.lower() for d in (user_dietary_restrictions or []))
    allergens = set(a.lower() for a in (user_allergens or []))
    scored = []

    for item in corpus:
        item_allergens = set(a.lower() for a in item["metadata"].get("allergens", []))
        if allergens and any(a in item_allergens for a in allergens):
            continue  # Hard safety gate

        dense = cosine_similarity(query_embedding, item.get("embedding", []))
        sparse = compute_lexical_score(query, item.get("chunk_text", ""))
        dietary_matches = len(user_dietary.intersection(item["metadata"].get("dietary_tags", [])))
        dietary_boost = 0.15 * min(2, dietary_matches)

        score = (alpha * dense) + ((1.0 - alpha) * sparse) + dietary_boost
        scored.append({"dish": item["dish_name"], "score": round(score, 4)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]`
    },

    'mcp-server.ts': {
      lang: 'typescript',
      desc: 'Model Context Protocol (MCP) server registering tools and resources per the JSON-RPC 2.0 Anthropic MCP specification.',
      code: `export class FoodifyMcpServer {
  getTools(): McpToolDefinition[] {
    return [
      {
        name: 'get_restaurant_menu',
        description: 'Retrieves complete menu, allergens, and macros for a restaurant.',
        inputSchema: {
          type: 'object',
          properties: {
            restaurant_id: { type: 'string', description: 'Restaurant ID' }
          },
          required: ['restaurant_id']
        }
      },
      {
        name: 'check_delivery_availability',
        description: 'Verifies delivery eligibility and merchant count for a ZIP code.',
        inputSchema: {
          type: 'object',
          properties: {
            zip_code: { type: 'string', description: '5-digit US ZIP code' }
          },
          required: ['zip_code']
        }
      },
      {
        name: 'analyze_user_order_history',
        description: 'Analyzes past customer orders, dietary adherence, and churn risk.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'Unique customer ID' }
          },
          required: ['user_id']
        }
      }
    ];
  }
}`
    }
  };

  const currentFileData = fileContents[selectedFile];

  return (
    <div className="space-y-10 pb-20 text-slate-100">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            System Architecture & Technical Specifications
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
            Enterprise Tier
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Clean decoupled architecture: Controller-Service-Repository backend pattern, RAG hybrid search pipeline, Model Context Protocol server, and PostgreSQL pgvector models.
        </p>
      </div>

      {/* Visual Decoupled Architecture Topology */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Decoupled Microservice Topology
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          
          {/* Node 1 */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 flex flex-col items-center justify-between space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">LLM Clients & Claude</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Model Context Protocol</p>
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded">
              JSON-RPC 2.0 (stdio/SSE)
            </span>
          </div>

          {/* Node 2 */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-emerald-500/40 flex flex-col items-center justify-between space-y-2 ring-1 ring-emerald-500/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Foodify Gateway & MCP</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Express Controller/Service Layer</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
              Port 3000 / REST + SSE
            </span>
          </div>

          {/* Node 3 */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 flex flex-col items-center justify-between space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">RAG Hybrid Search Engine</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">BM25 + Cosine + Allergen Gate</p>
            </div>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded">
              768-dim Embeddings
            </span>
          </div>

          {/* Node 4 */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 flex flex-col items-center justify-between space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">PostgreSQL & pgvector</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">ACID Orders & Vector Storage</p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded">
              Prisma ORM Models
            </span>
          </div>

        </div>
      </div>

      {/* Interactive Code & Config File Viewer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Production Configuration & Code Inspector
            </h2>
          </div>

          {/* File Tab Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {Object.keys(fileContents).map(fileName => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedFile === fileName
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {fileName}
              </button>
            ))}
          </div>
        </div>

        {/* File Description */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 pb-2 border-b border-slate-800">
          <span>{currentFileData.desc}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(currentFileData.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center space-x-1 text-slate-400 hover:text-white shrink-0 ml-4"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Block */}
        <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-96 leading-relaxed">
          {currentFileData.code}
        </pre>
      </div>

    </div>
  );
};
