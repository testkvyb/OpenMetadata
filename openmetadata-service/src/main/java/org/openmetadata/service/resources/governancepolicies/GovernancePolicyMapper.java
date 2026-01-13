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

import org.openmetadata.schema.api.governancePolicy.CreateGovernancePolicy;
import org.openmetadata.schema.entity.governancePolicy.GovernancePolicy;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.service.Entity;
import org.openmetadata.service.mapper.EntityMapper;
import org.openmetadata.service.util.EntityUtil;

public class GovernancePolicyMapper
        implements EntityMapper<GovernancePolicy, CreateGovernancePolicy> {
    @Override
    public GovernancePolicy createToEntity(CreateGovernancePolicy create, String user) {
        return copy(new GovernancePolicy(), create, user)
                .withFullyQualifiedName(create.getName())
                .withPolicyType(create.getPolicyType())
                .withStatus(create.getStatus())
                .withDomains(EntityUtil.getEntityReferences(Entity.DOMAIN, create.getDomains()))
                .withReviewDate(create.getReviewDate())
                .withMutuallyExclusive(create.getMutuallyExclusive());
    }
}
