package org.openmetadata.service.resources.dataaccessrequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;
import org.openmetadata.service.jdbi3.DataAccessRequestDAO;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.security.SecurityUtil;

@Path("/v1/dataAccessRequests")
@Tag(name = "DataAccessRequests")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "dataAccessRequests")
public class DataAccessRequestResource {
    private final DataAccessRequestService service = new DataAccessRequestService();
    private final DataAccessRequestDAO dao;

    public DataAccessRequestResource(Jdbi jdbi) {
        this.dao = jdbi.onDemand(DataAccessRequestDAO.class);
        // register mapper for queries (RowMapper implementation in jdbi3 package)
        jdbi.registerRowMapper(new org.openmetadata.service.jdbi3.DataAccessRequestMapper());
    }

    // Constructor used by CollectionRegistry when creating resources
    public DataAccessRequestResource(org.openmetadata.service.security.Authorizer authorizer, org.openmetadata.service.limits.Limits limits) {
        this(org.openmetadata.service.Entity.getJdbi());
    }

    @POST
    @Operation(
            operationId = "createDataAccessRequest",
            summary = "Create a data access request",
            description = "Create a request for access to a data asset.",
            responses = {
                    @ApiResponse(
                            responseCode = "201",
                            description = "The data access request",
                            content = @io.swagger.v3.oas.annotations.media.Content(
                                    mediaType = "application/json",
                                    schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DataAccessRequest.class)))
            })
    public Response create(
            @Context UriInfo uriInfo,
            @Context SecurityContext securityContext,
            @jakarta.validation.Valid CreateDataAccessRequest request) {
        // validate
        service.validateCreateRequest(request);

        String createdBy = SecurityUtil.getUserName(securityContext);
        if (createdBy == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        // Build ID and timestamp
        String id = UUID.randomUUID().toString();
        Timestamp now = service.nowUtcTimestamp();

        // Use mapper to convert create DTO -> entity (centralized conversion logic)
        DataAccessRequestMapper mapper = new DataAccessRequestMapper();
        DataAccessRequest entity = mapper.createToEntity(request, id, createdBy, now, service);

        // Persist using DAO (existing DAO signature)
        dao.insert(
                entity.getId(),
                entity.getDataAssetFQN(),
                entity.getPurposeHtml(),
                entity.getPurposeText(),
                entity.getNotesHtml(),
                entity.getNotesText(),
                entity.getStartDate() == null ? null : Date.valueOf(entity.getStartDate()),
                entity.getEndDate() == null ? null : Date.valueOf(entity.getEndDate()),
                entity.getPriority() == null ? null : entity.getPriority().name(),
                entity.getCreatedBy(),
                entity.getCreatedAt());

        DataAccessRequest saved = dao.getById(id);

        URI createdUri = uriInfo.getAbsolutePathBuilder().path(id).build();
        return Response.created(createdUri).entity(saved).build();
    }

    @GET
    @Operation(
            operationId = "listDataAccessRequests",
            summary = "List data access requests",
            description = "List data access requests with pagination and optional filters",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "List of data access requests",
                            content = @io.swagger.v3.oas.annotations.media.Content(
                                    mediaType = "application/json",
                                    schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DataAccessRequestList.class)))
            })
    public org.openmetadata.schema.utils.ResultList<DataAccessRequest> list(
            @Context UriInfo uriInfo,
            @Context SecurityContext securityContext,
            @QueryParam("limit") @DefaultValue("10") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset,
            @QueryParam("dataAssetFQN") String dataAssetFQN,
            @QueryParam("createdBy") String createdBy) {
        java.util.List<DataAccessRequest> list = dao.list(limit, offset, dataAssetFQN, createdBy);
        int total = dao.count(dataAssetFQN, createdBy);
        return new DataAccessRequestList(list, offset, limit, total);
    }

    @GET
    @Path("/{id}")
    @Operation(
            operationId = "getDataAccessRequestById",
            summary = "Get a data access request by id",
            description = "Get a data access request by `id`.",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "The data access request",
                            content = @io.swagger.v3.oas.annotations.media.Content(
                                    mediaType = "application/json",
                                    schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = DataAccessRequest.class))),
                    @ApiResponse(responseCode = "404", description = "DataAccessRequest for instance {id} is not found")
            })
    public DataAccessRequest get(
            @Context UriInfo uriInfo,
            @Context SecurityContext securityContext,
            @PathParam("id") String id) {
        DataAccessRequest request = dao.getById(id);
        if (request == null) {
            throw new jakarta.ws.rs.NotFoundException("DataAccessRequest for instance " + id + " is not found");
        }
        return request;
    }

    public static class DataAccessRequestList extends org.openmetadata.schema.utils.ResultList<DataAccessRequest> {
        public DataAccessRequestList() {
            super();
        }

        public DataAccessRequestList(java.util.List<DataAccessRequest> data, Integer offset, Integer limit, Integer total) {
            super(data, offset, limit, total);
        }

        /* required for serde */
    }
}


