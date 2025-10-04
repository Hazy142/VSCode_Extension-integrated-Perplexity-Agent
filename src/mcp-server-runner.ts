import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "perplexity-mcp-server",
    version: "1.0.0"
  },
  {
    capabilities: { tools: {} }
  }
);

// Tools definieren
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description: "Perplexity AI Search",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      }
    ]
  };
});

// Tool-Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Argumente validieren und typisieren
  if (!request.params.arguments || typeof request.params.arguments !== "object") {
    throw new McpError(ErrorCode.InternalError, "Fehlende oder ungültige Argumente");
  }
  const args = request.params.arguments as { query?: unknown };

  // query extrahieren und validieren
  const query = args.query;
  if (typeof query !== "string") {
    throw new McpError(ErrorCode.InternalError, "Ungültiger query-Parameter");
  }

  if (request.params.name === "search") {
    return {
      content: [
        { type: "text", text: `Search: ${query}` }
      ]
    };
  }

  // Fallback für unbekannte Tools
  throw new McpError(ErrorCode.MethodNotFound, `Tool ${request.params.name} not found`);
});

// Server starten
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
