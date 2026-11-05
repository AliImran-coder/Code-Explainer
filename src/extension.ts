
import * as vscode from "vscode";
import sanitizeHtml from "sanitize-html";

interface GroqResponse {
  error?: {
    message?: string;
  };
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

export function activate(context: vscode.ExtensionContext) {
  let explanationPanel: vscode.WebviewPanel | undefined;

  // Command 1: Explain Selected Code
  const explainCommand = vscode.commands.registerCommand(
    "code-explainer-fresh.explainSelection",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showInformationMessage(
          "Please open a code file first."
        );
        return;
      }

      const selectedCode = editor.document.getText(editor.selection);

      if (!selectedCode.trim()) {
        vscode.window.showInformationMessage(
          "Please select some code first."
        );
        return;
      }

      const apiKey = await context.secrets.get(
        "codeExplainer.groqApiKey"
      );

      if (!apiKey) {
        vscode.window.showErrorMessage(
          "Please set your Groq API key first."
        );
        return;
      }

      const language = editor.document.languageId;

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Code Explainer is analyzing your code...",
            cancellable: false
          },
          async () => {
            const response = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                  model: "openai/gpt-oss-20b",
                  messages: [
                    {
                      role: "system",
                      content: `You are Code Explainer, a professional programming teacher.

Explain selected code in simple English for beginners.

Use proper Markdown formatting.

Follow this structure:

## 1. What Does This Code Do?
Explain the purpose in simple sentences.

## 2. Important Concepts
Use bullet points. Make concept names bold.

## 3. Step-by-Step Execution
When the steps contain structured information, use a proper Markdown table with columns such as Step, Action, and Explanation.
Otherwise, use a numbered list.

## 4. Code Breakdown
Explain important lines using code blocks when useful.

## 5. Example
Give a practical example when helpful.

## 6. Final Result
Show the final output in a code block when it can be determined.

Rules:
- Use proper Markdown headings, bold text, tables, lists and code blocks.
- Keep explanations clear and beginner-friendly.
- Do not force tables when they are unnecessary.
- Explain only relevant concepts.
- Do not invent missing information.
- If the selected code is incomplete, mention it.
- Avoid unnecessary repetition.`
                    },
                    {
                      role: "user",
                      content: `Programming language: ${language}

Explain this selected code:

${selectedCode}`
                    }
                  ],
                  temperature: 0.3,
                  max_completion_tokens: 1500
                })
              }
            );

            const data = await response.json() as GroqResponse;

            if (!response.ok) {
              throw new Error(
                data.error?.message || "Groq API request failed."
              );
            }

            const explanation = data.choices?.[0]?.message?.content;

            if (!explanation) {
              throw new Error("No explanation was returned.");
            }

            // Convert Markdown into HTML
            const { marked } = await import("marked");

            const markdownHtml = await marked.parse(explanation);

            // Sanitize HTML before displaying it
            const safeHtml = sanitizeHtml(markdownHtml, {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                "h1",
                "h2",
                "h3",
                "h4",
                "pre",
                "code",
                "table",
                "thead",
                "tbody",
                "tr",
                "th",
                "td",
                "del",
                "input"
              ]),
              allowedAttributes: {
                "*": ["class"],
                a: ["href", "target", "rel"],
                input: ["type", "checked", "disabled"]
              }
            });

            // Create or reveal Webview
            if (explanationPanel) {
              explanationPanel.reveal(vscode.ViewColumn.Beside);
            } else {
              explanationPanel = vscode.window.createWebviewPanel(
                "codeExplainer",
                "Code Explainer",
                vscode.ViewColumn.Beside,
                {
                  enableScripts: false
                }
              );

              explanationPanel.onDidDispose(() => {
                explanationPanel = undefined;
              });
            }

            // Display formatted explanation
            explanationPanel.webview.html = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">

                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                >

                <title>Code Explainer</title>

                <style>
                  body {
                    padding: 25px;
                    max-width: 900px;
                    margin: auto;
                    color: var(--vscode-editor-foreground);
                    background: var(--vscode-editor-background);
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    line-height: 1.7;
                  }

                  h1, h2, h3 {
                    color: var(--vscode-textLink-foreground);
                    margin-top: 28px;
                    margin-bottom: 12px;
                  }

                  h1 {
                    font-size: 25px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 12px;
                  }

                  h2 {
                    font-size: 19px;
                  }

                  h3 {
                    font-size: 16px;
                  }

                  p {
                    margin: 12px 0;
                  }

                  strong {
                    font-weight: 700;
                    color: var(--vscode-textPreformat-foreground);
                  }

                  ul, ol {
                    padding-left: 25px;
                  }

                  li {
                    margin-bottom: 8px;
                  }

                  code {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 3px 6px;
                    border-radius: 4px;
                    font-family: var(--vscode-editor-font-family);
                  }

                  pre {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 8px;
                    overflow-x: auto;
                  }

                  pre code {
                    padding: 0;
                    background: transparent;
                  }

                  table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 18px 0;
                    display: block;
                    overflow-x: auto;
                  }

                  th, td {
                    border: 1px solid var(--vscode-panel-border);
                    padding: 10px;
                    text-align: left;
                  }

                  th {
                    background: var(--vscode-sideBar-background);
                    font-weight: 600;
                  }

                  blockquote {
                    border-left: 3px solid var(--vscode-textLink-foreground);
                    padding-left: 15px;
                    margin-left: 0;
                    color: var(--vscode-descriptionForeground);
                  }

                  hr {
                    border: none;
                    border-top: 1px solid var(--vscode-panel-border);
                    margin: 25px 0;
                  }

                  a {
                    color: var(--vscode-textLink-foreground);
                  }
                </style>
              </head>

              <body>
                <h1>✨ Code Explainer</h1>
                ${safeHtml}
              </body>
              </html>
            `;
          }
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong.";

        vscode.window.showErrorMessage(
          `Code Explainer: ${message}`
        );
      }
    }
  );

  // Command 2: Save Groq API Key
  const setApiKeyCommand = vscode.commands.registerCommand(
    "code-explainer-fresh.setApiKey",
    async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Groq API Key",
        password: true,
        placeHolder: "Paste your Groq API Key here",
        ignoreFocusOut: true
      });

      if (!apiKey?.trim()) {
        return;
      }

      await context.secrets.store(
        "codeExplainer.groqApiKey",
        apiKey.trim()
      );

      vscode.window.showInformationMessage(
        "Groq API Key saved securely!"
      );
    }
  );

  context.subscriptions.push(
    explainCommand,
    setApiKeyCommand
  );
}

export function deactivate() {}
