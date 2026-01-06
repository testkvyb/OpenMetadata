/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.openmetadata.service.resources.governancepolicies;

import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.json.JsonPatch;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.UriInfo;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.api.data.RestoreEntity;
import org.openmetadata.schema.api.governancePolicy.CreateGovernancePolicy;
import org.openmetadata.schema.entity.governancePolicy.GovernancePolicy;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.MetadataOperation;
import org.openmetadata.schema.utils.ResultList;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.GovernancePolicyRepository;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.limits.Limits;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.security.Authorizer;

@Slf4j
@Path("/v1/governancePolicies")
@Tag(
    name = "Governance Policies",
    description =
        "These APIs are related to `Governance Policy` entities. A `Governance Policy` "
            + "contains rules and standards for data governance, including security, quality, "
            + "retention, and privacy policies.")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "governancePolicies", order = 5)
public class GovernancePolicyResource
    extends EntityResource<GovernancePolicy, GovernancePolicyRepository> {
  private final GovernancePolicyMapper mapper = new GovernancePolicyMapper();
  public static final String COLLECTION_PATH = "/v1/governancePolicies/";
  static final String FIELDS = "owners,reviewers,domain,standards";

  static class GovernancePolicyList extends ResultList<GovernancePolicy> {
    /* Required for serde */
  }

  public GovernancePolicyResource(Authorizer authorizer, Limits limits) {
    super(Entity.GOVERNANCE_POLICY, authorizer, limits);
  }

  @Override
  protected List<MetadataOperation> getEntitySpecificOperations() {
    addViewOperation("reviewers,domain,standards", MetadataOperation.VIEW_BASIC);
    return null;
  }

  @GET
  @Operation(
      operationId = "listGovernancePolicies",
      summary = "List governance policies",
      description = "Get a list of governance policies.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of governance policies",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = GovernancePolicyList.class)))
      })
  public ResultList<GovernancePolicy> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description =
                  "Limit the number of governance policies returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @Min(value = 0, message = "must be greater than or equal to 0")
          @Max(value = 1000000, message = "must be less than or equal to 1000000")
          @QueryParam("limit")
          int limitParam,
      @Parameter(
              description = "Returns list of governance policies before this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(
              description = "Returns list of governance policies after this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include) {
    ListFilter filter = new ListFilter(include);
    return super.listInternal(
        uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getGovernancePolicyByID",
      summary = "Get a governance policy by id",
      description = "Get a governance policy by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The governance policy",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = GovernancePolicy.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Governance policy for instance {id} is not found")
      })
  public GovernancePolicy get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the governance policy", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include) {
    return getInternal(uriInfo, securityContext, id, fieldsParam, include);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getGovernancePolicyByName",
      summary = "Get a governance policy by name",
      description = "Get a governance policy by its fully qualified name.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The governance policy",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = GovernancePolicy.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Governance policy for instance {name} is not found")
      })
  public GovernancePolicy getByName(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Name of the governance policy",
              schema = @Schema(type = "string"))
          @PathParam("name")
          String name,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include) {
    return getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllGovernancePolicyVersions",
      summary = "List governance policy versions",
      description = "Get a list of all versions of a governance policy identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of governance policy versions",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Id of the governance policy",
              schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id) {
    return super.listVersionsInternal(securityContext, id);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificGovernancePolicyVersion",
      summary = "Get a version of the governance policy",
      description = "Get a version of the governance policy by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The governance policy",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = GovernancePolicy.class))),
        @ApiResponse(
            responseCode = "404",
            description =
                "Governance policy for instance {id} and version {version} is not found")
      })
  public GovernancePolicy getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Id of the governance policy",
              schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @Parameter(
              description = "Governance policy version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version) {
    return super.getVersionInternal(securityContext, id, version);
  }

  @POST
  @Operation(
      operationId = "createGovernancePolicy",
      summary = "Create a governance policy",
      description = "Create a new governance policy.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The governance policy",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = GovernancePolicy.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateGovernancePolicy create) {
    GovernancePolicy governancePolicy =
        mapper.createToEntity(create, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, governancePolicy);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateGovernancePolicy",
      summary = "Update a governance policy",
      description = "Update an existing governance policy or create a new one")
  public Response createOrUpdate(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateGovernancePolicy create) {
    GovernancePolicy governancePolicy =
        mapper.createToEntity(create, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, governancePolicy);
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchGovernancePolicy",
      summary = "Update a governance policy",
      description = "Update an existing governance policy using JsonPatch.",
      externalDocs =
          @ExternalDocumentation(
              description = "JsonPatch RFC",
              url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Id of the governance policy",
              schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[{op:remove, path:/a},{op:add, path: /b, value: val}]")
                      }))
          JsonPatch patch) {
    return patchInternal(uriInfo, securityContext, id, patch);
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteGovernancePolicy",
      summary = "Delete a governance policy by id",
      description = "Delete a governance policy by `id`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(
            responseCode = "404",
            description = "Governance policy for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(
              description = "Id of the governance policy",
              schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id) {
    return delete(uriInfo, securityContext, id, false, hardDelete);
  }

  @DELETE
  @Path("/name/{name}")
  @Operation(
      operationId = "deleteGovernancePolicyByName",
      summary = "Delete a governance policy by name",
      description = "Delete a governance policy by `name`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(
            responseCode = "404",
            description = "Governance policy for instance {name} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(
              description = "Name of the governance policy",
              schema = @Schema(type = "string"))
          @PathParam("name")
          String name) {
    return deleteByName(uriInfo, securityContext, name, false, hardDelete);
  }

  @PUT
  @Path("/restore")
  @Operation(
      operationId = "restore",
      summary = "Restore a soft deleted governance policy",
      description = "Restore a soft deleted governance policy.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully restored the Governance Policy",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = GovernancePolicy.class)))
      })
  public Response restoreGovernancePolicy(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid RestoreEntity restore) {
    return restoreEntity(uriInfo, securityContext, restore.getId());
  }
}
