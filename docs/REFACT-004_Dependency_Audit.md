# REFACT-004: Dependency Mapping & Version Audit

Dieses Dokument enthält den Plan für die Migration der Projektabhängigkeiten.

### Dependency-Migrationsplan

| Package | Current Version | Target Version | Conflicts | Security | Bundle-Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`axios`** | `^1.6.8` | *(entfernt)* | Keine | N/A | **Positiv**. Entfernt die Bibliothek und ihre transitiven Abhängigkeiten. |
| **`openai`** | *(nicht vorhanden)* | `^6.3.0` | Keine | **OK** (Überprüfung via `npm audit` in späterem Schritt) | **Gering**. Die Bibliothek ist für den Einsatz in Bundles optimiert. |
| `@modelcontextprotocol/sdk` | `^1.10.1` | `^1.10.1` | Keine | OK | Keine Änderung. |
| `lru-cache` | `^11.2.2` | `^11.2.2` | Keine | OK | Keine Änderung. |
| `zod` | `^3.22.4` | `^3.22.4` | Keine | OK | Keine Änderung. |

### Zusammenfassung

*   **Migration:** Die Migration der Abhängigkeiten ist unkompliziert und birgt keine Konflikte.
*   **Security:** Ein expliziter `npm audit` wird nach der tatsächlichen Installation der neuen Pakete in der Migrationsphase durchgeführt, wird aber als risikoarm eingeschätzt.
*   **Performance:** Der Austausch wird voraussichtlich eine neutrale bis leicht positive Auswirkung auf die finale Bundle-Größe haben.
