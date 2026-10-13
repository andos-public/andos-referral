-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "AttributionStatus" AS ENUM ('ATTRIBUTED', 'ACTIVE', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "LinkEventType" AS ENUM ('CLICK', 'REFERRAL_ATTRIBUTED', 'CONVERSION');

-- CreateEnum
CREATE TYPE "ChatAccessState" AS ENUM ('LOCKED', 'UNLOCKED');

-- CreateEnum
CREATE TYPE "RewardRuleMatchType" AS ENUM ('DEFAULT', 'PROMO_CODE');

-- CreateEnum
CREATE TYPE "OrderEventType" AS ENUM ('ORDER_COMPLETED', 'ORDER_CANCELLED', 'ORDER_REFUNDED');

-- CreateEnum
CREATE TYPE "RewardEligibility" AS ENUM ('ELIGIBLE', 'HOLD', 'INELIGIBLE');

-- CreateEnum
CREATE TYPE "PayoutMethodType" AS ENUM ('UPI', 'BANK');

-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PayoutRequestEventType" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('COMMISSION_LOCKED', 'COMMISSION_RELEASE', 'COMMISSION_REVERSAL', 'WITHDRAWAL_RESERVATION', 'WITHDRAWAL_RELEASE', 'WITHDRAWAL_COMPLETION');

-- CreateEnum
CREATE TYPE "LedgerBucket" AS ENUM ('PENDING', 'AVAILABLE', 'RESERVED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "external_subject" TEXT,
    "username" TEXT,
    "display_name" TEXT,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "campaign_type" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_user_id" UUID NOT NULL,
    "campaign_id" UUID,
    "public_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_attributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_code_id" UUID NOT NULL,
    "referrer_user_id" UUID NOT NULL,
    "referred_user_id" UUID NOT NULL,
    "campaign_id" UUID,
    "attribution_status" "AttributionStatus" NOT NULL DEFAULT 'ATTRIBUTED',
    "attributed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_event_id" TEXT,
    "main_app_install_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_link_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_code_id" UUID NOT NULL,
    "attribution_id" UUID,
    "event_type" "LinkEventType" NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "conversion_kind" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_link_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_link_metrics" (
    "referral_code_id" UUID NOT NULL,
    "click_count" BIGINT NOT NULL DEFAULT 0,
    "unique_click_count" BIGINT NOT NULL DEFAULT 0,
    "referral_count" BIGINT NOT NULL DEFAULT 0,
    "conversion_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "referral_link_metrics_pkey" PRIMARY KEY ("referral_code_id")
);

-- CreateTable
CREATE TABLE "referral_chat_access" (
    "attribution_id" UUID NOT NULL,
    "access_state" "ChatAccessState" NOT NULL DEFAULT 'LOCKED',
    "unlocked_at" TIMESTAMPTZ(6),
    "unlock_source_event_id" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "referral_chat_access_pkey" PRIMARY KEY ("attribution_id")
);

-- CreateTable
CREATE TABLE "referral_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attribution_id" UUID NOT NULL,
    "source_system" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "verified_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_version" INTEGER,
    "safe_metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "referral_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID,
    "rule_key" TEXT NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "match_type" "RewardRuleMatchType" NOT NULL,
    "promo_code_normalized" TEXT,
    "rate_bps" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_order_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_system" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "event_type" "OrderEventType" NOT NULL,
    "order_id" TEXT NOT NULL,
    "referral_attribution_id" UUID NOT NULL,
    "commissionable_net_amount_minor_units" BIGINT NOT NULL,
    "refund_amount_minor_units" BIGINT NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "applied_promo_code_input" VARCHAR(100),
    "promo_code_normalized" TEXT,
    "reward_eligibility" "RewardEligibility" NOT NULL DEFAULT 'HOLD',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload_digest" TEXT,

    CONSTRAINT "referral_order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_accounts" (
    "user_id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "pending_minor_units" BIGINT NOT NULL DEFAULT 0,
    "available_minor_units" BIGINT NOT NULL DEFAULT 0,
    "reserved_minor_units" BIGINT NOT NULL DEFAULT 0,
    "withdrawn_minor_units" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("user_id","currency")
);

-- CreateTable
CREATE TABLE "payout_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "method_type" "PayoutMethodType" NOT NULL,
    "provider_vault_ref" TEXT NOT NULL,
    "masked_label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payout_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "payout_method_id" UUID NOT NULL,
    "amount_minor_units" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "completed_by_user_id" UUID,
    "completed_at" TIMESTAMPTZ(6),
    "payment_utr" VARCHAR(128),
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_request_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payout_request_id" UUID NOT NULL,
    "event_type" "PayoutRequestEventType" NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "actor_user_id" UUID,
    "event_key" TEXT NOT NULL,
    "safe_metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_request_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "transaction_type" "LedgerTransactionType" NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "rule_id" UUID,
    "source_event_id" TEXT,
    "commission_base_minor_units" BIGINT,
    "rate_bps" INTEGER,
    "commission_minor_units" BIGINT,
    "promo_code_normalized" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger_entries" (
    "transaction_id" UUID NOT NULL,
    "line_number" SMALLINT NOT NULL,
    "bucket" "LedgerBucket" NOT NULL,
    "amount_minor_units" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_entries_pkey" PRIMARY KEY ("transaction_id","line_number")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_external_subject_key" ON "users"("external_subject");

-- CreateIndex
CREATE UNIQUE INDEX "referral_campaigns_campaign_key_key" ON "referral_campaigns"("campaign_key");

-- CreateIndex
CREATE INDEX "referral_codes_owner_user_id_created_at_idx" ON "referral_codes"("owner_user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_id_owner_user_id_key" ON "referral_codes"("id", "owner_user_id");

-- CreateIndex
CREATE INDEX "referral_attributions_referrer_user_id_attributed_at_idx" ON "referral_attributions"("referrer_user_id", "attributed_at" DESC);

-- CreateIndex
CREATE INDEX "referral_attributions_referred_user_id_attributed_at_idx" ON "referral_attributions"("referred_user_id", "attributed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "referral_attributions_referral_code_id_referred_user_id_key" ON "referral_attributions"("referral_code_id", "referred_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_link_events_dedupe_key_key" ON "referral_link_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "referral_link_events_referral_code_id_occurred_at_idx" ON "referral_link_events"("referral_code_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "referral_chat_access_unlock_source_event_id_key" ON "referral_chat_access"("unlock_source_event_id");

-- CreateIndex
CREATE INDEX "referral_events_attribution_id_occurred_at_idx" ON "referral_events"("attribution_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "referral_events_source_system_source_event_id_key" ON "referral_events"("source_system", "source_event_id");

-- CreateIndex
CREATE INDEX "referral_order_events_referral_attribution_id_occurred_at_idx" ON "referral_order_events"("referral_attribution_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "referral_order_events_source_system_source_event_id_key" ON "referral_order_events"("source_system", "source_event_id");

-- CreateIndex
CREATE INDEX "payout_methods_user_id_is_active_idx" ON "payout_methods"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "payout_methods_user_id_id_key" ON "payout_methods"("user_id", "id");

-- CreateIndex
CREATE INDEX "payout_requests_user_id_requested_at_idx" ON "payout_requests"("user_id", "requested_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payout_requests_user_id_idempotency_key_key" ON "payout_requests"("user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "payout_request_events_event_key_key" ON "payout_request_events"("event_key");

-- CreateIndex
CREATE INDEX "payout_request_events_payout_request_id_occurred_at_idx" ON "payout_request_events"("payout_request_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_ledger_transactions_idempotency_key_key" ON "wallet_ledger_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "wallet_ledger_transactions_user_id_created_at_idx" ON "wallet_ledger_transactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "wallet_ledger_transactions_reference_type_reference_id_idx" ON "wallet_ledger_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "wallet_ledger_entries_bucket_created_at_idx" ON "wallet_ledger_entries"("bucket", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "referral_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referral_code_id_referrer_user_id_fkey" FOREIGN KEY ("referral_code_id", "referrer_user_id") REFERENCES "referral_codes"("id", "owner_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "referral_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_link_events" ADD CONSTRAINT "referral_link_events_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_link_events" ADD CONSTRAINT "referral_link_events_attribution_id_fkey" FOREIGN KEY ("attribution_id") REFERENCES "referral_attributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_link_metrics" ADD CONSTRAINT "referral_link_metrics_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_chat_access" ADD CONSTRAINT "referral_chat_access_attribution_id_fkey" FOREIGN KEY ("attribution_id") REFERENCES "referral_attributions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_attribution_id_fkey" FOREIGN KEY ("attribution_id") REFERENCES "referral_attributions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_rules" ADD CONSTRAINT "reward_rules_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "referral_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_order_events" ADD CONSTRAINT "referral_order_events_referral_attribution_id_fkey" FOREIGN KEY ("referral_attribution_id") REFERENCES "referral_attributions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_methods" ADD CONSTRAINT "payout_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_user_id_payout_method_id_fkey" FOREIGN KEY ("user_id", "payout_method_id") REFERENCES "payout_methods"("user_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_request_events" ADD CONSTRAINT "payout_request_events_payout_request_id_fkey" FOREIGN KEY ("payout_request_id") REFERENCES "payout_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_request_events" ADD CONSTRAINT "payout_request_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger_transactions" ADD CONSTRAINT "wallet_ledger_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger_transactions" ADD CONSTRAINT "wallet_ledger_transactions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "reward_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "wallet_ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Manual additions — ported from the approved draft DDL (PHASE_1_SCHEMA.sql).
-- Prisma cannot express CHECK constraints, functional indexes or partial
-- indexes, so they live here. These are part of the data-integrity contract —
-- keep them when reviewing/regenerating migrations.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Case-insensitive uniqueness (functional unique indexes)
CREATE UNIQUE INDEX "users_username_ci_uq"
    ON "referral_app"."users" (lower("username"))
    WHERE "username" IS NOT NULL;
CREATE UNIQUE INDEX "referral_codes_public_code_ci_uq"
    ON "referral_app"."referral_codes" (lower(btrim("public_code")));

-- 2) Partial unique indexes (versioning + duplicate-credit guard)
CREATE UNIQUE INDEX "reward_rules_global_version_uq"
    ON "referral_app"."reward_rules" ("rule_key", "rule_version")
    WHERE "campaign_id" IS NULL;
CREATE UNIQUE INDEX "reward_rules_campaign_version_uq"
    ON "referral_app"."reward_rules" ("campaign_id", "rule_key", "rule_version")
    WHERE "campaign_id" IS NOT NULL;
-- Prevent a second completed-order credit for the same order even if the
-- sender retries with a brand-new event id.
CREATE UNIQUE INDEX "referral_order_completed_once_uq"
    ON "referral_app"."referral_order_events" ("source_system", "order_id")
    WHERE "event_type" = 'ORDER_COMPLETED';

-- 3) Partial index — admin payout queue
CREATE INDEX "payout_requests_admin_queue_idx"
    ON "referral_app"."payout_requests" ("requested_at" ASC)
    WHERE "status" = 'PENDING_APPROVAL';

-- 4) CHECK constraints (state-machine + money invariants)
ALTER TABLE "referral_app"."referral_campaigns"
    ADD CONSTRAINT "referral_campaigns_window_chk"
    CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" > "starts_at");

ALTER TABLE "referral_app"."referral_codes"
    ADD CONSTRAINT "referral_codes_expiry_chk"
    CHECK ("expires_at" IS NULL OR "expires_at" > "created_at");

ALTER TABLE "referral_app"."referral_link_events"
    ADD CONSTRAINT "referral_link_events_attribution_chk"
    CHECK (
        ("event_type" = 'CLICK' AND "attribution_id" IS NULL)
        OR ("event_type" IN ('REFERRAL_ATTRIBUTED', 'CONVERSION') AND "attribution_id" IS NOT NULL)
    );

ALTER TABLE "referral_app"."referral_chat_access"
    ADD CONSTRAINT "referral_chat_access_state_chk"
    CHECK (
        ("access_state" = 'LOCKED' AND "unlocked_at" IS NULL)
        OR ("access_state" = 'UNLOCKED' AND "unlocked_at" IS NOT NULL)
    );

ALTER TABLE "referral_app"."reward_rules"
    ADD CONSTRAINT "reward_rules_window_chk"
    CHECK ("effective_until" IS NULL OR "effective_until" > "effective_from"),
    ADD CONSTRAINT "reward_rules_rate_chk"
    CHECK ("rate_bps" >= 0 AND "rate_bps" <= 10000),
    ADD CONSTRAINT "reward_rules_match_chk"
    CHECK (
        ("match_type" = 'DEFAULT' AND "promo_code_normalized" IS NULL)
        OR ("match_type" = 'PROMO_CODE' AND "promo_code_normalized" IS NOT NULL)
    );

ALTER TABLE "referral_app"."referral_order_events"
    ADD CONSTRAINT "referral_order_amounts_chk"
    CHECK ("commissionable_net_amount_minor_units" >= 0 AND "refund_amount_minor_units" >= 0);

ALTER TABLE "referral_app"."referral_link_metrics"
    ADD CONSTRAINT "referral_link_metrics_counts_chk"
    CHECK ("click_count" >= 0 AND "unique_click_count" >= 0 AND "referral_count" >= 0 AND "conversion_count" >= 0);

ALTER TABLE "referral_app"."payout_requests"
    ADD CONSTRAINT "payout_requests_amount_chk"
    CHECK ("amount_minor_units" > 0),
    ADD CONSTRAINT "payout_requests_review_chk"
    CHECK (
        "status" NOT IN ('APPROVED', 'REJECTED', 'COMPLETED')
        OR ("reviewed_by_user_id" IS NOT NULL AND "reviewed_at" IS NOT NULL)
    ),
    ADD CONSTRAINT "payout_requests_completion_chk"
    CHECK (
        "status" <> 'COMPLETED'
        OR ("completed_by_user_id" IS NOT NULL AND "completed_at" IS NOT NULL AND "payment_utr" IS NOT NULL)
    );

ALTER TABLE "referral_app"."wallet_ledger_transactions"
    ADD CONSTRAINT "wallet_ledger_transactions_rate_chk"
    CHECK ("rate_bps" IS NULL OR ("rate_bps" >= 0 AND "rate_bps" <= 10000));

ALTER TABLE "referral_app"."wallet_ledger_entries"
    ADD CONSTRAINT "wallet_ledger_entries_amount_chk"
    CHECK ("amount_minor_units" <> 0);

-- 5) Confirmed starter reward rules (25% default / TEAMCHX 50%).
-- Future changes create a NEW version row — never edit history.
INSERT INTO "referral_app"."reward_rules"
    ("campaign_id", "rule_key", "rule_version", "match_type", "promo_code_normalized", "rate_bps", "currency")
VALUES
    (NULL, 'DEFAULT_REFERRAL', 1, 'DEFAULT', NULL, 2500, 'INR'),
    (NULL, 'PROMO_TEAMCHX', 1, 'PROMO_CODE', 'TEAMCHX', 5000, 'INR')
ON CONFLICT DO NOTHING;
