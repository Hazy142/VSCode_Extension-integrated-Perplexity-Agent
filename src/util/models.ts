export const PerplexityModels = [
  "sonar",
  "sonar-pro",
  "sonar-reasoning",
  "sonar-reasoning-pro",
  "sonar-deep-research"
] as const;

export type PerplexityModel = typeof PerplexityModels[number];