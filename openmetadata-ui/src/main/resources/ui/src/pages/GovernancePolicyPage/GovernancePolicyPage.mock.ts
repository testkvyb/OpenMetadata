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
export const MOCK_ALL_GOVERNANCE_POLICIES = {
  data: [
    {
      id: '5e77a82e-4bc8-46eb-af52-a383a505eea6',
      name: 'DataClassificationPolicy',
      fullyQualifiedName: 'DataClassificationPolicy',
      description:
        'In any organization, personal information needs to be adequately protected. Typically, your Privacy team sets up the Data Classification Policy, where they classify the data based on how sensitive or critical it is.',
      version: 0.2,
      updatedAt: 1672147362401,
      updatedBy: 'admin',
      href: 'http://localhost:8585/api/v1/classifications/5e77a82e-4bc8-46eb-af52-a383a505eea6',
      termCount: 3,
      changeDescription: {
        fieldsAdded: [],
        fieldsUpdated: [
          {
            name: 'description',
            oldValue: '',
            newValue:
              'In any organization, personal information needs to be adequately protected. Typically, your Privacy team sets up the Data Classification Policy, where they classify the data based on how sensitive or critical it is.',
          },
          {
            name: 'mutuallyExclusive',
            oldValue: true,
            newValue: false,
          },
        ],
        fieldsDeleted: [],
        previousVersion: 0.1,
      },
      deleted: false,
      provider: 'system',
      mutuallyExclusive: false,
    },
    {
      id: '5d626378-ca93-4ce2-ac20-52908961d26e',
      name: 'DataRetentionPolicy',
      fullyQualifiedName: 'DataRetentionPolicy',
      description:
        'Data Retention Policy defines how long data should be retained before it is deleted or archived.',
      version: 0.1,
      updatedAt: 1672135714322,
      updatedBy: 'admin',
      href: 'http://localhost:8585/api/v1/classifications/5d626378-ca93-4ce2-ac20-52908961d26e',
      deleted: false,
      provider: 'system',
      mutuallyExclusive: true,
      termCount: 2,
    },
    {
      id: '9005388e-5355-412c-8ba9-fc6dbe192a45',
      name: 'test-policy',
      fullyQualifiedName: 'test-policy',
      description: '',
      version: 0.1,
      updatedAt: 1672147038831,
      updatedBy: 'admin',
      href: 'http://localhost:8585/api/v1/classifications/9005388e-5355-412c-8ba9-fc6dbe192a45',
      deleted: false,
      provider: 'user',
      mutuallyExclusive: false,
      termCount: 4,
    },
  ],
  paging: {
    total: 3,
  },
};

