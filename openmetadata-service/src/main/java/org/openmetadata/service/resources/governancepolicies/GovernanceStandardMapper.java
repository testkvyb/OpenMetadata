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

import org.openmetadata.schema.api.governancePolicy.CreateGovernanceStandard;
import org.openmetadata.schema.entity.governancePolicy.GovernanceStandard;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.service.Entity;
import org.openmetadata.service.mapper.EntityMapper;

public class GovernanceStandardMapper
    implements EntityMapper<GovernanceStandard, CreateGovernanceStandard> {
  @Override
  public GovernanceStandard createToEntity(CreateGovernanceStandard create, String user) {
    // Create entity reference for parent policy
    EntityReference parentRef =
        Entity.getEntityReferenceByName(Entity.GOVERNANCE_POLICY, create.getParent(), null);

    return copy(new GovernanceStandard(), create, user).withParent(parentRef);
  }
}
