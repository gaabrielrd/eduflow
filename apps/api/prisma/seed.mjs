import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const { Client } = pg;
const client = new Client({ connectionString });

async function main() {
  await client.connect();

  await client.query("BEGIN");

  try {
    const organizationResult = await client.query(
      `
        INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT ("slug")
        DO UPDATE SET "updatedAt" = NOW()
        RETURNING "id"
      `,
      ["org_demo", "Demo Organization", "demo-org"]
    );

    const organizationId = organizationResult.rows[0].id;

    const userResult = await client.query(
      `
        INSERT INTO "User" ("id", "name", "email", "passwordHash", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("email")
        DO UPDATE SET "updatedAt" = NOW()
        RETURNING "id"
      `,
      ["user_demo_owner", "Demo Owner", "owner@demo.eduflow.local", "demo-password-hash"]
    );

    const userId = userResult.rows[0].id;

    await client.query(
      `
        INSERT INTO "Membership" ("id", "userId", "organizationId", "role", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("userId", "organizationId")
        DO UPDATE SET "role" = EXCLUDED."role", "updatedAt" = NOW()
      `,
      ["membership_demo_owner", userId, organizationId, "OWNER"]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

await main();
