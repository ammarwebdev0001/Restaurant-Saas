import { SubscriptionPlan } from '@prisma/client';

/** Entitlements for dashboard + APIs (see pricing tiers). */
export type PlanFeatureMatrix = {
  plan: SubscriptionPlan;
  maxBranches: number;
  recommendations: boolean;
  roleBasedSettings: boolean;
  branding: boolean;
  advancedAnalytics: boolean;
};

export function getPlanFeatures(plan: SubscriptionPlan | string | null): PlanFeatureMatrix {
  if (plan === SubscriptionPlan.SCALE) {
    return {
      plan: SubscriptionPlan.SCALE,
      maxBranches: Number.POSITIVE_INFINITY,
      recommendations: true,
      roleBasedSettings: true,
      branding: true,
      advancedAnalytics: true,
    };
  }
  if (plan === SubscriptionPlan.GROWTH) {
    return {
      plan: SubscriptionPlan.GROWTH,
      maxBranches: 5,
      recommendations: true,
      roleBasedSettings: true,
      branding: true,
      advancedAnalytics: true,
    };
  }
  return {
    plan: SubscriptionPlan.STARTER,
    maxBranches: 1,
    recommendations: false,
    roleBasedSettings: false,
    branding: false,
    advancedAnalytics: false,
  };
}

export function branchCapacityAllows(
  currentBranchCount: number,
  branchesToAdd: number,
  f: PlanFeatureMatrix
): boolean {
  return currentBranchCount + branchesToAdd <= f.maxBranches;
}
