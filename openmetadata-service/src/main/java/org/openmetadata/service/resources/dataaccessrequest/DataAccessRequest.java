package org.openmetadata.service.resources.dataaccessrequest;

import java.sql.Timestamp;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataAccessRequest {
  private String id;
  private String dataAssetFQN;
  private String purposeHtml;
  private String purposeText;
  private String notesHtml;
  private String notesText;
  private LocalDate startDate;
  private LocalDate endDate;
  private PriorityLevel priority;
  private String createdBy;
  private Timestamp createdAt;
}
