# REFACT-005: Implementation Planning & Resource Allocation

Dieses Dokument ist der finale Implementierungsplan für die Phasen 2, 3 und 4 des Refactorings, basierend auf den Ergebnissen der Foundation-Phase.

### Detaillierte Implementierungs-Roadmap

**Gesamtbudget:** 37 Stunden | **Geplante Zeit:** 26.5 Stunden | **Puffer:** 10.5 Stunden

| Phase | Tasks (Zusammenfassung der Prompts) | Dauer (geschätzt) | Dependencies (Abhängigkeiten) | Quality Gate (Erfolgskriterium) |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 2: Migration** <br> (REFACT-006 bis -015) | - `PerplexityClient` auf `openai` SDK umstellen <br> - Fehlerbehandlung & Tests migrieren <br> - Streaming-Grundlagen implementieren <br> - API-Keys sichern & Performance optimieren | **~10.5 Stunden** | Abschluss von Phase 1 (Foundation) | Der `PerplexityClient` ist vollständig migriert, alle bestehenden Tests sind grün. Die öffentliche API der Extension hat keine Breaking Changes. |
| **Phase 3: Enhancement** <br> (REFACT-016 bis -025) | - MCP-Server mit Function Calling integrieren <br> - Streaming-UI im Webview implementieren <br> - Security (Permissions, Sandboxing) härten <br> - Kern-Tools implementieren (Workspace, Code, Docs) | **~12.5 Stunden** | Stabiler, migrierter API-Client aus Phase 2 | Der MCP-Server ist funktional und die Kern-Tools liefern zuverlässige Ergebnisse. Streaming ist im UI sichtbar und funktioniert. |
| **Phase 4: Production** <br> (REFACT-026 bis -030) | - CI/CD-Pipeline erweitern (Security, Benchmarks) <br> - Dokumentation automatisieren <br> - Finalen Security-Audit durchführen <br> - Release vorbereiten (Versioning, Changelog) | **~3.5 Stunden** | Alle Features aus Phase 3 sind "feature complete" | Die CI/CD-Pipeline läuft erfolgreich durch. Das VSIX-Paket ist signiert und bereit für die Veröffentlichung. Der Security-Audit ist bestanden. |

### Risikobetrachtung

*   **Hauptrisiko:** Die Implementierung von Streaming (Phase 3) ist die komplexeste Einzelaufgabe und könnte mehr Zeit als geplant beanspruchen.
*   **Mitigation:** Der Zeitpuffer von 10.5 Stunden ist primär für unvorhergesehene Herausforderungen bei Streaming und der MCP-Integration vorgesehen.
