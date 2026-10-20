import { vi } from "vitest";
import { TEST_DATABASE_URL } from "./env";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;

// Next.js request-scoped APIs are not available outside a request.
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10", "user-agent": "vitest" }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
