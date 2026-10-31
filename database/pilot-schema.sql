-- Антон: схема отдельного серверного пилота только с искусственными данными.
-- Не использовать как готовую production-миграцию и не помещать сюда реальные сведения.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE demo_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (name LIKE 'ДЕМО-%'),
  kind text NOT NULL CHECK (kind IN ('outpatient', 'inpatient')),
  city text NOT NULL CHECK (city LIKE 'ДЕМО-%' OR city IN ('Челябинск','Магнитогорск','Златоуст','Миасс','Копейск','Сатка')),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE demo_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login text NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (display_name LIKE 'ДЕМО-%'),
  role text NOT NULL CHECK (role IN ('outpatient','inpatient','patient','admin')),
  organization_id uuid REFERENCES demo_organizations(id),
  credential_hash text NOT NULL,
  patient_code text UNIQUE CHECK (patient_code IS NULL OR patient_code LIKE 'TEST-%'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((role = 'patient' AND patient_code IS NOT NULL) OR (role <> 'patient' AND patient_code IS NULL))
);

CREATE TABLE demo_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code text NOT NULL UNIQUE CHECK (public_code LIKE 'ДЕМО-%'),
  surname text NOT NULL CHECK (surname LIKE 'ДЕМО-%'),
  given_name text NOT NULL CHECK (given_name LIKE 'ДЕМО-%'),
  patronymic text NOT NULL CHECK (patronymic LIKE 'ДЕМО-%'),
  policy_number text NOT NULL UNIQUE CHECK (policy_number LIKE 'ДЕМО-%'),
  snils text NOT NULL UNIQUE CHECK (snils LIKE 'ДЕМО-%'),
  diagnosis text NOT NULL CHECK (diagnosis LIKE 'ДЕМО-%'),
  icd_code text NOT NULL CHECK (icd_code LIKE 'ДЕМО-%'),
  procedure_text text NOT NULL CHECK (procedure_text LIKE 'ДЕМО-%'),
  procedure_code text NOT NULL CHECK (procedure_code LIKE 'ДЕМО-%'),
  comment text NOT NULL DEFAULT 'ДЕМО-не указан' CHECK (comment LIKE 'ДЕМО-%'),
  status text NOT NULL CHECK (status IN ('draft','waiting','clarification','review','confirmed','admitted','documents','no_show','completed','cancelled','archived')),
  payment text NOT NULL CHECK (payment IN ('oms','paid','both')),
  city text NOT NULL CHECK (city IN ('Челябинск','Магнитогорск','Златоуст','Миасс','Копейск','Сатка')),
  ready boolean NOT NULL DEFAULT false,
  travel boolean NOT NULL DEFAULT false,
  requires_in_person_exam boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES demo_users(id),
  source_organization_id uuid NOT NULL REFERENCES demo_organizations(id),
  updated_by uuid REFERENCES demo_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE demo_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES demo_referrals(id),
  accepting_organization_id uuid NOT NULL REFERENCES demo_organizations(id),
  proposed_date date NOT NULL,
  valid_until date NOT NULL,
  payment text NOT NULL CHECK (payment IN ('oms','paid')),
  price_example numeric(12,2) CHECK (price_example IS NULL OR price_example >= 0),
  state text NOT NULL CHECK (state IN ('offered','confirmed','declined','expired','closed')),
  patient_response text CHECK (patient_response IS NULL OR patient_response LIKE 'ДЕМО-%'),
  created_by uuid NOT NULL REFERENCES demo_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until >= proposed_date)
);

CREATE TABLE demo_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES demo_referrals(id),
  sample_key text NOT NULL CHECK (sample_key IN ('sample-labs','sample-ultrasound','sample-ecg')),
  display_name text NOT NULL CHECK (display_name LIKE 'ДЕМО-%'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE demo_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referral_id uuid REFERENCES demo_referrals(id),
  actor_id uuid NOT NULL REFERENCES demo_users(id),
  event_type text NOT NULL,
  reason text CHECK (reason IS NULL OR reason LIKE 'ДЕМО-%'),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX demo_referrals_status_created_idx ON demo_referrals(status, created_at);
CREATE INDEX demo_referrals_author_created_idx ON demo_referrals(created_by, created_at);
CREATE INDEX demo_offers_referral_idx ON demo_offers(referral_id, created_at);
CREATE INDEX demo_events_referral_idx ON demo_events(referral_id, created_at);
