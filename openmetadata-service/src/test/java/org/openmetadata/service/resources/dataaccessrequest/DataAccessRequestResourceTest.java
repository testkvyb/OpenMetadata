package org.openmetadata.service.resources.dataaccessrequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import org.openmetadata.service.OpenMetadataApplicationTest;
import static org.openmetadata.service.util.TestUtils.ADMIN_AUTH_HEADERS;
import org.openmetadata.service.security.SecurityUtil;

public class DataAccessRequestResourceTest extends OpenMetadataApplicationTest {

    @Test
    void postDataAccessRequest() {
        CreateDataAccessRequest create = new CreateDataAccessRequest();
        create.setDataAssetFQN("service.database.table");
        create.setPurposeHtml("<p>Need access for analysis</p>");
        create.setNotesHtml("<p>Some notes</p>");
        create.setStartDate(java.time.LocalDate.now());
        create.setEndDate(java.time.LocalDate.now().plusDays(10));
        create.setPriority("normal");

        Response response =
                SecurityUtil.addHeaders(getResource("dataAccessRequests"), ADMIN_AUTH_HEADERS)
                        .post(Entity.json(create));

        assertEquals(201, response.getStatus());
        DataAccessRequest created = response.readEntity(DataAccessRequest.class);
        assertEquals("service.database.table", created.getDataAssetFQN());
        assertEquals("admin", created.getCreatedBy());
    }

    @Test
    void listDataAccessRequests() {
        // create an entry
        CreateDataAccessRequest create = new CreateDataAccessRequest();
        create.setDataAssetFQN("service.database.table2");
        create.setPurposeHtml("<p>Need access</p>");
        create.setStartDate(java.time.LocalDate.now());
        create.setPriority("normal");
        Response postResponse =
                SecurityUtil.addHeaders(getResource("dataAccessRequests"), ADMIN_AUTH_HEADERS).post(Entity.json(create));
        assertEquals(201, postResponse.getStatus());
        DataAccessRequest created = postResponse.readEntity(DataAccessRequest.class);

        // list
        Response response =
                SecurityUtil.addHeaders(getResource("dataAccessRequests?limit=10&offset=0"), ADMIN_AUTH_HEADERS).get();
        assertEquals(200, response.getStatus());
        DataAccessRequestResource.DataAccessRequestList list =
                response.readEntity(DataAccessRequestResource.DataAccessRequestList.class);
        assertTrue(list.getData().size() >= 1);

        // verify get by id
        Response getResponse = SecurityUtil.addHeaders(getResource("dataAccessRequests/" + created.getId()), ADMIN_AUTH_HEADERS).get();
        assertEquals(200, getResponse.getStatus());
        DataAccessRequest fetched = getResponse.readEntity(DataAccessRequest.class);
        assertEquals(created.getId(), fetched.getId());
    }
}


