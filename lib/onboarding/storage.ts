const KEY = "onboarding_restaurant_id";

export function setOnboardingRestaurantId(id: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, id);
}

export function getOnboardingRestaurantId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function clearOnboardingRestaurantId() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
