# Code Explainer Fresh

**Code Explainer Fresh** is a VS Code extension that explains selected code using AI powered by Groq.

## Features

- Explain selected code in simple English.
- Understand programming concepts.
- Get step-by-step code explanations.
- View explanations with formatted Markdown.
- Display headings, tables, lists, and code blocks.
- Supports multiple programming languages.

## How to Use

1. Open any programming file in VS Code.
2. Select the code you want to understand.
3. Right-click and select **Explain Selected Code**.
4. View the explanation in a panel beside your editor.

You can also use the keyboard shortcut:

`Ctrl + Alt + E`

## Setup

1. Create a Groq API key at https://console.groq.com/.
2. Open the VS Code Command Palette (`Ctrl + Shift + P`).
3. Search for **Code Explainer: Set Groq API Key**.
4. Enter your Groq API key.

The API key is stored securely using VS Code SecretStorage.

## Requirements

- Visual Studio Code 1.124.0 or later.
- An active internet connection.
- A Groq API key.

## Privacy

Selected code is sent to the Groq API to generate explanations. Do not select confidential code, passwords, API keys, or other sensitive information.

## Developer

Code Explainer Fresh