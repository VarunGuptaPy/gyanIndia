import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./env";

export default function setup() {
  if (process.env.SKIP_DB_TESTS === "1") return;
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
