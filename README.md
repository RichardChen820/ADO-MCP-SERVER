# Azure DevOps MCP Server

A Model Context Protocol (MCP) server for integrating with Azure DevOps services. This server implements tools for querying Azure DevOps repositories, pull requests, and other resources through the MCP interface.

## Overview

This MCP server provides a standardized way to interact with Azure DevOps resources through the Model Context Protocol. It can be used to query repositories, pull requests, and other Azure DevOps resources, making them accessible to AI assistants and other tools that support MCP.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TypeScript
- Azure DevOps account with a Personal Access Token (PAT)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd azure-devops-mcp-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

## Configuration

Before using the server, you need to set up your Azure DevOps Personal Access Token (PAT):

1. Create a PAT in Azure DevOps with appropriate permissions (at minimum, read access to repositories)
2. Set the PAT as an environment variable:
   ```
   export AZURE_DEVOPS_PAT=your_pat_here
   ```

## Usage

Start the server:

```
npm start
```

The server runs on stdio, making it suitable for integration with tools that support the Model Context Protocol.

