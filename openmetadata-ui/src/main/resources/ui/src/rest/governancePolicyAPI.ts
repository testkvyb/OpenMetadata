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

import { AxiosResponse } from 'axios';
import { Operation } from 'fast-json-patch';
import { PagingResponse } from 'Models';
import { PAGE_SIZE } from '../constants/constants';
import { CreateGovernancePolicy } from '../generated/api/governancePolicy/createGovernancePolicy';
import { CreateGovernanceStandard } from '../generated/api/governancePolicy/createGovernanceStandard';
import { GovernancePolicy } from '../generated/entity/governancePolicy/governancePolicy';
import { GovernanceStandard } from '../generated/entity/governancePolicy/governanceStandard';
import { EntityHistory } from '../generated/type/entityHistory';
import { ListParams } from '../interface/API.interface';
import { getEncodedFqn } from '../utils/StringsUtils';
import APIClient from './index';

const BASE_POLICY_URL = '/governancePolicies';
const BASE_STANDARD_URL = '/governanceStandards';

interface GovernancePolicyRequestParams extends ListParams {
  fields?: string | string[];
  after?: string;
  before?: string;
  limit?: number;
}

interface GovernanceStandardRequestParams extends ListParams {
  fields?: string | string[];
  parent?: string;
  after?: string;
  before?: string;
  limit?: number;
}

// ============ GOVERNANCE POLICY APIs ============

export const getAllGovernancePolicies = async (
  params?: GovernancePolicyRequestParams
) => {
  const response = await APIClient.get<PagingResponse<GovernancePolicy[]>>(
    BASE_POLICY_URL,
    {
      params: {
        ...params,
        limit: params?.limit ?? PAGE_SIZE,
      },
    }
  );

  return response.data;
};

export const getGovernancePolicyByName = async (
  name: string,
  params?: GovernancePolicyRequestParams
) => {
  const response = await APIClient.get<GovernancePolicy>(
    `${BASE_POLICY_URL}/name/${getEncodedFqn(name)}`,
    {
      params,
    }
  );

  return response.data;
};

export const getGovernancePolicyById = async (
  id: string,
  params?: GovernancePolicyRequestParams
) => {
  const response = await APIClient.get<GovernancePolicy>(
    `${BASE_POLICY_URL}/${id}`,
    {
      params,
    }
  );

  return response.data;
};

export const createGovernancePolicy = async (data: CreateGovernancePolicy) => {
  const response = await APIClient.post<
    CreateGovernancePolicy,
    AxiosResponse<GovernancePolicy>
  >(BASE_POLICY_URL, data);

  return response.data;
};

export const patchGovernancePolicy = async (
  id: string,
  patch: Operation[]
) => {
  const response = await APIClient.patch<Operation[], AxiosResponse<GovernancePolicy>>(
    `${BASE_POLICY_URL}/${id}`,
    patch
  );

  return response.data;
};

export const deleteGovernancePolicy = async (id: string, hardDelete = false) => {
  const response = await APIClient.delete<GovernancePolicy>(
    `${BASE_POLICY_URL}/${id}`,
    {
      params: {
        hardDelete,
      },
    }
  );

  return response.data;
};

export const restoreGovernancePolicy = async (id: string) => {
  const response = await APIClient.put<{ id: string }, AxiosResponse<GovernancePolicy>>(
    `${BASE_POLICY_URL}/restore`,
    { id }
  );

  return response.data;
};

export const getGovernancePolicyVersions = async (id: string) => {
  const url = `${BASE_POLICY_URL}/${id}/versions`;

  const response = await APIClient.get<EntityHistory>(url);

  return response.data;
};

export const getGovernancePolicyVersion = async (
  id: string,
  version: string
) => {
  const url = `${BASE_POLICY_URL}/${id}/versions/${version}`;

  const response = await APIClient.get<GovernancePolicy>(url);

  return response.data;
};

// ============ GOVERNANCE STANDARD APIs ============

export const getAllGovernanceStandards = async (
  params?: GovernanceStandardRequestParams
) => {
  const response = await APIClient.get<PagingResponse<GovernanceStandard[]>>(
    BASE_STANDARD_URL,
    {
      params: {
        ...params,
        limit: params?.limit ?? PAGE_SIZE,
      },
    }
  );

  return response.data;
};

export const getGovernanceStandardByName = async (
  fqn: string,
  params?: GovernanceStandardRequestParams
) => {
  const response = await APIClient.get<GovernanceStandard>(
    `${BASE_STANDARD_URL}/name/${getEncodedFqn(fqn)}`,
    {
      params,
    }
  );

  return response.data;
};

export const getGovernanceStandardById = async (
  id: string,
  params?: GovernanceStandardRequestParams
) => {
  const response = await APIClient.get<GovernanceStandard>(
    `${BASE_STANDARD_URL}/${id}`,
    {
      params,
    }
  );

  return response.data;
};

export const createGovernanceStandard = async (
  data: CreateGovernanceStandard
) => {
  const response = await APIClient.post<
    CreateGovernanceStandard,
    AxiosResponse<GovernanceStandard>
  >(BASE_STANDARD_URL, data);

  return response.data;
};

export const patchGovernanceStandard = async (
  id: string,
  patch: Operation[]
) => {
  const response = await APIClient.patch<Operation[], AxiosResponse<GovernanceStandard>>(
    `${BASE_STANDARD_URL}/${id}`,
    patch
  );

  return response.data;
};

export const deleteGovernanceStandard = async (
  id: string,
  hardDelete = false
) => {
  const response = await APIClient.delete<GovernanceStandard>(
    `${BASE_STANDARD_URL}/${id}`,
    {
      params: {
        hardDelete,
      },
    }
  );

  return response.data;
};

export const restoreGovernanceStandard = async (id: string) => {
  const response = await APIClient.put<
    { id: string },
    AxiosResponse<GovernanceStandard>
  >(`${BASE_STANDARD_URL}/restore`, { id });

  return response.data;
};

export const getGovernanceStandardVersions = async (id: string) => {
  const url = `${BASE_STANDARD_URL}/${id}/versions`;

  const response = await APIClient.get<EntityHistory>(url);

  return response.data;
};

export const getGovernanceStandardVersion = async (
  id: string,
  version: string
) => {
  const url = `${BASE_STANDARD_URL}/${id}/versions/${version}`;

  const response = await APIClient.get<GovernanceStandard>(url);

  return response.data;
};
