# REFACT-003: Architecture Assessment & Gap Analysis

Dieses Dokument bewertet die aktuelle Architektur und identifiziert die Lücken für die Migration zum `openai` SDK und die Implementierung erweiterter Features.

### Gap-Analysis-Report

| Komponente | Current State (Aktueller Zustand) | Target State (Zielzustand) | Gap (Lücke) | Effort (Aufwand) | Risk (Risiko) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Client (`PerplexityClient`)** | `axios`-basierter direkter HTTP-Client. | `openai`-SDK-basierter, konfigurierter Client. | Die Kernlogik für API-Anfragen muss von `axios` auf die Methoden und Datenstrukturen des `openai` SDKs umgeschrieben werden. | **Mittel** (ca. 1.5h) | **Gering**. Die Schnittstelle der Klasse bleibt unverändert. |
| **Fehlerbehandlung** | Generisches `try/catch`-Blocking. | Strukturierte, spezifische Fehlerbehandlung. | Es fehlt eine Logik, die die spezifischen Fehlertypen des `openai` SDKs erkennt und unterschiedlich behandelt. | **Gering** (ca. 0.5h) | **Gering**. Verbessert die Stabilität. |
| **Testing Framework** | Test-Suite mockt `axios`-Aufrufe und -Antworten. | Test-Suite muss den `openai` SDK-Client mocken. | Die bestehenden Test-Mocks sind inkompatibel und müssen komplett neu für das `openai` SDK geschrieben werden. | **Mittel** (ca. 1.0h) | **Gering**. Notwendige Anpassung, um Qualität zu sichern. |
| **Streaming-Fähigkeit** | Nicht vorhanden. Reines Request-Response-Muster. | Architektur unterstützt Token-by-Token-Streaming vom Client zum Webview. | Es fehlt die gesamte Infrastruktur für Streaming, sowohl im Backend (Client) als auch im Frontend (Webview). | **Hoch** (ca. 3-4h) | **Mittel**. Signifikante Funktionserweiterung, die die UI-Logik stark beeinflusst. |
| **MCP-Integration** | `MCPServer` ist als Stub vorhanden, aber nicht funktional verknüpft. | `PerplexityClient`-Funktionen sind als "Tools" im MCP-Server registriert und aufrufbar. | Es fehlt die komplette Implementierung der MCP-Tools, die die Funktionalität des `PerplexityClient` kapseln. | **Hoch** (ca. 4-5h) | **Mittel**. Erfordert detaillierte Implementierung gemäß MCP-Spezifikation. |
