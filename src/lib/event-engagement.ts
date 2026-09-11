export const engagementActions = ["view", "ticket"] as const;
export type EngagementActionInput = typeof engagementActions[number];
