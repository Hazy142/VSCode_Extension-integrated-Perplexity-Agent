# Perplexity Pro Extension for VSCode

Boosten Sie Ihr Coding mit der Perplexity Pro Extension für VSCode. Erhalten Sie agentenbasierte KI-Recherche, tiefgreifende Workspace-Analyse und intelligenten Chat direkt im Editor. Beschleunigen Sie Ihren Workflow mit kontextbezogenen Antworten und Code-Vorschlägen für Ihr gesamtes Projekt.

## Installation

1.  **Laden Sie die Extension herunter:**
    *   Navigieren Sie zum [VSCode Marketplace](https://marketplace.visualstudio.com/vscode).
    *   Suchen Sie nach "Perplexity Pro Extension".
    *   Klicken Sie auf **Install**.

2.  **Manuelle Installation (VSIX):**
    *   Laden Sie die `.vsix`-Datei von der [Releases-Seite](https://github.com/your-repo/releases) herunter.
    *   Öffnen Sie VSCode und gehen Sie zur Extensions-Ansicht (`Ctrl+Shift+X`).
    *   Klicken Sie auf die drei Punkte (...) und wählen Sie `Install from VSIX...`.
    *   Wählen Sie die heruntergeladene Datei aus.

## Schnelleinführung

1.  Öffnen Sie die Command Palette (`Ctrl+Shift+P`).
2.  Geben Sie `Perplexity` ein, um verfügbare Befehle anzuzeigen.
3.  Starten Sie mit `Perplexity: Hello World`, um die erfolgreiche Installation zu testen. Es sollte eine Informationsnachricht erscheinen.

## Entwicklung

Um an dieser Extension zu entwickeln, folgen Sie diesen Schritten:

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/your-publisher/perplexity-vscode-extension.git
    cd perplexity-vscode-extension
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

3.  **Kompilieren und Beobachten:**
    *   Führen Sie `npm run watch` aus, um den TypeScript-Compiler im Watch-Modus zu starten. Dieser kompiliert die Dateien bei jeder Änderung automatisch.

4.  **Debugging:**
    *   Drücken Sie `F5`, um eine neue VSCode-Instanz im "Extension Development Host" zu starten.
    *   Diese Instanz lädt Ihre Extension, sodass Sie Haltepunkte setzen und den Code in `src/extension.ts` debuggen können.
    *   Änderungen am Code erfordern einen Neustart des Debuggers.