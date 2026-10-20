// Creates an administrator securely.
//
//   npm run admin:create -- --email you@gyanindia.com --name "Your Name" [--role SUPER_ADMIN]
//
// The password is read from the ADMIN_PASSWORD environment variable. If it is not set,
// a strong random password is generated and printed ONCE — store it in a password manager.

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const role = (arg("role") ?? "SUPER_ADMIN") as Role;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Provide a valid --email.");
  if (!name) throw new Error('Provide --name "Full Name".');
  if (!Object.values(Role).includes(role) || role === "GUARDIAN") {
    throw new Error(`--role must be one of ${Object.values(Role).filter((r) => r !== "GUARDIAN").join(", ")}`);
  }

  let password = process.env.ADMIN_PASSWORD;
  const generated = !password;
  if (!password) password = randomBytes(18).toString("base64url");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with this email already exists.");

  const user = await db.user.create({
    data: { email, name, role, passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date() },
  });
  await db.auditLog.create({
    data: { action: "user.admin_created_cli", entityType: "User", entityId: user.id, metadata: { role } },
  });

  console.log(`Created ${role} ${email}.`);
  if (generated) console.log(`Generated password (shown once): ${password}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
