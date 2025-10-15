# REFACT-001: Repository Deep-Analysis & Bestandsaufnahme

Dies ist das Ergebnis der initialen Analyse gemäß dem Prompt REFACT-001.

### Migrationspfad

| Dateiname                          | Aktuelle Implementierung                                   | Refactoring-Aufwand        | Risiko |
| :--------------------------------- | :--------------------------------------------------------- | :------------------------- | :----- |
| `src/services/PerplexityClient.ts` | Direkte API-Aufrufe via `axios.post`. Generisches `try/catch`-Error-Handling. | **Mittel** (ca. 1.5h)      | **Gering**. Das öffentliche Klassen-Interface bleibt stabil, was Änderungen in anderen Teilen der Extension minimiert. |
| `package.json`                     | Enthält `axios` als Projektabhängigkeit.                       | **Gering** (ca. 0.25h)     | **Gering**. Standardmäßiger Austausch einer NPM-Abhängigkeit. |
