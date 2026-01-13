/*
 *  Copyright 2022 Collate.
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

import { LoadingState } from 'Models';
import { GovernancePolicy, PolicyStatus, PolicyType } from '../../generated/entity/governancePolicy/governancePolicy';
import { GovernanceStandard } from '../../generated/entity/governancePolicy/governanceStandard';

export type DeleteGovernanceStandardDetailsType = {
  id: string;
  name: string;
  policyName?: string;
  isPolicy: boolean;
  status?: LoadingState;
};

export type DeleteGovernanceStandardsType = {
  data: DeleteGovernanceStandardDetailsType | undefined;
  state: boolean;
};

export interface SubmitProps {
  name: string;
  description: string;
  displayName?: string;
  // Governance Policy specific fields
  policyType?: PolicyType;
  status?: PolicyStatus;
  domain?: string;
  reviewDate?: number;
  rule?: string
}

export interface GovernancePolicyFormProps {
  visible: boolean;
  isEditing: boolean;
  isTier: boolean;
  onCancel: () => void;
  header: string;
  initialValues?: Partial<GovernancePolicy> | Partial<GovernanceStandard>;
  onSubmit: (value: SubmitProps) => Promise<void>;
  isGovernancePolicy?: boolean;
  data?: GovernancePolicy[];
  isLoading: boolean;
  isSystemGovernanceStandard?: boolean;
  permissions?: {
    createGovernanceStandards?: boolean;
    editDescription?: boolean;
    editDisplayName?: boolean;
    editAll?: boolean;
  };
}




