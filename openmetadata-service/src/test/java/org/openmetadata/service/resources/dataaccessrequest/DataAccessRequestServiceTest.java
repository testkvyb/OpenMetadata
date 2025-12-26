package org.openmetadata.service.resources.dataaccessrequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

public class DataAccessRequestServiceTest {
    private final DataAccessRequestService service = new DataAccessRequestService();

    @Test
    void testSanitizeAndPlainText() {
        String html = "<div>Example <script>alert(1)</script><b>Markup</b><img src=\"https://example.com/a.png\"/></div>";
        String sanitized = service.sanitizeHtml(html);
        String text = service.plainText(sanitized);

        // sanitized shouldn't contain script tag
        assertEquals("Example Markup", text);
    }

    @Test
    void testValidateDates() {
        CreateDataAccessRequest r = new CreateDataAccessRequest();
        r.setDataAssetFQN("a.b.c");
        r.setPurposeHtml("<p>x</p>");
        r.setStartDate(java.time.LocalDate.now());
        r.setEndDate(java.time.LocalDate.now().minusDays(1));
        r.setPriority("normal");

        assertThrows(IllegalArgumentException.class, () -> service.validateCreateRequest(r));
    }
}

