drop extension if exists "pg_net";


  create table "dm"."sop_doc_versions" (
    "id" uuid not null default gen_random_uuid(),
    "sop_doc_id" uuid not null,
    "version" text not null,
    "canonical" jsonb not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "dm"."sop_docs" (
    "id" uuid not null default gen_random_uuid(),
    "sop_id" text not null,
    "title" text not null default ''::text,
    "status" text not null default 'DRAFT'::text,
    "current_version_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


CREATE UNIQUE INDEX sop_doc_versions_pkey ON dm.sop_doc_versions USING btree (id);

CREATE UNIQUE INDEX sop_doc_versions_unique_version ON dm.sop_doc_versions USING btree (sop_doc_id, version);

CREATE UNIQUE INDEX sop_docs_pkey ON dm.sop_docs USING btree (id);

CREATE UNIQUE INDEX sop_docs_sop_id_key ON dm.sop_docs USING btree (sop_id);

alter table "dm"."sop_doc_versions" add constraint "sop_doc_versions_pkey" PRIMARY KEY using index "sop_doc_versions_pkey";

alter table "dm"."sop_docs" add constraint "sop_docs_pkey" PRIMARY KEY using index "sop_docs_pkey";

alter table "dm"."sop_doc_versions" add constraint "sop_doc_versions_sop_doc_id_fkey" FOREIGN KEY (sop_doc_id) REFERENCES dm.sop_docs(id) ON DELETE CASCADE not valid;

alter table "dm"."sop_doc_versions" validate constraint "sop_doc_versions_sop_doc_id_fkey";

alter table "dm"."sop_doc_versions" add constraint "sop_doc_versions_unique_version" UNIQUE using index "sop_doc_versions_unique_version";

alter table "dm"."sop_docs" add constraint "sop_docs_current_version_fk" FOREIGN KEY (current_version_id) REFERENCES dm.sop_doc_versions(id) DEFERRABLE INITIALLY DEFERRED not valid;

alter table "dm"."sop_docs" validate constraint "sop_docs_current_version_fk";

alter table "dm"."sop_docs" add constraint "sop_docs_sop_id_key" UNIQUE using index "sop_docs_sop_id_key";

alter table "dm"."sop_docs" add constraint "sop_docs_status_chk" CHECK ((status = ANY (ARRAY['DRAFT'::text, 'IN_REVIEW'::text, 'APPROVED'::text, 'ARCHIVED'::text]))) not valid;

alter table "dm"."sop_docs" validate constraint "sop_docs_status_chk";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION dm.tg_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION dm.tg_validate_current_version_belongs()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.current_version_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from dm.sop_doc_versions v
    where v.id = new.current_version_id
      and v.sop_doc_id = new.id
  ) then
    raise exception 'current_version_id must reference a version belonging to this sop_doc';
  end if;

  return new;
end;
$function$
;

CREATE TRIGGER trg_sop_docs_updated_at BEFORE UPDATE ON dm.sop_docs FOR EACH ROW EXECUTE FUNCTION dm.tg_set_updated_at();

CREATE TRIGGER trg_sop_docs_validate_current_version BEFORE INSERT OR UPDATE ON dm.sop_docs FOR EACH ROW EXECUTE FUNCTION dm.tg_validate_current_version_belongs();


