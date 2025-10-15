
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const acquireVsCodeApi: () => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vscode: any;

try {
    vscode = acquireVsCodeApi();
} catch (error) {
    console.warn('Could not acquire VS Code API. Using mock implementation.');
    vscode = {
        postMessage: (message: unknown) => {
            console.log('postMessage (mock):', message);
            // Simulate a delayed response for testing purposes
            setTimeout(() => {
                window.dispatchEvent(new MessageEvent('message', {
                    data: {
                        command: 'searchResult',
                        data: {
                            answer: "This is a mock response from the browser.",
                            sources: [],
                            followUpQuestions: [],
                        }
                    }
                }));
            }, 1500);
        }
    };
}

export { vscode };
