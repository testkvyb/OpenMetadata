-- Add Flowable batch processing tables for history cleanup support
CREATE TABLE IF NOT EXISTS flw_ru_batch (
    id_ VARCHAR(64) NOT NULL, 
    rev_ INTEGER, 
    type_ VARCHAR(64) NOT NULL, 
    search_key_ VARCHAR(255), 
    search_key2_ VARCHAR(255), 
    create_time_ TIMESTAMP(3) NOT NULL, 
    complete_time_ TIMESTAMP(3), 
    status_ VARCHAR(255), 
    batch_doc_id_ VARCHAR(64), 
    tenant_id_ VARCHAR(255) DEFAULT '', 
    CONSTRAINT pk_flw_ru_batch PRIMARY KEY (id_)
);

CREATE INDEX idx_flw_ru_batch_type ON flw_ru_batch (type_);
CREATE INDEX idx_flw_ru_batch_search_key ON flw_ru_batch (search_key_);
CREATE INDEX idx_flw_ru_batch_status ON flw_ru_batch (status_);

CREATE TABLE IF NOT EXISTS flw_ru_batch_part (
    id_ VARCHAR(64) NOT NULL, 
    rev_ INTEGER, 
    batch_id_ VARCHAR(64), 
    type_ VARCHAR(64) NOT NULL, 
    scope_id_ VARCHAR(64), 
    sub_scope_id_ VARCHAR(64), 
    scope_type_ VARCHAR(64), 
    search_key_ VARCHAR(255), 
    search_key2_ VARCHAR(255), 
    create_time_ TIMESTAMP(3) NOT NULL, 
    complete_time_ TIMESTAMP(3), 
    status_ VARCHAR(255), 
    result_doc_id_ VARCHAR(64), 
    tenant_id_ VARCHAR(255) DEFAULT '', 
    CONSTRAINT pk_flw_ru_batch_part PRIMARY KEY (id_)
);

CREATE INDEX idx_flw_ru_batch_part_batch_id ON flw_ru_batch_part (batch_id_);
CREATE INDEX idx_flw_ru_batch_part_type ON flw_ru_batch_part (type_);
CREATE INDEX idx_flw_ru_batch_part_status ON flw_ru_batch_part (status_);

-- Update workflow settings with new history cleanup configuration fields
UPDATE openmetadata_settings
SET json = JSON_SET(
    JSON_SET(
        JSON_SET(
            JSON_SET(
                json,
                '$.historyCleanUpConfiguration.batchSize',
                1000
            ),
            '$.historyCleanUpConfiguration.timeCycleConfig',
            '0 0 0 ? * 1'
        ),
        '$.runTimeCleanUpConfiguration',
        JSON_OBJECT()
    ),
    '$.runTimeCleanUpConfiguration.batchSize',
    500
)
WHERE configType = 'workflowSettings';

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

-- Create governance_policy_entity table for storing governance policies
CREATE TABLE IF NOT EXISTS governance_policy_entity (
  `id` VARCHAR(36) GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.id'))) STORED NOT NULL,
  `name` VARCHAR(256) GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.name'))) VIRTUAL NOT NULL,
  `json` JSON NOT NULL,
  `updatedAt` BIGINT UNSIGNED GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.updatedAt'))) VIRTUAL NOT NULL,
  `updatedBy` VARCHAR(256) GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.updatedBy'))) VIRTUAL NOT NULL,
  `deleted` TINYINT(1) GENERATED ALWAYS AS (json_extract(`json`, '$.deleted')) VIRTUAL,
  `nameHash` VARCHAR(256) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  UNIQUE KEY `nameHash` (`nameHash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create governance_standard_entity table for storing governance standards (children of policies)
CREATE TABLE IF NOT EXISTS governance_standard_entity (
  `id` VARCHAR(36) GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.id'))) STORED NOT NULL,
  `json` JSON NOT NULL,
  `updatedAt` BIGINT UNSIGNED GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.updatedAt'))) VIRTUAL NOT NULL,
  `updatedBy` VARCHAR(256) GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.updatedBy'))) VIRTUAL NOT NULL,
  `deleted` TINYINT(1) GENERATED ALWAYS AS (json_extract(`json`, '$.deleted')) VIRTUAL,
  `fqnHash` VARCHAR(768) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `governancePolicyHash` VARCHAR(256) GENERATED ALWAYS AS (SUBSTRING_INDEX(fqnHash, '.', 1)) STORED,
  `name` VARCHAR(256) GENERATED ALWAYS AS (json_unquote(json_extract(`json`, '$.name'))) VIRTUAL NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fqnHash` (`fqnHash`),
  INDEX `idx_governance_standard_policy_hash_deleted` (`governancePolicyHash`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX IF NOT EXISTS idx_governance_policy_name_hash_deleted ON governance_policy_entity (nameHash, deleted);
