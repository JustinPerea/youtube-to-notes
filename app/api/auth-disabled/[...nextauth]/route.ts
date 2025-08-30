import { handlers } from "@/lib/auth-simple";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
