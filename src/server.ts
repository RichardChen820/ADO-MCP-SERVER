import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "azure-devops-mcp-server",
    version: "0.1.0",
  });

  server.tool(
    "get_all_repos",
    "Get all repositories from Azure DevOps.",
    {},
    async () => {
      // Get PAT from environment variable
      const accessToken = process.env.AZURE_DEVOPS_PAT;
      
      if (!accessToken) {
        throw new Error("PAT is required. Set AZURE_DEVOPS_PAT environment variable.");
      }

      // Build the Azure DevOps API URL
      const apiVersion = "7.0";
      const baseUrl = "https://dev.azure.com/msazure/Azure AppConfig/_apis/git/repositories";
      const url = `${baseUrl}?api-version=${apiVersion}`;

      // Set up headers for authentication
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Base64 encode the PAT with a colon prefix for Basic Auth
      const token = Buffer.from(`:${accessToken}`).toString('base64');
      headers.Authorization = `Basic ${token}`;

      try {
        // Make the API call to Azure DevOps
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          throw new Error(`Azure DevOps API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process the repositories
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                count: data.count,
                repositories: data.value.map((repo: any) => ({
                  id: repo.id,
                  name: repo.name,
                  url: repo.url,
                  project: repo.project?.name,
                  defaultBranch: repo.defaultBranch,
                  size: repo.size,
                  remoteUrl: repo.remoteUrl,
                  webUrl: repo.webUrl
                }))
              }, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        console.error("Error fetching repositories:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch repositories: ${errorMessage}`);
      }
    },
  )

  server.tool(
    "get_all_authored_pull_requests",
    "Get authored pull requests from Azure DevOps in all repos.",
    {
      repos: z.array(z.string()).describe("Repository names"),
    },
    async ({ repos }) => {
      if (!repos) {
        throw new Error("repo name is required.");
      }

      // Get PAT from environment variable if not provided as parameter
      const accessToken = process.env.AZURE_DEVOPS_PAT;
      const username = "85430e72-a10b-4adf-b0df-a060884cdee9";
      
      if (!accessToken) {
        throw new Error("PAT is required. Provide it as a parameter or set AZURE_DEVOPS_PAT environment variable.");
      }

      // Build the Azure DevOps API URL
      const apiVersion = "7.0";
      

      // Set up headers for authentication
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Base64 encode the PAT with a colon prefix for Basic Auth
      const token = Buffer.from(`:${accessToken}`).toString('base64');
      headers.Authorization = `Basic ${token}`;

      const datas: any[] = [];

      try {
        for (let index = 0; index < repos.length; index++) {
          const baseUrl = `https://dev.azure.com/msazure/Azure AppConfig/_apis/git/repositories/${repos[index]}/pullrequests`;
          const url = `${baseUrl}?searchCriteria.creatorId=${username}&searchCriteria.status=active&api-version=${apiVersion}`;

          // Make the API call to Azure DevOps
          const response = await fetch(url, { headers });
          
          if (!response.ok) {
            throw new Error(`Azure DevOps API returned ${response.status}: ${response.statusText}`);
          }
          
          var data = await response.json();
          datas.push(data);
        }
      } catch (error: unknown) {
        console.error("Error fetching pull requests:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch pull requests: ${errorMessage}`);
      } 

      var result: any;

      datas.forEach((data) => {
        Object.assign(result, data.value.map((pr: any) => ({
          id: pr.pullRequestId,
          title: pr.title,
          status: pr.status,
          createdBy: pr.createdBy?.displayName,
          creationDate: pr.creationDate,
          repository: pr.repository?.name,
          sourceRefName: pr.sourceRefName,
          targetRefName: pr.targetRefName,
          url: `https://dev.azure.com/msazure/Azure AppConfig/_git/${pr.repository?.name}/pullrequest/${pr.pullRequestId}`
        })));
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: result.count,
              pullRequests: result
            }, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "get_comments_on_pull_request",
    "Get comments on a pull request from Azure DevOps.",
    {
      repo: z.string().describe("Repository name"),
      pr_id: z.string().describe("PullRequest Id"),
    },
    async ({ repo, pr_id }) => {
      if (!pr_id || !repo) {
        throw new Error("PR Id and repo name are required.");
      }

      // Get PAT from environment variable if not provided as parameter
      const accessToken = process.env.AZURE_DEVOPS_PAT;
      
      if (!accessToken) {
        throw new Error("PAT is required. Provide it as a parameter or set AZURE_DEVOPS_PAT environment variable.");
      }

      // Build the Azure DevOps API URL for pull request threads
      const apiVersion = "7.0";
      const baseUrl = `https://dev.azure.com/msazure/Azure AppConfig/_apis/git/repositories/${repo}/pullrequests/${pr_id}/threads`;
      const url = `${baseUrl}?api-version=${apiVersion}`;

      // Set up headers for authentication
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Base64 encode the PAT with a colon prefix for Basic Auth
      const token = Buffer.from(`:${accessToken}`).toString('base64');
      headers.Authorization = `Basic ${token}`;

      try {
        // Make the API call to Azure DevOps
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          throw new Error(`Azure DevOps API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process the thread comments
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                count: data.count,
                threads: data.value.map((thread: any) => ({
                  id: thread.id,
                  status: thread.status,
                  threadContext: thread.threadContext,
                  comments: thread.comments.map((comment: any) => ({
                    id: comment.id,
                    content: comment.content,
                    author: comment.author?.displayName,
                    publishedDate: comment.publishedDate,
                    lastUpdatedDate: comment.lastUpdatedDate,
                    commentType: comment.commentType
                  }))
                }))
              }, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        console.error("Error fetching PR comments:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch PR comments: ${errorMessage}`);
      }
    },
  );

  server.tool(
    "create_work_item",
    "Create an Azure DevOps work item (Task or Bug) with provided message and assignee.",
    {
      title: z.string().describe("The title of the work item"),
      description: z.string().describe("The detailed description of the work item"),
      type: z.enum(["Task", "Bug"]).describe("The type of work item to create"),
      assignedTo: z.string().optional().describe("The email or display name of the person to assign the work item to"),
      project: z.string().default("Azure AppConfig").describe("The Azure DevOps project in which to create the work item"),
      priority: z.number().min(1).max(4).default(2).describe("Priority of the work item (1-4, where 1 is highest)"),
      tags: z.array(z.string()).optional().describe("Tags to apply to the work item")
    },
    async ({ title, description, type, assignedTo, project, priority, tags }) => {
      // Get PAT from environment variable
      const accessToken = process.env.AZURE_DEVOPS_PAT;
      
      if (!accessToken) {
        throw new Error("PAT is required. Set AZURE_DEVOPS_PAT environment variable.");
      }

      // Set up headers for authentication
      const headers: HeadersInit = {
        "Content-Type": "application/json-patch+json",
      };

      // Base64 encode the PAT with a colon prefix for Basic Auth
      const token = Buffer.from(`:${accessToken}`).toString('base64');
      headers.Authorization = `Basic ${token}`;

      // API version for Azure DevOps API calls
      const apiVersion = "7.0";

      // Create the work item request body
      const patchDocument = [
        {
          op: "add",
          path: "/fields/System.Title",
          value: title
        },
        {
          op: "add",
          path: "/fields/System.Description",
          value: description
        },
        {
          op: "add",
          path: "/fields/Microsoft.VSTS.Common.Priority",
          value: priority.toString()
        }
      ];

      // Add assignee if provided
      if (assignedTo) {
        patchDocument.push({
          op: "add",
          path: "/fields/System.AssignedTo",
          value: assignedTo
        });
      }

      // Add tags if provided
      if (tags && tags.length > 0) {
        patchDocument.push({
          op: "add",
          path: "/fields/System.Tags",
          value: tags.join("; ")
        });
      }

      try {
        // Build the URL for creating a work item
        const url = `https://dev.azure.com/msazure/${encodeURIComponent(project)}/_apis/wit/workitems/$${encodeURIComponent(type)}?api-version=${apiVersion}`;
        
        // Make the API call to Azure DevOps
        const response = await fetch(url, { 
          method: "POST",
          headers,
          body: JSON.stringify(patchDocument)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure DevOps API returned ${response.status}: ${response.statusText}. Details: ${errorText}`);
        }
        
        const data = await response.json();
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                id: data.id,
                url: data._links?.web?.href || data.url,
                type: data.fields["System.WorkItemType"],
                title: data.fields["System.Title"],
                state: data.fields["System.State"],
                createdBy: data.fields["System.CreatedBy"]?.displayName,
                assignedTo: data.fields["System.AssignedTo"]?.displayName,
                message: `Successfully created ${type} work item #${data.id}: ${title}`
              }, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        console.error("Error creating work item:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create work item: ${errorMessage}`);
      }
    },
  );

  return server;
}
