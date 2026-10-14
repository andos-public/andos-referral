-- Sprint 3 — locked attribution policy + commission/ledger support.
--
-- 1) FIRST-TOUCH SINGLE ATTRIBUTION: a referred user can be attributed to exactly one
--    referrer for life, so (referral_code_id, referred_user_id) uniqueness is not enough —
--    the referred user id itself must be unique. This is the DB-level guarantee behind the
--    owner-locked policy; the service still answers business reasons instead of 500s.
CREATE UNIQUE INDEX "referral_attributions_referred_user_uq"
    ON "referral_app"."referral_attributions" ("referred_user_id");

-- 2) SELF-REFERRAL IS NEVER VALID: block it at the data layer as well (the service also
--    checks the external/Firebase identity mapping, which SQL cannot express here).
ALTER TABLE "referral_app"."referral_attributions"
    ADD CONSTRAINT "referral_attributions_no_self_referral_chk"
    CHECK ("referrer_user_id" <> "referred_user_id");

-- 3) The 7-day (168 h) hold release sweep scans completed orders past their window.
CREATE INDEX "referral_order_events_event_type_occurred_at_idx"
    ON "referral_app"."referral_order_events" ("event_type", "occurred_at" ASC);
