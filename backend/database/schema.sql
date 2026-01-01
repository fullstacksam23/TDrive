-- main file table
CREATE TABLE IF NOT EXISTS files (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     file_name TEXT,
                                     mimetype TEXT,
                                     total_size INTEGER,
                                     uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- chunks
CREATE TABLE IF NOT EXISTS file_chunks (
                                           id INTEGER PRIMARY KEY AUTOINCREMENT,
                                           file_id INTEGER,
                                           chunk_index INTEGER,
                                           telegram_file_id TEXT,
                                           FOREIGN KEY (file_id) REFERENCES files(id)
    );

-- full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS files_search USING fts5(
  file_id UNINDEXED,
  file_name,
  tags,
  description
);
