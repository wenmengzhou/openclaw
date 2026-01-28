import { describe, expect, it } from "vitest";
import { resolveExtraParams } from "./pi-embedded-runner/extra-params.js";

describe("resolveExtraParams", () => {
  it("returns undefined with no model config", () => {
    const result = resolveExtraParams({
      cfg: undefined,
      provider: "zai",
      modelId: "glm-4.7",
    });

    expect(result).toBeUndefined();
  });

  it("returns params for exact provider/model key", () => {
    const result = resolveExtraParams({
      cfg: {
        agents: {
          defaults: {
            models: {
              "openai/gpt-4": {
                params: {
                  temperature: 0.7,
                  maxTokens: 2048,
                },
              },
            },
          },
        },
      },
      provider: "openai",
      modelId: "gpt-4",
    });

    expect(result).toEqual({
      temperature: 0.7,
      maxTokens: 2048,
    });
  });

  it("ignores unrelated model entries", () => {
    const result = resolveExtraParams({
      cfg: {
        agents: {
          defaults: {
            models: {
              "openai/gpt-4": {
                params: {
                  temperature: 0.7,
                },
              },
            },
          },
        },
      },
      provider: "openai",
      modelId: "gpt-4.1-mini",
    });

    expect(result).toBeUndefined();
  });

  describe("reasoning auto-injection", () => {
    it("auto-injects enable_thinking when modelReasoning is true and not manually set", () => {
      const result = resolveExtraParams({
        cfg: {
          agents: {
            defaults: {
              models: {
                "custom/reasoning-model": {
                  params: {
                    temperature: 0.7,
                  },
                },
              },
            },
          },
        },
        provider: "custom",
        modelId: "reasoning-model",
        modelReasoning: true,
      });

      expect(result).toEqual({
        temperature: 0.7,
        enable_thinking: true,
      });
    });

    it("does not inject enable_thinking when modelReasoning is false", () => {
      const result = resolveExtraParams({
        cfg: {
          agents: {
            defaults: {
              models: {
                "custom/non-reasoning-model": {
                  params: {
                    temperature: 0.7,
                  },
                },
              },
            },
          },
        },
        provider: "custom",
        modelId: "non-reasoning-model",
        modelReasoning: false,
      });

      expect(result).toEqual({
        temperature: 0.7,
      });
    });

    it("does not inject enable_thinking when modelReasoning is undefined", () => {
      const result = resolveExtraParams({
        cfg: {
          agents: {
            defaults: {
              models: {
                "custom/model": {
                  params: {
                    temperature: 0.7,
                  },
                },
              },
            },
          },
        },
        provider: "custom",
        modelId: "model",
      });

      expect(result).toEqual({
        temperature: 0.7,
      });
    });

    it("respects manually set enable_thinking: true", () => {
      const result = resolveExtraParams({
        cfg: {
          agents: {
            defaults: {
              models: {
                "custom/model": {
                  params: {
                    temperature: 0.7,
                    enable_thinking: true,
                  },
                },
              },
            },
          },
        },
        provider: "custom",
        modelId: "model",
        modelReasoning: true,
      });

      expect(result).toEqual({
        temperature: 0.7,
        enable_thinking: true,
      });
    });

    it("respects manually set enable_thinking: false even when modelReasoning is true", () => {
      const result = resolveExtraParams({
        cfg: {
          agents: {
            defaults: {
              models: {
                "custom/model": {
                  params: {
                    temperature: 0.7,
                    enable_thinking: false,
                  },
                },
              },
            },
          },
        },
        provider: "custom",
        modelId: "model",
        modelReasoning: true,
      });

      expect(result).toEqual({
        temperature: 0.7,
        enable_thinking: false,
      });
    });

    it("auto-injects enable_thinking when no other params exist", () => {
      const result = resolveExtraParams({
        cfg: {
          agents: {
            defaults: {
              models: {
                "custom/reasoning-only": {},
              },
            },
          },
        },
        provider: "custom",
        modelId: "reasoning-only",
        modelReasoning: true,
      });

      expect(result).toEqual({
        enable_thinking: true,
      });
    });

    it("returns enable_thinking when modelReasoning is true without cfg params", () => {
      const result = resolveExtraParams({
        cfg: undefined,
        provider: "custom",
        modelId: "reasoning-model",
        modelReasoning: true,
      });

      expect(result).toEqual({
        enable_thinking: true,
      });
    });
  });
});
