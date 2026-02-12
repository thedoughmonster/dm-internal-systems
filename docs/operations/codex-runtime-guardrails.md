# Codex Runtime Guardrails

## Purpose

Store a constrained Codex runtime policy in-repo before applying machine-level changes.
This document keeps a reviewable source of truth for:
- user config defaults (`~/.codex/config.toml`)
- admin policy constraints (`/etc/codex/requirements.toml`)

## Why two files

- `config.toml` sets local runtime defaults.
- `requirements.toml` enforces hard policy bounds and command prefix decisions.
- Command prefix gating belongs in `requirements.toml`, not `config.toml`.

## Template: config.toml

```toml
model = "gpt-5.2"
model_reasoning_effort = "medium"
personality = "pragmatic"

approval_policy = "on-request"
sandbox_mode = "workspace-write"
web_search = "cached"

[sandbox_workspace_write]
network_access = true
writable_roots = [
  "/root/src/dm-internal-systems",
  "/tmp",
]
exclude_slash_tmp = false
exclude_tmpdir_env_var = false

[shell_environment_policy]
inherit = "core"
exclude = [
  "(?i).*token.*",
  "(?i).*secret.*",
  "(?i).*password.*",
  "(?i).*api[_-]?key.*",
  "(?i).*auth.*",
  "(?i).*bearer.*",
]

[projects."/root/src/dm-internal-systems"]
trust_level = "trusted"

[projects."/root/src/svelte-notb"]
trust_level = "trusted"

[projects."/root"]
trust_level = "untrusted"
```

## Template: requirements.toml

```toml
allowed_approval_policies = ["untrusted", "on-request", "on-failure"]
allowed_sandbox_modes = ["read-only", "workspace-write"]
allowed_web_search_modes = ["cached"]

[rules]
prefix_rules = [
  { pattern = [{ token = "git" }, { token = "reset" }, { token = "--hard" }], decision = "forbidden", justification = "Disallow destructive history reset." },
  { pattern = [{ token = "git" }, { token = "clean" }, { any_of = ["-fd", "-xdf", "-df"] }], decision = "forbidden", justification = "Disallow destructive untracked file deletion." },
  { pattern = [{ token = "git" }, { any_of = ["push", "pull", "merge", "rebase", "cherry-pick", "stash", "commit", "add", "checkout", "switch"] }], decision = "prompt", justification = "Require explicit approval for state-changing git operations." },
  { pattern = [{ token = "rm" }, { any_of = ["-rf", "-fr", "-r"] }], decision = "prompt", justification = "Require explicit approval before recursive deletion." },
  { pattern = [{ token = "sudo" }], decision = "prompt", justification = "Require explicit approval for privileged commands." },
  { pattern = [{ token = "curl" }], decision = "prompt", justification = "Require explicit approval for direct network calls from shell." },
  { pattern = [{ token = "wget" }], decision = "prompt", justification = "Require explicit approval for direct downloads from shell." }
]
```

## Apply order

1. Review and approve both templates in this repo.
2. Apply `config.toml` to `~/.codex/config.toml`.
3. Apply `requirements.toml` to `/etc/codex/requirements.toml`.
4. Restart Codex session and validate command behavior with safe read-only commands first.

## Validation checks

- Confirm sandbox mode remains `workspace-write`.
- Confirm writes are limited to declared roots.
- Confirm destructive prefixes are blocked or prompt as designed.
- Confirm normal read-only inspection commands still execute.
