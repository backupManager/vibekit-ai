import { describe, it, expect, vi, beforeEach } from "vitest";
import { VibeKit, VibeKitConfig, PullRequestResponse } from "../src/index";
import { CodexAgent } from "../src/agents/codex";
import { ClaudeAgent } from "../src/agents/claude";
import { CodexResponse } from "../src/types";

// Mock dependencies
vi.mock("../src/agents/codex");
vi.mock("../src/agents/claude");

const MockedCodexAgent = vi.mocked(CodexAgent);
const MockedClaudeAgent = vi.mocked(ClaudeAgent);

describe("VibeKit", () => {
  let codexConfig: VibeKitConfig;
  let claudeConfig: VibeKitConfig;
  let mockCodexAgent: any;
  let mockClaudeAgent: any;

  beforeEach(() => {
    codexConfig = {
      agent: {
        type: "codex",
        model: {
          name: "gpt-4",
          apiKey: "test-openai-key",
        },
      },
      environment: {
        e2b: {
          apiKey: "test-e2b-key",
        },
      },
      github: {
        token: "test-github-token",
        repository: "octocat/hello-world",
      },
    };

    claudeConfig = {
      agent: {
        type: "claude",
        model: {
          name: "claude-3-5-sonnet-20241022",
          apiKey: "test-anthropic-key",
        },
      },
      environment: {
        e2b: {
          apiKey: "test-e2b-key",
          templateId: "test-template",
        },
      },
      github: {
        token: "test-github-token",
        repository: "octocat/hello-world",
      },
    };

    mockCodexAgent = {
      generateCode: vi.fn(),
      createPullRequest: vi.fn(),
      runTests: vi.fn(),
      killSandbox: vi.fn(),
      pauseSandbox: vi.fn(),
      resumeSandbox: vi.fn(),
    };

    mockClaudeAgent = {
      generateCode: vi.fn(),
      createPullRequest: vi.fn(),
      runTests: vi.fn(),
      killSandbox: vi.fn(),
      pauseSandbox: vi.fn(),
      resumeSandbox: vi.fn(),
    };

    MockedCodexAgent.mockImplementation(() => mockCodexAgent);
    MockedClaudeAgent.mockImplementation(() => mockClaudeAgent);
  });

  describe("constructor", () => {
    it("should accept daytona environment configuration", () => {
      const daytonaConfig: VibeKitConfig = {
        agent: {
          type: "codex",
          model: {
            name: "gpt-4",
            apiKey: "test-openai-key",
          },
        },
        environment: {
          daytona: {
            apiKey: "test-daytona-key",
            image: "test-image",
            serverUrl: "https://test-daytona-server.com",
          },
        },
        github: {
          token: "test-github-token",
          repository: "octocat/hello-world",
        },
      };

      // Daytona support is now implemented, so it should not throw an error
      expect(() => {
        new VibeKit(daytonaConfig);
      }).not.toThrow();
    });
  });

  describe("generateCode", () => {
    it("should use Codex agent when configured", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockResponse = {
        exitCode: 0,
        stdout: "test",
        stderr: "",
        sandboxId: "test",
      };

      mockCodexAgent.generateCode.mockResolvedValue(mockResponse);

      const result = await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        history: [],
        background: false,
      });

      expect(MockedCodexAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-openai-key",
          githubToken: "test-github-token",
          repoUrl: "octocat/hello-world",
          e2bApiKey: "test-e2b-key",
          model: "gpt-4",
        })
      );
      expect(mockCodexAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        undefined,
        [],
        undefined,
        false
      );
      expect(result).toBe(mockResponse);
    });

    it("should work with Codex agent when GitHub config is not provided", async () => {
      const configWithoutGithub: VibeKitConfig = {
        agent: {
          type: "codex",
          model: {
            name: "gpt-4",
            apiKey: "test-openai-key",
          },
        },
        environment: {
          e2b: {
            apiKey: "test-e2b-key",
          },
        },
      };

      const vibeKit = new VibeKit(configWithoutGithub);
      const mockResponse = {
        exitCode: 0,
        stdout: "test",
        stderr: "",
        sandboxId: "test",
      };

      mockCodexAgent.generateCode.mockResolvedValue(mockResponse);

      const result = await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        history: [],
        background: false,
      });

      expect(MockedCodexAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-openai-key",
          githubToken: undefined,
          repoUrl: undefined,
          e2bApiKey: "test-e2b-key",
          model: "gpt-4",
        })
      );
      expect(mockCodexAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        undefined,
        [],
        undefined,
        false
      );
      expect(result).toBe(mockResponse);
    });

    it("should use Claude agent when configured", async () => {
      const vibeKit = new VibeKit(claudeConfig);
      const mockResponse = {
        exitCode: 0,
        stdout: "test code",
        stderr: "",
        sandboxId: "test-sandbox-id",
      };

      mockClaudeAgent.generateCode.mockResolvedValue(mockResponse);

      const result = await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        history: [],
        background: false,
      });

      expect(MockedClaudeAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-anthropic-key",
          githubToken: "test-github-token",
          repoUrl: "octocat/hello-world",
          e2bApiKey: "test-e2b-key",
        })
      );
      expect(mockClaudeAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        undefined,
        [],
        undefined,
        false
      );
      expect(result).toBe(mockResponse);
    });

    it("should work with Claude agent when GitHub config is not provided", async () => {
      const configWithoutGithub: VibeKitConfig = {
        agent: {
          type: "claude",
          model: {
            name: "claude-3-5-sonnet-20241022",
            apiKey: "test-anthropic-key",
          },
        },
        environment: {
          e2b: {
            apiKey: "test-e2b-key",
            templateId: "test-template",
          },
        },
      };

      const vibeKit = new VibeKit(configWithoutGithub);
      const mockResponse = {
        exitCode: 0,
        stdout: "test code",
        stderr: "",
        sandboxId: "test-sandbox-id",
      };

      mockClaudeAgent.generateCode.mockResolvedValue(mockResponse);

      const result = await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        history: [],
        background: false,
      });

      expect(MockedClaudeAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-anthropic-key",
          githubToken: undefined,
          repoUrl: undefined,
          e2bApiKey: "test-e2b-key",
        })
      );
      expect(mockClaudeAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        undefined,
        [],
        undefined,
        false
      );
      expect(result).toBe(mockResponse);
    });

    it("should pass callbacks to Codex agent", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const callbacks = {
        onUpdate: vi.fn(),
        onError: vi.fn(),
      };

      await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        history: [],
        callbacks,
        background: false,
      });

      // Verify that generateCode was called with the correct parameters
      // The callbacks will be wrapped functions, so we check that they exist
      expect(mockCodexAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        undefined,
        [],
        expect.objectContaining({
          onUpdate: expect.any(Function),
          onError: expect.any(Function),
        }),
        false
      );
    });

    it("should handle callbacks for Claude agent", async () => {
      const vibeKit = new VibeKit(claudeConfig);
      const callbacks = {
        onUpdate: vi.fn(),
        onError: vi.fn(),
      };
      const mockResponse = {
        exitCode: 0,
        stdout: "test code",
        stderr: "",
        sandboxId: "test-sandbox-id",
      };

      mockClaudeAgent.generateCode.mockResolvedValue(mockResponse);

      await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        history: [],
        callbacks,
        background: false,
      });

      expect(mockClaudeAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        undefined,
        [],
        expect.objectContaining({
          onUpdate: expect.any(Function),
          onError: expect.any(Function),
        }),
        false
      );
    });

    it("should throw error for unsupported agent", async () => {
      const unsupportedConfig = {
        agent: {
          type: "devin" as any,
          model: {
            apiKey: "test-key",
          },
        },
        environment: {
          e2b: {
            apiKey: "test-e2b-key",
          },
        },
        github: {
          token: "test-github-token",
          repository: "test/repo",
        },
      };

      expect(() => {
        new VibeKit(unsupportedConfig);
      }).toThrow("Unsupported agent type: devin");
    });

    it("should pass branch parameter to Codex agent", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockResponse = {
        exitCode: 0,
        stdout: "test",
        stderr: "",
        sandboxId: "test",
      };

      mockCodexAgent.generateCode.mockResolvedValue(mockResponse);

      await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        branch: "feature-branch",
        history: [],
        background: false,
      });

      expect(mockCodexAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        "feature-branch",
        [],
        undefined,
        false
      );
    });

    it("should pass branch parameter to Claude agent", async () => {
      const vibeKit = new VibeKit(claudeConfig);
      const mockResponse = {
        exitCode: 0,
        stdout: "test code",
        stderr: "",
        sandboxId: "test-sandbox-id",
      };

      mockClaudeAgent.generateCode.mockResolvedValue(mockResponse);

      await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        branch: "feature-branch",
        history: [],
        background: false,
      });

      expect(mockClaudeAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        "feature-branch",
        [],
        undefined,
        false
      );
    });

    it("should pass branch parameter with callbacks", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const callbacks = {
        onUpdate: vi.fn(),
        onError: vi.fn(),
      };
      const mockResponse = {
        exitCode: 0,
        stdout: "test",
        stderr: "",
        sandboxId: "test",
      };

      mockCodexAgent.generateCode.mockResolvedValue(mockResponse);

      await vibeKit.generateCode({
        prompt: "test prompt",
        mode: "code",
        branch: "feature-branch",
        history: [],
        callbacks,
        background: false,
      });

      expect(mockCodexAgent.generateCode).toHaveBeenCalledWith(
        "test prompt",
        "code",
        "feature-branch",
        [],
        expect.objectContaining({
          onUpdate: expect.any(Function),
          onError: expect.any(Function),
        }),
        false
      );
    });
  });

  describe("createPullRequest", () => {
    it("should create PR using Codex agent", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockPRResponse: PullRequestResponse = {
        html_url: "https://github.com/octocat/hello-world/pull/1",
        number: 1,
        branchName: "codex/test-branch",
        commitSha: "abc123",
      };

      mockCodexAgent.createPullRequest.mockResolvedValue(mockPRResponse);

      const result = await vibeKit.createPullRequest();

      expect(MockedCodexAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-openai-key",
          githubToken: "test-github-token",
          repoUrl: "octocat/hello-world",
          e2bApiKey: "test-e2b-key",
          model: "gpt-4",
        })
      );
      expect(mockCodexAgent.createPullRequest).toHaveBeenCalled();
      expect(result).toBe(mockPRResponse);
    });

    it("should create PR using Claude agent", async () => {
      const vibeKit = new VibeKit(claudeConfig);
      const mockPRResponse: PullRequestResponse = {
        html_url: "https://github.com/octocat/hello-world/pull/2",
        number: 2,
        branchName: "claude/test-branch",
        commitSha: "def456",
      };

      mockClaudeAgent.createPullRequest.mockResolvedValue(mockPRResponse);

      const result = await vibeKit.createPullRequest();

      expect(MockedClaudeAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-anthropic-key",
          githubToken: "test-github-token",
          repoUrl: "octocat/hello-world",
          e2bApiKey: "test-e2b-key",
        })
      );
      expect(mockClaudeAgent.createPullRequest).toHaveBeenCalled();
      expect(result).toBe(mockPRResponse);
    });

    it("should throw error when GitHub config is missing for Codex agent", async () => {
      const configWithoutGithub: VibeKitConfig = {
        agent: {
          type: "codex",
          model: {
            name: "gpt-4",
            apiKey: "test-openai-key",
          },
        },
        environment: {
          e2b: {
            apiKey: "test-e2b-key",
          },
        },
      };

      const vibeKit = new VibeKit(configWithoutGithub);

      // Mock the agent to throw the expected error
      mockCodexAgent.createPullRequest.mockRejectedValue(
        new Error(
          "GitHub configuration is required for creating pull requests. Please provide githubToken and repoUrl in your configuration."
        )
      );

      await expect(vibeKit.createPullRequest()).rejects.toThrow(
        "GitHub configuration is required for creating pull requests. Please provide githubToken and repoUrl in your configuration."
      );
    });

    it("should throw error when GitHub config is missing for Claude agent", async () => {
      const configWithoutGithub: VibeKitConfig = {
        agent: {
          type: "claude",
          model: {
            name: "claude-3-5-sonnet-20241022",
            apiKey: "test-anthropic-key",
          },
        },
        environment: {
          e2b: {
            apiKey: "test-e2b-key",
            templateId: "test-template",
          },
        },
      };

      const vibeKit = new VibeKit(configWithoutGithub);

      // Mock the agent to throw the expected error
      mockClaudeAgent.createPullRequest.mockRejectedValue(
        new Error(
          "GitHub configuration is required for creating pull requests. Please provide githubToken and repoUrl in your configuration."
        )
      );

      await expect(vibeKit.createPullRequest()).rejects.toThrow(
        "GitHub configuration is required for creating pull requests. Please provide githubToken and repoUrl in your configuration."
      );
    });
  });

  describe("runTests", () => {
    it("should run tests using Codex agent", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockTestResponse = {
        exitCode: 0,
        stdout: "✓ All tests passed",
        stderr: "",
        sandboxId: "test-sandbox",
      };

      mockCodexAgent.runTests.mockResolvedValue(mockTestResponse);

      const result = await vibeKit.runTests({});

      expect(MockedCodexAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-openai-key",
          githubToken: "test-github-token",
          repoUrl: "octocat/hello-world",
          e2bApiKey: "test-e2b-key",
          model: "gpt-4",
        })
      );
      expect(mockCodexAgent.runTests).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined
      );
      expect(result).toBe(mockTestResponse);
    });

    it("should run tests using Claude agent", async () => {
      const vibeKit = new VibeKit(claudeConfig);
      const mockTestResponse = {
        exitCode: 0,
        stdout: "✓ All tests passed",
        stderr: "",
        sandboxId: "test-sandbox",
      };

      mockClaudeAgent.runTests.mockResolvedValue(mockTestResponse);

      const result = await vibeKit.runTests({});

      expect(MockedClaudeAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          providerApiKey: "test-anthropic-key",
          githubToken: "test-github-token",
          repoUrl: "octocat/hello-world",
          e2bApiKey: "test-e2b-key",
        })
      );
      expect(mockClaudeAgent.runTests).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined
      );
      expect(result).toBe(mockTestResponse);
    });

    it("should run tests with callbacks using Codex agent", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockTestResponse = {
        exitCode: 0,
        stdout: "✓ All tests passed",
        stderr: "",
        sandboxId: "test-sandbox",
      };

      const mockCallbacks = {
        onUpdate: vi.fn(),
        onError: vi.fn(),
      };

      mockCodexAgent.runTests.mockResolvedValue(mockTestResponse);

      const result = await vibeKit.runTests({
        callbacks: mockCallbacks,
      });

      expect(mockCodexAgent.runTests).toHaveBeenCalledWith(
        undefined,
        undefined,
        mockCallbacks
      );
      expect(result).toBe(mockTestResponse);
    });

    it("should run tests on specific branch", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockTestResponse = {
        exitCode: 0,
        stdout: "✓ All tests passed",
        stderr: "",
        sandboxId: "test-sandbox",
      };

      mockCodexAgent.runTests.mockResolvedValue(mockTestResponse);

      const result = await vibeKit.runTests({ branch: "feature-branch" });

      expect(mockCodexAgent.runTests).toHaveBeenCalledWith(
        "feature-branch",
        undefined,
        undefined
      );
      expect(result).toBe(mockTestResponse);
    });

    it("should run tests with conversation history", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockTestResponse = {
        exitCode: 0,
        stdout: "✓ All tests passed",
        stderr: "",
        sandboxId: "test-sandbox",
      };

      const mockHistory = [
        { role: "user" as const, content: "Add new feature" },
        { role: "assistant" as const, content: "Feature added" },
      ];

      mockCodexAgent.runTests.mockResolvedValue(mockTestResponse);

      const result = await vibeKit.runTests({
        branch: "main",
        history: mockHistory,
      });

      expect(mockCodexAgent.runTests).toHaveBeenCalledWith(
        "main",
        mockHistory,
        undefined
      );
      expect(result).toBe(mockTestResponse);
    });

    it("should handle test failures", async () => {
      const vibeKit = new VibeKit(codexConfig);
      const mockTestResponse = {
        exitCode: 1,
        stdout: "",
        stderr: "✗ Tests failed",
        sandboxId: "test-sandbox",
      };

      mockCodexAgent.runTests.mockResolvedValue(mockTestResponse);

      const result = await vibeKit.runTests({});

      expect(result).toBe(mockTestResponse);
      // Type assertion since AgentResponse is a union type
      const typedResult = result as CodexResponse;
      expect(typedResult.exitCode).toBe(1);
      expect(typedResult.stderr).toBe("✗ Tests failed");
    });
  });

  describe("sandbox management", () => {
    describe("kill", () => {
      it("should kill sandbox using Codex agent", async () => {
        const vibeKit = new VibeKit(codexConfig);

        await vibeKit.kill();

        expect(MockedCodexAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            providerApiKey: "test-openai-key",
            githubToken: "test-github-token",
            repoUrl: "octocat/hello-world",
            e2bApiKey: "test-e2b-key",
            model: "gpt-4",
          })
        );
        expect(mockCodexAgent.killSandbox).toHaveBeenCalled();
      });

      it("should kill sandbox using Claude agent", async () => {
        const vibeKit = new VibeKit(claudeConfig);

        await vibeKit.kill();

        expect(MockedClaudeAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            providerApiKey: "test-anthropic-key",
            githubToken: "test-github-token",
            repoUrl: "octocat/hello-world",
            e2bApiKey: "test-e2b-key",
          })
        );
        expect(mockClaudeAgent.killSandbox).toHaveBeenCalled();
      });
    });

    describe("pause", () => {
      it("should pause sandbox using Codex agent", async () => {
        const vibeKit = new VibeKit(codexConfig);

        await vibeKit.pause();

        expect(MockedCodexAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            providerApiKey: "test-openai-key",
            githubToken: "test-github-token",
            repoUrl: "octocat/hello-world",
            e2bApiKey: "test-e2b-key",
            model: "gpt-4",
          })
        );
        expect(mockCodexAgent.pauseSandbox).toHaveBeenCalled();
      });

      it("should pause sandbox using Claude agent", async () => {
        const vibeKit = new VibeKit(claudeConfig);

        await vibeKit.pause();

        expect(MockedClaudeAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            providerApiKey: "test-anthropic-key",
            githubToken: "test-github-token",
            repoUrl: "octocat/hello-world",
            e2bApiKey: "test-e2b-key",
          })
        );
        expect(mockClaudeAgent.pauseSandbox).toHaveBeenCalled();
      });
    });

    describe("resume", () => {
      it("should resume sandbox using Codex agent", async () => {
        const vibeKit = new VibeKit(codexConfig);

        await vibeKit.resume();

        expect(MockedCodexAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            providerApiKey: "test-openai-key",
            githubToken: "test-github-token",
            repoUrl: "octocat/hello-world",
            e2bApiKey: "test-e2b-key",
            model: "gpt-4",
          })
        );
        expect(mockCodexAgent.resumeSandbox).toHaveBeenCalled();
      });

      it("should resume sandbox using Claude agent", async () => {
        const vibeKit = new VibeKit(claudeConfig);

        await vibeKit.resume();

        expect(MockedClaudeAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            providerApiKey: "test-anthropic-key",
            githubToken: "test-github-token",
            repoUrl: "octocat/hello-world",
            e2bApiKey: "test-e2b-key",
          })
        );
        expect(mockClaudeAgent.resumeSandbox).toHaveBeenCalled();
      });
    });
  });

  it("should handle executeCommand with custom options", async () => {
    const vibekit = new VibeKit({
      agent: {
        type: "claude",
        model: {
          provider: "anthropic",
          name: "claude-3-5-sonnet-20241022",
          apiKey: "test-api-key",
        },
      },
      environment: {
        e2b: {
          apiKey: "test-e2b-key",
        },
      },
    });

    const mockCallbacks = {
      onUpdate: vi.fn(),
      onError: vi.fn(),
    };

    // Mock the agent's executeCommand method
    vi.spyOn(vibekit as any, "agent", "get").mockReturnValue({
      executeCommand: vi.fn().mockResolvedValue({
        sandboxId: "test-sandbox",
        exitCode: 0,
        stdout: "Hello World",
        stderr: "",
      }),
    });

    const result = await vibekit.executeCommand("echo 'Hello World'", {
      timeoutMs: 30000,
      useRepoContext: false,
      callbacks: mockCallbacks,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("Hello World");
    expect(result.sandboxId).toBe("test-sandbox");
  });
});
