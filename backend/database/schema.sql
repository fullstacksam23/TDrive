-- supabase sql schema


-- files table
create table if not exists files (
                                     id bigint generated always as identity primary key,
                                     file_name text not null,
                                     mimetype text,
                                     total_size bigint,
                                     uploaded_at timestamptz default now()
    );

-- file chunks
create table if not exists file_chunks (
                                           id bigint generated always as identity primary key,
                                           file_id bigint references files(id) on delete cascade,
    chunk_index integer,
    telegram_file_id text
    );

-- full-text search column
alter table files
    add column if not exists search_vector tsvector;

-- trigger function
create or replace function files_search_trigger()
returns trigger as $$
begin
  new.search_vector :=
    setweight(
      to_tsvector('english', coalesce(new.file_name, '')),
      'A'
    );
return new;
end;
$$ language plpgsql;

-- trigger
drop trigger if exists tsvectorupdate on files;

create trigger tsvectorupdate
    before insert or update on files
                         for each row execute function files_search_trigger();
