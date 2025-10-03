import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * This script runs the MCP server in a dedicated child process.
 */
async function main() {
    console.log("[MCP Server] Starting...");

    // 1. Create an MCP server instance
    const server = new McpServer({
        name: "perplexity-vscode-server",
        version: "1.0.0",
    });

    // 2. Define the schema for the tool
    const perplexitySearchSchema = z.object({
        query: z.string().describe("The search query."),
    });

    // 3. Register the PerplexitySearchTool
    server.registerTool(
        "perplexitySearch",
        {
            title: "Perplexity Search",
            description: "Searches the web using the Perplexity API.",
            inputSchema: perplexitySearchSchema.shape,
        },
        async (args: z.infer<typeof perplexitySearchSchema>) => {
            console.log(`[MCP Server] Executing PerplexitySearchTool with query: "${args.query}"`);
            // In a real implementation, this would call the PerplexityClient.
            const searchResult = "Search results for: " + args.query;
            return {
                content: [{ type: "text", text: searchResult }],
            };
        }
    );
    console.log('[MCP Server] Tool "perplexitySearch" registered.');

    // 4. Start the server with Stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("[MCP Server] Connected and listening via Stdio.");
}

// Run the server
main().catch(error => {
    console.error("[MCP Server] Failed to start:", error);
    process.exit(1);
});