package org.openmetadata.service.resources.dataaccessrequest;

import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.*;
import org.openmetadata.service.util.LocalDateDeserializer;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CreateDataAccessRequest {
    private String dataAssetFQN;
    private String purposeHtml;
    private String notesHtml;
    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate startDate;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate endDate;
    private String priority;
    private List<String> attachmentDocumentIds;
}

