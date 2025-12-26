-- Flyway migration: create data_access_request table
CREATE TABLE IF NOT EXISTS data_access_request (
  id VARCHAR(36) NOT NULL,
  data_asset_fqn VARCHAR(2048) NOT NULL,
  purpose_html LONGTEXT NOT NULL,
  purpose_text TEXT NOT NULL,
  notes_html LONGTEXT,
  notes_text TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  priority VARCHAR(32) NOT NULL,
  created_by VARCHAR(256) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_data_access_request_created_by ON data_access_request (created_by);
CREATE INDEX idx_data_access_request_data_asset_fqn ON data_access_request (data_asset_fqn);
