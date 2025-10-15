# REFACT-002: OpenAI SDK Integration Strategy & Dependency Mapping

Dieses Dokument beschreibt die Integrationsstrategie für den Austausch von `axios` durch das offizielle `openai` SDK.

### 1. Vorgeschlagene `package.json`-Änderungen

Für die Migration werden die folgenden Änderungen an den Abhängigkeiten vorgeschlagen. `axios` wird entfernt und `openai` in der zuvor ermittelten Version hinzugefügt.

```json
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.10.1",
    "@types/lru-cache": "^7.10.9",
    "lru-cache": "^11.2.2",
    "openai": "^6.3.0",
    "zod": "^3.22.4"
  }
```
*(Anmerkung: `axios` wird aus dieser Liste entfernt.)*

### 2. Migration-Roadmap & Strategie

**1. Zielarchitektur & SDK-Konfiguration**

*   **Primäres Ziel:** Vollständige Ersetzung von `axios` durch das offizielle `openai` SDK.
*   **Kompatibilität:** Die Perplexity API ist OpenAI-kompatibel. Die Integration erfolgt durch die Konfiguration des `OpenAI` Clients mit einem `baseURL` Override, der auf `https://api.perplexity.ai` zeigt.

**2. Implementierungsstrategie**

*   **Fokus:** Das Refactoring konzentriert sich auf `src/services/PerplexityClient.ts`.
*   **Interface-Stabilität:** Die öffentlichen Methoden (`search`, `testConnection`) der `PerplexityClient`-Klasse werden in ihrer Signatur **nicht** verändert. Dies stellt sicher, dass keine aufrufenden Komponenten angepasst werden müssen (Zero Breaking Changes).
*   **Fehlerbehandlung:** Das generische `catch (error: any)` wird durch das strukturierte Error-Handling des OpenAI SDKs ersetzt.

**3. Zukünftige Erweiterbarkeit (Provider Abstraction)**

*   Obwohl in diesem Schritt noch nicht implementiert, wird das Refactoring so gestaltet, dass in Zukunft leicht ein Abstraktionslayer (Provider-Pattern) eingeführt werden kann, um weitere LLM-Provider zu unterstützen.

**4. Validierung**

*   Die Validierung erfolgt zunächst durch erfolgreiche Kompilierung und anschließend durch die Anpassung und erfolgreiche Ausführung der bestehenden Test-Suite.
