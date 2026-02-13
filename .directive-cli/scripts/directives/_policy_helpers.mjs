import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "./_session_resolver.mjs";

const POLICY_ROOT = path.join(getRepoRoot(), ".directive-cli", "policies");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const doc = JSON.parse(raw);
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`Policy file must contain a JSON object: ${filePath}`);
  }
  return doc;
}

function validatePolicyDoc(filePath, doc, expectedId = "") {
  const isSchema = path.basename(filePath).endsWith(".schema.json");
  if (isSchema) {
    if (typeof doc.$schema !== "string" || doc.$schema.trim() === "") {
      throw new Error(`Invalid schema policy (missing $schema): ${filePath}`);
    }
    return doc;
  }

  if (String(doc.kind || "") !== "directive_cli_policy") {
    throw new Error(`Invalid policy kind in ${filePath}`);
  }
  if (typeof doc.policy_id !== "string" || doc.policy_id.trim() === "") {
    throw new Error(`Invalid policy_id in ${filePath}`);
  }
  if (typeof doc.version !== "string" || doc.version.trim() === "") {
    throw new Error(`Invalid version in ${filePath}`);
  }
  if (expectedId && doc.policy_id !== expectedId) {
    throw new Error(`Policy id mismatch in ${filePath}. Expected '${expectedId}', got '${doc.policy_id}'`);
  }
  return doc;
}

export function policyPath(fileName) {
  return path.join(POLICY_ROOT, fileName);
}

export function loadPolicyFile(fileName, expectedId = "") {
  const full = policyPath(fileName);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required policy file: ${full}`);
  }
  return validatePolicyDoc(full, readJson(full), expectedId);
}

export function loadCorePolicy() {
  return loadPolicyFile("core.policy.json", "core");
}

export function loadExecutorLifecyclePolicy() {
  return loadPolicyFile("executor.lifecycle.policy.json", "executor_lifecycle");
}

export function loadArchitectAuthoringPolicy() {
  return loadPolicyFile("architect.authoring.policy.json", "architect_authoring");
}

export function loadRunbookFlowPolicy() {
  return loadPolicyFile("runbook.flow.json", "runbook_flow");
}
