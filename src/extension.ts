import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "perplexity-vscode-extension" is now active!');

    // Registrieren Sie den Befehl, um die Webview zu öffnen
    let showChatCommand = vscode.commands.registerCommand('perplexity-vscode.showChat', () => {
        // Erstellen und zeigen Sie ein neues Webview-Panel
        const panel = vscode.window.createWebviewPanel(
            'perplexityChat', // Interner Typ der Webview. Muss eindeutig sein.
            'Perplexity Chat', // Titel, der im Panel-Tab angezeigt wird
            vscode.ViewColumn.Two, // Zeigt die Webview in einer separaten Spalte an
            {
                enableScripts: true,
                // Beschränken Sie die Webview auf das Laden von Inhalten aus unserem 'webview/dist'-Verzeichnis
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist')]
            }
        );

        const webviewDistPath = vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist');
        const htmlPath = vscode.Uri.joinPath(webviewDistPath, 'index.html');
        
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Ersetzen Sie die Pfade in der HTML, damit sie in der Webview korrekt geladen werden
        const baseUri = panel.webview.asWebviewUri(webviewDistPath);
        // Wir ersetzen den Basis-Href, um auf den korrekten Pfad zu verweisen
        htmlContent = htmlContent.replace(/<base href="\/">/, `<base href="${baseUri}/">`);
        
        panel.webview.html = htmlContent;

        // Hier kommt die Logik für die Kommunikation (onDidReceiveMessage)
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'search':
                        vscode.window.showInformationMessage(`Nachricht vom Chat erhalten: ${message.text}`);
                        // Hier rufen Sie Ihren PerplexityClient auf und senden das Ergebnis zurück
                        // Beispiel:
                        panel.webview.postMessage({ command: 'searchResult', data: { answer: `Antwort auf: ${message.text}`, sources: [], followUpQuestions: [] } });
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(showChatCommand);
}

export function deactivate() {}