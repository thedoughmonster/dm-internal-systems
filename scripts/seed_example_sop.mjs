import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const databaseUrl = requireEnv("SUPABASE_DB_URL");
const filePath = path.resolve(process.cwd(), "canon", "example_sop_full.json");

const canonical = JSON.parse(fs.readFileSync(filePath, "utf8"));

const sopId = canonical.sop_id;
const version = canonical.version || "v1.0";
const title = canonical?.metadata?.sop_name || "Untitled SOP";
const status = canonical.status || "DRAFT";

const client = new Client({ connectionString: databaseUrl });

await client.connect();

try {
  await client.query("begin");

  const docRes = await client.query(
    `
    insert into dm.sop_docs (sop_id, title, status)
    values ($1, $2, $3)
    on conflict (sop_id) do update
      set title = excluded.title,
          status = excluded.status
    returning id
    `,
    [sopId, title, status]
  );

  const sopDocId = docRes.rows[0].id;

  const verRes = await client.query(
    `
    insert into dm.sop_doc_versions (sop_doc_id, version, canonical)
    values ($1, $2, $3::jsonb)
    on conflict (sop_doc_id, version) do update
      set canonical = excluded.canonical
    returning id
    `,
    [sopDocId, version, JSON.stringify(canonical)]
  );

  const versionId = verRes.rows[0].id;

  await client.query(
    `update dm.sop_docs set current_version_id = $2 where id = $1`,
    [sopDocId, versionId]
  );

  await client.query("commit");

  console.log("Seeded:", { sopId, version, sopDocId, versionId });
} catch (e) {
  await client.query("rollback");
  throw e;
} finally {
  await client.end();
}
