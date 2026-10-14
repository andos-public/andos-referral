-- Sprint 4 — immutable admin/system audit trail (Phase-1 backend wrap-up).
--
-- Every privileged action (payout approve/reject/complete, hold-release sweep, and future
-- Phase-5 operations) writes one row here. The table is APPEND-ONLY at the database level:
-- the trigger below rejects UPDATE and DELETE outright, so an application bug — or an
-- attacker who gets into the app — cannot rewrite or erase history. Audit rows therefore
-- never carry mutable state; corrections are new rows.

CREATE TABLE IF NOT EXISTS "referral_app"."admin_audit_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "actor_type" varchar(20) NOT NULL,
    "actor_ref" varchar(120),
    "action" varchar(80) NOT NULL,
    "target_type" varchar(40),
    "target_id" uuid,
    "request_id" varchar(128),
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Actor types are a closed set; a typo can never create an unclassifiable audit row.
ALTER TABLE "referral_app"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_actor_type_chk"
    CHECK ("actor_type" IN ('ADMIN_KEY', 'SYSTEM', 'USER'));

-- Metadata is a small JSON detail bag (amounts, reasons, ids) — never a document store.
ALTER TABLE "referral_app"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_metadata_size_chk"
    CHECK (pg_column_size("metadata") <= 8192);

CREATE INDEX "admin_audit_logs_created_at_idx"
    ON "referral_app"."admin_audit_logs" ("created_at" DESC);

CREATE INDEX "admin_audit_logs_action_created_at_idx"
    ON "referral_app"."admin_audit_logs" ("action", "created_at" DESC);

CREATE INDEX "admin_audit_logs_target_idx"
    ON "referral_app"."admin_audit_logs" ("target_type", "target_id");

-- Append-only enforcement: any UPDATE or DELETE raises, including through a direct SQL session.
CREATE OR REPLACE FUNCTION "referral_app"."prevent_audit_log_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'admin_audit_logs is append-only (attempted %)', TG_OP
        USING ERRCODE = '23514',
              CONSTRAINT = 'admin_audit_logs_append_only_chk';
END;
$$;

DROP TRIGGER IF EXISTS "admin_audit_logs_append_only" ON "referral_app"."admin_audit_logs";
CREATE TRIGGER "admin_audit_logs_append_only"
    BEFORE UPDATE OR DELETE ON "referral_app"."admin_audit_logs"
    FOR EACH ROW
    EXECUTE FUNCTION "referral_app"."prevent_audit_log_mutation"();
