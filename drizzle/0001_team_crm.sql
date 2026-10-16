CREATE TABLE crm_workspaces (id TEXT PRIMARY KEY NOT NULL, legacy_owner TEXT UNIQUE, name TEXT NOT NULL, industry TEXT NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('demo','business')), timezone TEXT NOT NULL, currency TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1, write_token TEXT NOT NULL, settings TEXT NOT NULL DEFAULT '{}', created TEXT NOT NULL, updated TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE crm_memberships (workspace_id TEXT NOT NULL REFERENCES crm_workspaces(id), user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','manager','staff','viewer')), active INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 1, display_name TEXT NOT NULL, PRIMARY KEY(workspace_id,user_id));
--> statement-breakpoint
CREATE INDEX crm_memberships_user ON crm_memberships(user_id,active);
--> statement-breakpoint
CREATE TABLE crm_records (workspace_id TEXT NOT NULL REFERENCES crm_workspaces(id), kind TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), version INTEGER NOT NULL DEFAULT 1, updated TEXT NOT NULL, PRIMARY KEY(workspace_id,kind,id));
--> statement-breakpoint
CREATE INDEX crm_records_kind ON crm_records(workspace_id,kind);
--> statement-breakpoint
CREATE TABLE crm_commands (workspace_id TEXT NOT NULL, id TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, command TEXT NOT NULL, before_state TEXT, after_state TEXT, result TEXT NOT NULL, created TEXT NOT NULL, PRIMARY KEY(workspace_id,id));
--> statement-breakpoint
CREATE INDEX crm_commands_time ON crm_commands(workspace_id,created);
--> statement-breakpoint
CREATE TABLE crm_archives (workspace_id TEXT PRIMARY KEY NOT NULL, legacy_owner TEXT NOT NULL UNIQUE, legacy_revision INTEGER NOT NULL, payload TEXT NOT NULL, sha256 TEXT NOT NULL, manifest TEXT NOT NULL, created TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE crm_sessions (workspace_id TEXT NOT NULL, user_id TEXT NOT NULL, payload TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated TEXT NOT NULL, PRIMARY KEY(workspace_id,user_id));
--> statement-breakpoint
CREATE TABLE crm_knowledge (workspace_id TEXT NOT NULL, id TEXT NOT NULL, user_id TEXT NOT NULL, scope TEXT NOT NULL CHECK(scope IN ('personal','team')), customer_id TEXT, content TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','active','revoked')), version INTEGER NOT NULL DEFAULT 1, updated TEXT NOT NULL, PRIMARY KEY(workspace_id,id));
--> statement-breakpoint
CREATE INDEX crm_knowledge_scope ON crm_knowledge(workspace_id,status,scope);
--> statement-breakpoint
CREATE TABLE crm_jobs (workspace_id TEXT NOT NULL, id TEXT NOT NULL, rule TEXT NOT NULL, business_date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('queued','running','retry','succeeded','dead')), attempts INTEGER NOT NULL DEFAULT 0, available_at TEXT NOT NULL, lease_until TEXT, lease_token TEXT, error TEXT, result TEXT, created TEXT NOT NULL, updated TEXT NOT NULL, PRIMARY KEY(workspace_id,id));
--> statement-breakpoint
CREATE INDEX crm_jobs_due ON crm_jobs(status,available_at,lease_until);
--> statement-breakpoint
CREATE TABLE crm_files (workspace_id TEXT NOT NULL, id TEXT NOT NULL, customer_id TEXT NOT NULL, uploader TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, status TEXT NOT NULL CHECK(status IN ('pending','ready','failed','archived')), note TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL, PRIMARY KEY(workspace_id,id));
--> statement-breakpoint
CREATE INDEX crm_files_customer ON crm_files(workspace_id,customer_id,status);
--> statement-breakpoint
CREATE TABLE crm_join_requests (workspace_id TEXT NOT NULL, user_id TEXT NOT NULL, display_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', updated TEXT NOT NULL, PRIMARY KEY(workspace_id,user_id));
--> statement-breakpoint
CREATE TABLE crm_scheduler_runs (id TEXT PRIMARY KEY NOT NULL, started TEXT NOT NULL, finished TEXT NOT NULL, checked INTEGER NOT NULL, results TEXT NOT NULL);
