package org.openmetadata.service.jdbi3;

import java.sql.ResultSet;
import java.sql.SQLException;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.openmetadata.service.resources.dataaccessrequest.DataAccessRequest;
import org.openmetadata.service.resources.dataaccessrequest.PriorityLevel;

public class DataAccessRequestMapper implements RowMapper<DataAccessRequest> {
  @Override
  public DataAccessRequest map(ResultSet rs, StatementContext ctx) throws SQLException {
    DataAccessRequest request = new DataAccessRequest();
    request.setId(rs.getString("id"));
    request.setDataAssetFQN(rs.getString("dataAssetFQN"));
    request.setPurposeHtml(rs.getString("purposeHtml"));
    request.setPurposeText(rs.getString("purposeText"));
    request.setNotesHtml(rs.getString("notesHtml"));
    request.setNotesText(rs.getString("notesText"));
    java.sql.Date sd = rs.getDate("startDate");
    if (sd != null) request.setStartDate(sd.toLocalDate());
    java.sql.Date ed = rs.getDate("endDate");
    if (ed != null) request.setEndDate(ed.toLocalDate());
    String pr = rs.getString("priority");
    if (pr != null) request.setPriority(PriorityLevel.valueOf(pr));
    request.setCreatedBy(rs.getString("createdBy"));
    request.setCreatedAt(rs.getTimestamp("createdAt"));
    return request;
  }
}