export const MOCK_GOVERNANCE_STANDARDS = {
  data: [
    {
      id: 'ba6fd24a-8193-4ac8-879d-c9eb6be3cd1e',
      name: 'Public',
      fullyQualifiedName: 'DataClassificationPolicy.Public',
      description:
        'Public data: Least sensitive data. Can be freely shared without restrictions.',
      classification: {
        id: '5e77a82e-4bc8-46eb-af52-a383a505eea6',
        type: 'classification',
        name: 'DataClassificationPolicy',
        fullyQualifiedName: 'DataClassificationPolicy',
        description:
          'In any organization, personal information needs to be adequately protected. Typically, your Privacy team sets up the Data Classification Policy, where they classify the data based on how sensitive or critical it is.',
        deleted: false,
        href: 'http://localhost:8585/api/v1/classifications/5e77a82e-4bc8-46eb-af52-a383a505eea6',
      },
      version: 0.1,
      updatedAt: 1672135714301,
      updatedBy: 'admin',
      href: 'http://localhost:8585/api/v1/tags/ba6fd24a-8193-4ac8-879d-c9eb6be3cd1e',
      usageCount: 3,
      deprecated: false,
      deleted: false,
      provider: 'system',
      mutuallyExclusive: false,
    },
    {
      id: 'a7365365-9f36-4771-9e64-afc2463a2b09',
      name: 'Private',
      fullyQualifiedName: 'DataClassificationPolicy.Private',
      description:
        'Private data: Slightly more sensitive than public data. Requires appropriate access controls.',
      classification: {
        id: '5e77a82e-4bc8-46eb-af52-a383a505eea6',
        type: 'classification',
        name: 'DataClassificationPolicy',
        fullyQualifiedName: 'DataClassificationPolicy',
        description:
          'In any organization, personal information needs to be adequately protected. Typically, your Privacy team sets up the Data Classification Policy, where they classify the data based on how sensitive or critical it is.',
        deleted: false,
        href: 'http://localhost:8585/api/v1/classifications/5e77a82e-4bc8-46eb-af52-a383a505eea6',
      },
      version: 0.1,
      updatedAt: 1672135714312,
      updatedBy: 'admin',
      href: 'http://localhost:8585/api/v1/tags/a7365365-9f36-4771-9e64-afc2463a2b09',
      usageCount: 5,
      deprecated: false,
      deleted: false,
      provider: 'system',
      mutuallyExclusive: false,
    },
    {
      id: '43f1e354-eefa-4c63-94bc-c618badaf6ee',
      name: 'Restricted',
      fullyQualifiedName: 'DataClassificationPolicy.Restricted',
      description:
        'Restricted data: Most sensitive data and therefore needs the highest level of protection.',
      classification: {
        id: '7968b3a3-ee7c-4bf9-9bf1-ff8322c6b53f',
        type: 'classification',
        name: 'DataClassificationPolicy',
        fullyQualifiedName: 'DataClassificationPolicy',
        description:
          'In any organization, personal information needs to be adequately protected.',
        deleted: false,
        href: 'http://localhost:8585/api/v1/classifications/7968b3a3-ee7c-4bf9-9bf1-ff8322c6b53f',
      },
      version: 0.1,
      updatedAt: 1678959133696,
      updatedBy: 'admin',
      href: 'http://localhost:8585/api/v1/tags/43f1e354-eefa-4c63-94bc-c618badaf6ee',
      usageCount: 8,
      deprecated: false,
      deleted: false,
      provider: 'system',
      mutuallyExclusive: false,
    },
  ],
  paging: {
    after: 'RGF0YUNsYXNzaWZpY2F0aW9uUG9saWN5LlJlc3RyaWN0ZWQ=',
    total: 3,
  },
};

export const MOCK_GOVERNANCE_POLICY_CATEGORY = [
  {
    id: 'test',
    description: 'description',
    href: 'link',
    name: 'DataClassificationPolicy',
    usageCount: 3,
  },
  {
    id: 'test2',
    children: [],
    description: 'description',
    href: 'link',
    name: 'DataRetentionPolicy',
    usageCount: 2,
  },
];

export const MOCK_DELETE_GOVERNANCE_POLICY = {
  id: 'b08c092f-a3f1-4ca6-bcc2-b8123b042cb9',
  name: 'testPolicy145',
  fullyQualifiedName: 'testPolicy145',
  description: '',
  version: 0.2,
  updatedAt: 1672231948467,
  updatedBy: 'admin',
  changeDescription: {
    fieldsAdded: [],
    fieldsUpdated: [
      {
        name: 'deleted',
        oldValue: false,
        newValue: true,
      },
    ],
    fieldsDeleted: [],
    previousVersion: 0.1,
  },
  deleted: true,
  provider: 'user',
  mutuallyExclusive: false,
};

export const MOCK_DELETE_GOVERNANCE_STANDARD = {
  id: '5e77a82e-4bc8-46eb-af52-a383a505eea6',
  type: 'classification',
  name: 'DataClassificationPolicy',
  fullyQualifiedName: 'DataClassificationPolicy',
  description:
    'In any organization, personal information needs to be adequately protected. Typically, your Privacy team sets up the Data Classification Policy, where they classify the data based on how sensitive or critical it is.',
  deleted: false,
  href: 'http://localhost:8585/api/v1/classifications/5e77a82e-4bc8-46eb-af52-a383a505eea6',
};
