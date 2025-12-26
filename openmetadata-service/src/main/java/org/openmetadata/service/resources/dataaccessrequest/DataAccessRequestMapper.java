package org.openmetadata.service.resources.dataaccessrequest;

import java.sql.Timestamp;
import org.openmetadata.service.mapper.EntityMapper;

/**
 * Mapper to convert CreateDataAccessRequest into DataAccessRequest POJO.
 * Keeps conversion logic centralized so resource can stay thin.
 */
public class DataAccessRequestMapper {

  public DataAccessRequest createToEntity(
      CreateDataAccessRequest create, String id, String createdBy, Timestamp now, DataAccessRequestService service) {
    DataAccessRequest request = new DataAccessRequest();

    request.setId(id);
    request.setDataAssetFQN(create.getDataAssetFQN());

    String sanitizedPurposeHtml = service.sanitizeHtml(create.getPurposeHtml());
    request.setPurposeHtml(sanitizedPurposeHtml);
    request.setPurposeText(service.plainText(sanitizedPurposeHtml));

    String sanitizedNotes = service.sanitizeHtml(create.getNotesHtml());
    request.setNotesHtml(sanitizedNotes);
    request.setNotesText(service.plainText(sanitizedNotes));

    request.setStartDate(create.getStartDate());
    request.setEndDate(create.getEndDate());

    if (create.getPriority() != null) {
      try {
        request.setPriority(PriorityLevel.valueOf(create.getPriority().trim().toUpperCase()));
      } catch (IllegalArgumentException ex) {
        request.setPriority(PriorityLevel.NONE);
      }
    }

    request.setCreatedBy(createdBy);
    request.setCreatedAt(now);

    return request;
  }
}
