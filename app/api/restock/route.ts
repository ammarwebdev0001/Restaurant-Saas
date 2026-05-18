import { legacyApiDisabled } from '@/lib/api/legacy-route-guard';

export const POST = async () => legacyApiDisabled();
export const GET = async () => legacyApiDisabled();
