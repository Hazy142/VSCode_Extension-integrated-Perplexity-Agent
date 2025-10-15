export const PerplexityModels = [
  "sonar",
  "sonar-pro",
  "sonar-reasoning",
  "sonar-reasoning-pro",
  "sonar-deep-research",
  "sonar-medium-chat"
] as const;

export type PerplexityModel = typeof PerplexityModels[number];