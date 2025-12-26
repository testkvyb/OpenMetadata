package org.openmetadata.service.resources.dataaccessrequest;

import java.sql.Timestamp;
import java.time.ZoneOffset;
import java.util.Objects;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class DataAccessRequestService {
  // sanitize HTML using Jsoup and return cleaned HTML
  public String sanitizeHtml(String html) {
    if (html == null) return null;
    return Jsoup.clean(html, Safelist.basicWithImages());
  }

  // convert sanitized HTML to plain text
  public String plainText(String html) {
    if (html == null) return null;
    return Jsoup.parse(html).text();
  }

  public void validateCreateRequest(CreateDataAccessRequest request) {
    Objects.requireNonNull(request, "create request must not be null");
    Objects.requireNonNull(request.getDataAssetFQN(), "dataAssetFQN must be provided");
    Objects.requireNonNull(request.getPurposeHtml(), "purpose must be provided");
    Objects.requireNonNull(request.getStartDate(), "startDate must be provided");
    Objects.requireNonNull(request.getPriority(), "priority must be provided");
    // Validate priority string maps to known enum (case-insensitive)
    try {
      PriorityLevel.valueOf(request.getPriority().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid priority value: " + request.getPriority());
    }

    if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
      throw new IllegalArgumentException("endDate cannot be before startDate");
    }
  }

  public Timestamp nowUtcTimestamp() {
    return Timestamp.from(java.time.Instant.now().atOffset(ZoneOffset.UTC).toInstant());
  }
}
