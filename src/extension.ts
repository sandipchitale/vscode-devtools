import * as vscode from "vscode";
import axios from "axios";

export function activate({ subscriptions }: vscode.ExtensionContext) {
  // Track currently webview panel
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let currentUrl = 'http://localhost:9222';

  // register a command that opens tasklist buffer
  subscriptions.push(
    vscode.commands.registerCommand("vscode-devtools", async () => {
      const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One;

      if (currentPanel) {
        // If we already have a panel, show it in the target column
        currentPanel.reveal(columnToShowIn);
      } else {

        const debugees = (await axios.get(`${currentUrl}/json`)).data;

        // Otherwise, create a new panel
        currentPanel = vscode.window.createWebviewPanel(
          'devtools',
          'Devtools',
          columnToShowIn!,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );
        currentPanel.webview.html = getWebviewContent();

        // Reset when the current panel is closed
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
            currentUrl = 'http://localhost:9222';
          },
          null,
          subscriptions
        );

        currentPanel.webview.onDidReceiveMessage(
          message => {
            switch (message.command) {
              case 'currentUrl':
                currentUrl = message.currentUrl;
                return;
            }
          },
          undefined,
          subscriptions
        );
      }
    })
  );

  function getWebviewContent() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Devtools</title>
          <style>
            * {
              box-sizing: border-box;;
            }
            html,body {
              width: 100vw;
              height: 100vh;
            }
            body {
              padding: 0;
              margin: 0;
              background-color: white;
              color: black;
            }
            iframe {
              outline: 1px solid #999;
            }
          </style>
      </head>
      <body>
        <iframe id="devtools" width="100%" height="100%" src="${currentUrl}"></iframe>
      </body>
      </html>
    `;
  }
}
