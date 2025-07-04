import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { z } from "zod";
import { ModelProvider } from "../types";

export interface ModelConfig {
  provider: ModelProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string; // for custom providers like OpenAI compatible
}

function createProvider(config: ModelConfig) {
  switch (config.provider) {
    case "anthropic":
      return createAnthropic({ apiKey: config.apiKey });
    case "openai":
      return createOpenAI({ apiKey: config.apiKey });
    case "openrouter":
      return createOpenAICompatible({
        name: "openrouter",
        apiKey: config.apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      });
    case "azure":
      if (!config.baseUrl) {
        throw new Error("baseUrl is required for Azure provider");
      }
      return createOpenAICompatible({
        name: "azure",
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });
    case "gemini":
      return createOpenAICompatible({
        name: "gemini",
        apiKey: config.apiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });
    case "ollama":
      return createOpenAICompatible({
        name: "ollama",
        apiKey: config.apiKey || "ollama", // Ollama often doesn't require a real key
        baseURL: config.baseUrl || "http://localhost:11434/v1",
      });
    case "mistral":
      return createOpenAICompatible({
        name: "mistral",
        apiKey: config.apiKey,
        baseURL: "https://api.mistral.ai/v1",
      });
    case "deepseek":
      return createOpenAICompatible({
        name: "deepseek",
        apiKey: config.apiKey,
        baseURL: "https://api.deepseek.com/v1",
      });
    case "xai":
      return createOpenAICompatible({
        name: "xai",
        apiKey: config.apiKey,
        baseURL: "https://api.x.ai/v1",
      });
    case "groq":
      return createOpenAICompatible({
        name: "groq",
        apiKey: config.apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
    case "arceeai":
      return createOpenAICompatible({
        name: "arceeai",
        apiKey: config.apiKey,
        baseURL: "https://api.arcee.ai/v1",
      });
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

function getDefaultModel(provider: ModelProvider): string {
  switch (provider) {
    case "anthropic":
      return "claude-3-5-sonnet-20240620";
    case "openai":
      return "gpt-4o-mini";
    case "openrouter":
      return "anthropic/claude-3.5-sonnet";
    case "azure":
      return "gpt-4"; // This would typically be the deployment name
    case "gemini":
      return "gemini-1.5-pro";
    case "google":
      return "gemini-1.5-pro";
    case "ollama":
      return "llama3.1";
    case "mistral":
      return "mistral-large-latest";
    case "deepseek":
      return "deepseek-chat";
    case "xai":
      return "grok-beta";
    case "groq":
      return "llama-3.1-70b-versatile";
    case "arceeai":
      return "arcee-lite";
    default:
      return "gpt-4o-mini";
  }
}

export async function generatePRMetadata(
  patch: string,
  modelConfig: ModelConfig,
  prompt: string
) {
  const _prompt = `You are tasked to create title and body for a pull request based on the following task:\n${prompt}\n\npatch:\n\n${patch}`;
  const provider = createProvider(modelConfig);
  const model = modelConfig.model || getDefaultModel(modelConfig.provider);

  const { object } = await generateObject({
    model: provider(model),
    prompt: _prompt,
    schema: z.object({
      title: z.string().describe("Suggested title for the pull request"),
      body: z.string().describe("Suggested body for the pull request"),
      branchName: z
        .string()
        .describe(`Suggested branch name, should be unique and descriptive`),
      commitMessage: z
        .string()
        .describe("Suggested commit message for the pull request"),
    }),
  });

  return object;
}

export async function generateCommitMessage(
  patch: string,
  modelConfig: ModelConfig,
  prompt: string
) {
  const _prompt = `You are tasked to create a commit message based on the following task:\n${prompt}\n\npatch:\n\n${patch}`;
  const provider = createProvider(modelConfig);
  const model = modelConfig.model || getDefaultModel(modelConfig.provider);

  const { object } = await generateObject({
    model: provider(model),
    prompt: _prompt,
    schema: z.object({
      commitMessage: z
        .string()
        .describe("Suggested commit message for the changes"),
    }),
  });

  return object;
}
