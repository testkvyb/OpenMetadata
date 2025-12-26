package org.openmetadata.service.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;

/**
 * Deserializes various incoming representations into {@link java.time.LocalDate}:
 * - ISO date string ("yyyy-MM-dd")
 * - ISO date-time ("yyyy-MM-ddTHH:mm:ss")
 * - ISO offset date-time (with timezone)
 * - numeric epoch milliseconds (as JSON number)
 */
public class LocalDateDeserializer extends JsonDeserializer<LocalDate> {
    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p == null) {
            return null;
        }

        switch (p.getCurrentToken()) {
            case VALUE_NUMBER_INT -> {
                // epoch milliseconds
                long epochMillis = p.getLongValue();
                return Instant.ofEpochMilli(epochMillis).atZone(ZoneOffset.UTC).toLocalDate();
            }
            case VALUE_STRING -> {
                String text = p.getText().trim();
                if (text.isEmpty()) {
                    return null;
                }
                // Try LocalDate
                try {
                    return LocalDate.parse(text);
                } catch (DateTimeParseException ignored) {
                }
                // Try LocalDateTime
                try {
                    LocalDateTime ldt = LocalDateTime.parse(text);
                    return ldt.toLocalDate();
                } catch (DateTimeParseException ignored) {
                }
                // Try OffsetDateTime (with zone)
                try {
                    OffsetDateTime odt = OffsetDateTime.parse(text);
                    return odt.toLocalDate();
                } catch (DateTimeParseException ex) {
                    throw new IOException("Failed to parse date into LocalDate: " + text, ex);
                }
            }
            default -> throw new IOException("Unsupported token for LocalDate deserialization: " + p.getCurrentToken());
        }
    }
}

