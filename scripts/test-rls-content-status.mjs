/**
 * Automated RLS check: verify members cannot change content.status
 * to 'approved' or 'rejected'.
 *
 * Run: node scripts/test-rls-content-status.mjs
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_PUBLISHABLE_KEY  (anon key — used for member client)
 *   SUPABASE_SERVICE_ROLE_KEY (admin client — for setup/teardown)
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const results = [];
function record(name, passed, info = "") {
  results.push({ name, passed, info });
  console.log(`${passed ? "✅" : "❌"} ${name}${info ? ` — ${info}` : ""}`);
}

const stamp = Date.now();
const email = `rls-test-${stamp}@example.com`;
const password = "Test1234!ComplexPass";
let userId = null;
let contentId = null;

async function setup() {
  // Create member user (auto-confirmed via admin API)
  const { data: u, error: ue } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (ue) throw new Error(`createUser failed: ${ue.message}`);
  userId = u.user.id;

  // handle_new_user trigger should auto-assign 'member' role + create profile
  // Insert a pending content row owned by this user
  const { data: c, error: ce } = await admin
    .from("content")
    .insert({
      user_id: userId,
      title: "RLS test pending",
      content_type: "photo",
      file_path: `${userId}/rls-test-${stamp}.webp`,
      status: "pending",
      visibility: "members_only",
    })
    .select()
    .single();
  if (ce) throw new Error(`seed content failed: ${ce.message}`);
  contentId = c.id;
}

async function teardown() {
  if (contentId) await admin.from("content").delete().eq("id", contentId);
  if (userId) await admin.auth.admin.deleteUser(userId);
}

async function run() {
  await setup();

  const member = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: signInErr } = await member.auth.signInWithPassword({ email, password });
  if (signInErr) throw new Error(`member sign-in failed: ${signInErr.message}`);

  // 1) Member tries to set status = 'approved' on own row → must NOT succeed
  {
    const { data, error } = await member
      .from("content")
      .update({ status: "approved" })
      .eq("id", contentId)
      .select();
    const blocked = !!error || !data || data.length === 0;
    record(
      "Member cannot set status='approved' on own row",
      blocked,
      error ? `rls error: ${error.message}` : `rows updated: ${data?.length ?? 0}`,
    );
  }

  // 2) Member tries to set status = 'rejected' on own row → must NOT succeed
  {
    const { data, error } = await member
      .from("content")
      .update({ status: "rejected" })
      .eq("id", contentId)
      .select();
    const blocked = !!error || !data || data.length === 0;
    record(
      "Member cannot set status='rejected' on own row",
      blocked,
      error ? `rls error: ${error.message}` : `rows updated: ${data?.length ?? 0}`,
    );
  }

  // 3) Verify status is still 'pending' in DB (admin read)
  {
    const { data } = await admin.from("content").select("status").eq("id", contentId).single();
    record("Row status remains 'pending' after attempted escalations", data?.status === "pending", `actual: ${data?.status}`);
  }

  // 4) Member CAN update an allowed field (title) while keeping status pending
  {
    const { data, error } = await member
      .from("content")
      .update({ title: "RLS test pending updated" })
      .eq("id", contentId)
      .select();
    record(
      "Member can update non-status fields on own pending row",
      !error && data && data.length === 1,
      error ? error.message : `rows: ${data?.length}`,
    );
  }

  // 5) Member tries to insert a row pre-set to 'approved' → must fail (INSERT WITH CHECK)
  {
    const { data, error } = await member
      .from("content")
      .insert({
        user_id: userId,
        title: "RLS insert escalation",
        content_type: "photo",
        file_path: `${userId}/rls-insert-${stamp}.webp`,
        status: "approved",
        visibility: "members_only",
      })
      .select();
    const blocked = !!error || !data || data.length === 0;
    record(
      "Member cannot INSERT a row with status='approved'",
      blocked,
      error ? `rls error: ${error.message}` : `inserted: ${data?.length ?? 0}`,
    );
    // cleanup if it somehow inserted
    if (data && data[0]?.id) await admin.from("content").delete().eq("id", data[0].id);
  }

  await member.auth.signOut();
}

let exitCode = 0;
try {
  await run();
} catch (e) {
  console.error("Test run failed:", e);
  exitCode = 1;
} finally {
  try {
    await teardown();
  } catch (e) {
    console.error("Teardown error:", e);
  }
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) exitCode = 1;
process.exit(exitCode);
