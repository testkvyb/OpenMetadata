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

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.entity.governancePolicy.GovernancePolicy;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Relationship;
import org.openmetadata.service.Entity;
import org.openmetadata.service.resources.governancepolicies.GovernancePolicyResource;
import org.openmetadata.service.util.EntityUtil.Fields;

@Slf4j
public class GovernancePolicyRepository extends EntityRepository<GovernancePolicy> {

  public GovernancePolicyRepository() {
    super(
        GovernancePolicyResource.COLLECTION_PATH,
        Entity.GOVERNANCE_POLICY,
        GovernancePolicy.class,
        Entity.getCollectionDAO().governancePolicyDAO(),
        "",
        "");
    quoteFqn = true;
    supportsSearch = true;
    renameAllowed = false;
  }

  @Override
  public void setFields(GovernancePolicy entity, Fields fields) {
    // Set owners (plural) and reviewer fields
    entity.withOwners(fields.contains("owners") ? getOwners(entity) : null)
        .withReviewers(fields.contains("reviewers") ? getReviewers(entity) : null)
        .withDomains(fields.contains("domains") ? getDomains(entity) : null);

    // LAZY LOADING: Only populate standards when explicitly requested
    if (fields.contains("standards")) {
      entity.withStandards(getStandards(entity));
    }
  }

  @Override
  public void clearFields(GovernancePolicy entity, Fields fields) {
    entity.withOwners(fields.contains("owners") ? entity.getOwners() : null)
        .withReviewers(fields.contains("reviewers") ? entity.getReviewers() : null)
        .withDomains(fields.contains("domains") ? entity.getDomains() : null)
        .withStandards(fields.contains("standards") ? entity.getStandards() : null);
  }

  @Override
  public void setInheritedFields(GovernancePolicy entity, Fields fields) {
    /* No inherited fields */
  }

  @Override
  public void prepare(GovernancePolicy entity, boolean update) {
    /* Nothing to prepare */
  }

  @Override
  public void storeEntity(GovernancePolicy entity, boolean update) {
    store(entity, update);
  }

  @Override
  public void storeRelationships(GovernancePolicy entity) {
    // Store owners relationship (plural)
    storeOwners(entity, entity.getOwners());
    // Store reviewer relationship  
    storeReviewers(entity, entity.getReviewers());
    // Store domain relationships
    storeDomains(entity, entity.getDomains());
  }

  /**
   * Retrieve all standards that belong to this governance policy.
   * Standards are linked via CONTAINS relationship in entity_relationship table.
   */
  private List<EntityReference> getStandards(GovernancePolicy policy) {
    return findTo(
        policy.getId(),
        Entity.GOVERNANCE_POLICY,
        Relationship.CONTAINS,
        Entity.GOVERNANCE_STANDARD);
  }

  @Override
  public void entityRelationshipReindex(GovernancePolicy original, GovernancePolicy updated) {
    super.entityRelationshipReindex(original, updated);
    // Reindex standards if name or FQN changes
    if (!original.getFullyQualifiedName().equals(updated.getFullyQualifiedName())) {
      searchRepository
          .getSearchClient()
          .reindexAcrossIndices("parent.fullyQualifiedName", original.getEntityReference());
    }
  }
}

