import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
/**
 * MCPServer Grundgerüst
 *
 * Diese Datei initialisiert den MCP-Server, registriert die grundlegenden Tools
 * und startet die Kommunikation über Stdio, wie im Projektplan für Woche 1 vorgesehen.
 */
// 1. Erstelle eine MCP-Server-Instanz
const server = new McpServer({
    name: "perplexity-vscode-server",
    version: "1.0.0",
});
// 2. Definiere das Schema für das Tool
const perplexitySearchSchema = z.object({
    query: z.string().describe("The search query."),
});
// 3. Registriere ein Beispiel-Tool (PerplexitySearchTool)
server.registerTool("perplexitySearch", {
    title: "Perplexity Search",
    description: "Searches the web using the Perplexity API.",
    // Das rohe Schema-Objekt wird direkt übergeben
    inputSchema: perplexitySearchSchema.shape,
}, 
// Die 'execute'-Logik wird als Handler-Funktion übergeben, jetzt typsicher
async (args) => {
    console.log(`Executing PerplexitySearchTool with query: "${args.query}"`);
    // Hier wird später der PerplexityClient aufgerufen
    const searchResult = "Search results for: " + args.query;
    // Das Tool-Ergebnis muss im vom SDK erwarteten Format zurückgegeben werden
    return {
        content: [{ type: "text", text: searchResult }],
    };
});
console.log('Tool "perplexitySearch" registered.');
/**
 * Startet den Server und verbindet ihn mit einem Transportmittel.
 * Für eine VSCode-Erweiterung ist Stdio (Standard Input/Output) der übliche Weg.
 */
export async function startMCPServer() {
    console.log("Starting MCP Server...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP Server connected and listening via Stdio.");
}
//# sourceMappingURL=MCPServer.js.map