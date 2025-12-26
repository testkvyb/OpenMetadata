package org.openmetadata.service.jdbi3;

import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.openmetadata.service.resources.dataaccessrequest.DataAccessRequest;

@RegisterRowMapper(org.openmetadata.service.jdbi3.DataAccessRequestMapper.class)
public interface DataAccessRequestDAO {
  @SqlUpdate(
      "INSERT INTO data_access_request (id, data_asset_fqn, purpose_html, purpose_text, notes_html, notes_text, start_date, end_date, priority, created_by, created_at) "
          + "VALUES (:id, :dataAssetFQN, :purposeHtml, :purposeText, :notesHtml, :notesText, :startDate, :endDate, :priority, :createdBy, :createdAt)")
  void insert(
      @Bind("id") String id,
      @Bind("dataAssetFQN") String dataAssetFQN,
      @Bind("purposeHtml") String purposeHtml,
      @Bind("purposeText") String purposeText,
      @Bind("notesHtml") String notesHtml,
      @Bind("notesText") String notesText,
      @Bind("startDate") java.sql.Date startDate,
      @Bind("endDate") java.sql.Date endDate,
      @Bind("priority") String priority,
      @Bind("createdBy") String createdBy,
      @Bind("createdAt") java.sql.Timestamp createdAt);

  @SqlQuery(
      "SELECT id, data_asset_fqn as dataAssetFQN, purpose_html as purposeHtml, purpose_text as purposeText, notes_html as notesHtml, notes_text as notesText, start_date as startDate, end_date as endDate, priority, created_by as createdBy, created_at as createdAt "
          + "FROM data_access_request WHERE id = :id")
  DataAccessRequest getById(@Bind("id") String id);

  @SqlQuery(
      "SELECT id, data_asset_fqn as dataAssetFQN, purpose_html as purposeHtml, purpose_text as purposeText, notes_html as notesHtml, notes_text as notesText, start_date as startDate, end_date as endDate, priority, created_by as createdBy, created_at as createdAt "
          + "FROM data_access_request "
          + "WHERE (:dataAssetFQN IS NULL OR data_asset_fqn = :dataAssetFQN) "
          + "AND (:createdBy IS NULL OR created_by = :createdBy) "
          + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
  java.util.List<DataAccessRequest> list(
      @Bind("limit") int limit,
      @Bind("offset") int offset,
      @Bind("dataAssetFQN") String dataAssetFQN,
      @Bind("createdBy") String createdBy);

  @SqlQuery(
      "SELECT count(*) FROM data_access_request "
          + "WHERE (:dataAssetFQN IS NULL OR data_asset_fqn = :dataAssetFQN) "
          + "AND (:createdBy IS NULL OR created_by = :createdBy)")
  int count(@Bind("dataAssetFQN") String dataAssetFQN, @Bind("createdBy") String createdBy);
}
