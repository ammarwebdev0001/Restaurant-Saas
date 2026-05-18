import { legacyApiDisabled } from '@/lib/api/legacy-route-guard';

export const PATCH = async () => legacyApiDisabled();
export const DELETE = async () => legacyApiDisabled();
