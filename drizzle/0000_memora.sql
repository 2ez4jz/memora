CREATE TABLE memora_workspace (owner TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE memora_memory (owner TEXT NOT NULL, id TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', version INTEGER NOT NULL DEFAULT 1, updated TEXT NOT NULL, PRIMARY KEY(owner,id));
--> statement-breakpoint
CREATE TABLE memora_audit (id TEXT PRIMARY KEY NOT NULL, owner TEXT NOT NULL, memory_id TEXT NOT NULL, action TEXT NOT NULL, snapshot TEXT NOT NULL, created TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX memora_audit_owner ON memora_audit(owner,created);
