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

package org.openmetadata.service.jdbi3;

import static org.openmetadata.service.util.EntityUtil.entityReferenceMatch;

import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.entity.governancePolicy.GovernancePolicy;
import org.openmetadata.schema.entity.governancePolicy.GovernanceStandard;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.Relationship;
import org.openmetadata.service.Entity;
import org.openmetadata.service.exception.CatalogExceptionMessage;
import org.openmetadata.service.resources.governancepolicies.GovernanceStandardResource;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.EntityUtil.Fields;
import org.openmetadata.service.util.FullyQualifiedName;

@Slf4j
public class GovernanceStandardRepository extends EntityRepository<GovernanceStandard> {
  private static final String PARENT_FIELD = "parent";

  public GovernanceStandardRepository() {
    super(
        GovernanceStandardResource.COLLECTION_PATH,
        Entity.GOVERNANCE_STANDARD,
        GovernanceStandard.class,
        Entity.getCollectionDAO().governanceStandardDAO(),
        PARENT_FIELD,
        "");
    quoteFqn = true;
    supportsSearch = true;
    renameAllowed = false;
  }

  @Override
  public void setFields(GovernanceStandard entity, Fields fields) {
    entity.withOwners(fields.contains("owners") ? getOwners(entity) : null);
    entity.withParent(fields.contains(PARENT_FIELD) ? getParent(entity) : null);
  }

  @Override
  public void clearFields(GovernanceStandard entity, Fields fields) {
    entity.withOwners(fields.contains("owners") ? entity.getOwners() : null);
    entity.withParent(fields.contains(PARENT_FIELD) ? entity.getParent() : null);
  }

  @Override
  public void setInheritedFields(GovernanceStandard entity, Fields fields) {
    /* No inherited fields */
  }

  @Override
  public void prepare(GovernanceStandard entity, boolean update) {
    // Validate parent policy exists
    GovernancePolicy parent = getParentPolicy(entity);
    entity.setParent(parent.getEntityReference());
    
    // Build FQN: PolicyName.StandardName
    entity.setFullyQualifiedName(
        FullyQualifiedName.add(parent.getFullyQualifiedName(), entity.getName()));
  }

  @Override
  public void storeEntity(GovernanceStandard entity, boolean update) {
    // Store the entity in governance_standard table
    EntityReference parent = entity.getParent();
    entity.withParent(null); // Don't store parent in JSON to avoid circular reference
    store(entity, update);
    entity.withParent(parent); // Restore for further processing
  }

  @Override
  public void storeRelationships(GovernanceStandard entity) {
    // Store owner relationship
    storeOwners(entity, entity.getOwners());
    
    // Store parent relationship: Policy CONTAINS Standard
    storeRelationship(
        entity.getParent().getId(),
        entity.getId(),
        Entity.GOVERNANCE_POLICY,
        Entity.GOVERNANCE_STANDARD,
        Relationship.CONTAINS);
  }

  @Override
  public EntityUpdater getUpdater(
      GovernanceStandard original, GovernanceStandard updated, Operation operation) {
    return new GovernanceStandardUpdater(original, updated, operation);
  }

  /**
   * Retrieve the parent governance policy reference for this standard.
   */
  private EntityReference getParent(GovernanceStandard standard) {
    return getFromEntityRef(standard.getId(), Relationship.CONTAINS, Entity.GOVERNANCE_POLICY, true);
  }

  /**
   * Get and validate the parent governance policy.
   */
  private GovernancePolicy getParentPolicy(GovernanceStandard standard) {
    EntityReference parentRef = standard.getParent();
    if (parentRef == null) {
      throw new IllegalArgumentException(
          CatalogExceptionMessage.missingRequiredField("parent", Entity.GOVERNANCE_STANDARD));
    }

    GovernancePolicyRepository policyRepository =
        (GovernancePolicyRepository) Entity.getEntityRepository(Entity.GOVERNANCE_POLICY);
    
    GovernancePolicy policy =
        policyRepository.get(null, parentRef.getId(), policyRepository.getFields("id,name"));
    
    if (policy == null) {
      throw new IllegalArgumentException(
          String.format(
              "Parent governance policy with id %s not found for standard %s",
              parentRef.getId(), standard.getName()));
    }
    
    return policy;
  }

  public class GovernanceStandardUpdater extends EntityUpdater {
    public GovernanceStandardUpdater(
        GovernanceStandard original, GovernanceStandard updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() {
      // Prevent changing parent
      if (!entityReferenceMatch.test(original.getParent(), updated.getParent())) {
        throw new IllegalArgumentException(
            CatalogExceptionMessage.readOnlyAttribute(
                Entity.GOVERNANCE_STANDARD, PARENT_FIELD));
      }
    }
  }

  @Override
  public void entityRelationshipReindex(GovernanceStandard original, GovernanceStandard updated) {
    super.entityRelationshipReindex(original, updated);
    
    // If FQN changed (parent renamed), update FQN
    if (!Objects.equals(original.getFullyQualifiedName(), updated.getFullyQualifiedName())) {
      searchRepository
          .getSearchClient()
          .updateEntity(updated.getId().toString(), "fullyQualifiedName", updated.getFullyQualifiedName());
    }
  }
}
