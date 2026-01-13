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

import { Badge, Button, Space, Typography } from 'antd';
import { AxiosError } from 'axios';
import classNames from 'classnames';
import { compare } from 'fast-json-patch';
import { isUndefined } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as PlusIcon } from '../../assets/svg/plus-primary.svg';
import ErrorPlaceHolder from '../../components/common/ErrorWithPlaceholder/ErrorPlaceHolder';
import LeftPanelCard from '../../components/common/LeftPanelCard/LeftPanelCard';
import Loader from '../../components/common/Loader/Loader';
import ResizableLeftPanels from '../../components/common/ResizablePanels/ResizableLeftPanels';
import TagsLeftPanelSkeleton from '../../components/common/Skeleton/Tags/TagsLeftPanelSkeleton.component';
import StandardDetails from '../../components/GovernancePolicy/StandardDetails/StandardDetails';
import { StandardDetailsRef } from '../../components/GovernancePolicy/StandardDetails/StandardDetails.interface';
import EntityDeleteModal from '../../components/Modals/EntityDeleteModal/EntityDeleteModal';
import { HTTP_STATUS_CODE } from '../../constants/Auth.constants';
import { TIER_CATEGORY } from '../../constants/constants';
import { usePermissionProvider } from '../../context/PermissionProvider/PermissionProvider';
import {
    OperationPermission,
    ResourceEntity
} from '../../context/PermissionProvider/PermissionProvider.interface';
import { TabSpecificField } from '../../enums/entity.enum';
import { CreateGovernancePolicy } from '../../generated/api/governancePolicy/createGovernancePolicy';
import { CreateGovernanceStandard } from '../../generated/api/governancePolicy/createGovernanceStandard';
import { GovernancePolicy } from '../../generated/entity/governancePolicy/governancePolicy';
import { GovernanceStandard } from '../../generated/entity/governancePolicy/governanceStandard';
import { Operation } from '../../generated/entity/policies/accessControl/rule';
import { withPageLayout } from '../../hoc/withPageLayout';
import { useFqn } from '../../hooks/useFqn';
import {
    createGovernancePolicy,
    createGovernanceStandard,
    deleteGovernanceStandard,
    getAllGovernancePolicies,
    getGovernancePolicyByName,
    patchGovernancePolicy,
    patchGovernanceStandard
} from '../../rest/governancePolicyAPI';
import { getCountBadge, getEntityDeleteMessage } from '../../utils/CommonUtils';
import { getEntityName } from '../../utils/EntityUtils';
import {
    checkPermission,
    DEFAULT_ENTITY_PERMISSION
} from '../../utils/PermissionsUtils';
import { getGovernancePolicyPath } from '../../utils/RouterUtils';
import { getErrorText } from '../../utils/StringsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import GovernancePolicyForm from './GovernancePolicyForm';
import { DeleteGovernanceStandardsType, SubmitProps } from './GovernancePolicyPage.interface';

interface GovernancePolicyPageProps {
  pageTitle?: string;
}

const GovernancePolicyPage = ({ pageTitle }: GovernancePolicyPageProps) => {
  const { getEntityPermission, permissions } = usePermissionProvider();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fqn: policyName } = useFqn();
  const [governancePolicies, setGovernancePolicies] = useState<Array<GovernancePolicy>>(
    []
  );
  const [currentGovernancePolicy, setCurrentGovernancePolicy] =
    useState<GovernancePolicy>();
  const [isAddingGovernancePolicy, setIsAddingGovernancePolicy] =
    useState<boolean>(false);
  const [isAddingGovernanceStandard, setIsAddingGovernanceStandard] = useState<boolean>(false);
  const [editGovernanceStandard, setEditGovernanceStandard] = useState<GovernanceStandard>();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const governancePolicyDetailsRef = useRef<StandardDetailsRef>(null);

  const [deleteGovernanceStandards, setDeleteGovernanceStandards] = useState<DeleteGovernanceStandardsType>({
    data: undefined,
    state: false,
  });
  const [governancePolicyPermissions, setGovernancePolicyPermissions] =
    useState<OperationPermission>(DEFAULT_ENTITY_PERMISSION);

  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);

  const createGovernancePolicyPermission = useMemo(
    () =>
      checkPermission(
        Operation.Create,
        ResourceEntity.GOVERNANCE_POLICY,
        permissions
      ),
    [permissions]
  );

  const isGovernancePolicyDisabled = useMemo(
    () => currentGovernancePolicy?.disabled ?? false,
    [currentGovernancePolicy?.disabled]
  );

  const isTier = useMemo(
    () => currentGovernancePolicy?.name === 'Tier',
    [currentGovernancePolicy]
  );

  const fetchCurrentGovernancePolicyPermission = async () => {
    if (!currentGovernancePolicy?.id) {
      return;
    }
    try {
      const response = await getEntityPermission(
        ResourceEntity.GOVERNANCE_POLICY,
        currentGovernancePolicy?.id
      );
      setGovernancePolicyPermissions(response);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const fetchGovernancePolicies = async (setCurrent?: boolean) => {
    setIsLoading(true);

    try {
      const response = await getAllGovernancePolicies({
        fields: [
          TabSpecificField.OWNERS,
          TabSpecificField.DOMAINS,
          TabSpecificField.REVIEWERS,
        ],
        limit: 1000,
      });
      setGovernancePolicies(response.data);
      if (setCurrent && response.data.length) {
        setCurrentGovernancePolicy(response.data[0]);

        navigate(getGovernancePolicyPath(response.data[0].fullyQualifiedName));
      }
    } catch (error) {
      const errMsg = getErrorText(
        error as AxiosError,
        t('server.entity-fetch-error', {
          entity: t('label.governance-policy-lowercase'),
        })
      );
      showErrorToast(errMsg);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentGovernancePolicy = async (fqn: string, update?: boolean) => {
    if (currentGovernancePolicy?.fullyQualifiedName !== fqn || update) {
      setIsLoading(true);
      try {
        const currentGovernancePolicy = await getGovernancePolicyByName(fqn, {
          fields: [
            TabSpecificField.OWNERS,
            TabSpecificField.DOMAINS,
            TabSpecificField.REVIEWERS,
          ],
        });
        setCurrentGovernancePolicy(currentGovernancePolicy);
      } catch (err) {
        showErrorToast(
          err as AxiosError,
          t('server.entity-fetch-error', {
            entity: t('label.governance-policy-lowercase'),
          })
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateGovernancePolicy = async (data: SubmitProps) => {
    setIsButtonLoading(true);
    try {
      // Validate required fields for GovernancePolicy
      if (!data.policyType) {
        showErrorToast(
          t('message.field-required', {
            field: t('label.policy-type'),
          })
        );
        return;
      }

      const createData: CreateGovernancePolicy = {
        name: data.name,
        description: data.description,
        displayName: data.displayName || '',
        policyType: data.policyType,
        status: data.status,
        reviewDate: data.reviewDate,
      };

      const res = await createGovernancePolicy(createData);
      await fetchGovernancePolicies();
      navigate(getGovernancePolicyPath(res.fullyQualifiedName));
    } catch (error) {
      if (
        (error as AxiosError).response?.status === HTTP_STATUS_CODE.CONFLICT
      ) {
        showErrorToast(
          t('server.entity-already-exists', {
            entity: t('label.governance-policy'),
            entityPlural: t('label.governance-policy-lowercase-plural'),
            name: data.name,
          })
        );
      } else {
        showErrorToast(
          error as AxiosError,
          t('server.create-entity-error', {
            entity: t('label.governance-policy-lowercase'),
          })
        );
      }
    } finally {
      setIsAddingGovernancePolicy(false);
      setIsButtonLoading(false);
    }
  };

  const handleCancel = useCallback(() => {
    setEditGovernanceStandard(undefined);
    setIsAddingGovernanceStandard(false);
    setIsAddingGovernancePolicy(false);
  }, []);

  const handleAfterDeleteAction = useCallback(() => {
    if (!isUndefined(currentGovernancePolicy)) {
      const remainingGovernancePolicies = [...governancePolicies].filter(
        (data) => data.id !== currentGovernancePolicy.id
      );
      const updatedCurrentGovernancePolicy = remainingGovernancePolicies[0];
      setGovernancePolicies(remainingGovernancePolicies);
      navigate(
        getGovernancePolicyPath(
          updatedCurrentGovernancePolicy?.fullyQualifiedName ??
            updatedCurrentGovernancePolicy?.name
        )
      );
    }
  }, [currentGovernancePolicy, governancePolicies, setGovernancePolicies]);

  /**
   * Deletes a governance standard by its ID
   * @param governanceStandardId - governance standard id to delete
   */
  const handleDeleteGovernanceStandard = async (governanceStandardId: string) => {
    try {
      const res = await deleteGovernanceStandard(governanceStandardId);

      if (res) {
        // Refresh the standards list in the details view
        governancePolicyDetailsRef.current?.refreshStandards();
        // Refresh governance policies to update counts
        await fetchGovernancePolicies();
      } else {
        showErrorToast(
          t('server.delete-entity-error', {
            entity: t('label.governance-standard-lowercase'),
          })
        );
      }
    } catch (err) {
      showErrorToast(
        err as AxiosError,
        t('server.delete-entity-error', {
          entity: t('label.governance-standard-lowercase'),
        })
      );
    } finally {
      setDeleteGovernanceStandards({ data: undefined, state: false });
    }
  };

  /**
   * Handles the confirmation click for deleting a governance standard
   */
  const handleConfirmClick = useCallback(async () => {
    if (deleteGovernanceStandards.data?.id) {
      await handleDeleteGovernanceStandard(deleteGovernanceStandards.data.id);
    }
  }, [deleteGovernanceStandards.data?.id, handleDeleteGovernanceStandard]);

  const handleUpdateGovernancePolicy = useCallback(
    async (updatedGovernancePolicy: GovernancePolicy) => {
      if (!isUndefined(currentGovernancePolicy)) {
        const patchData = compare(currentGovernancePolicy, updatedGovernancePolicy);
        try {
          const data = await patchGovernancePolicy(
            currentGovernancePolicy?.id,
            patchData
          );
          if (data) {
            setCurrentGovernancePolicy(data);
            setGovernancePolicies((prevGovernancePolicies) =>
              prevGovernancePolicies.map((policy) => {
                if (policy.id === data.id) {
                  return {
                    ...policy,
                    ...data,
                  };
                }

                return policy;
              })
            );
          }
        } catch (error) {
          if (
            (error as AxiosError).response?.status === HTTP_STATUS_CODE.CONFLICT
          ) {
            showErrorToast(
              t('server.entity-already-exists', {
                entity: t('label.governance-policy'),
                entityPlural: t('label.governance-policy-lowercase-plural'),
                name: updatedGovernancePolicy.name,
              })
            );
          } else {
            showErrorToast(
              error as AxiosError,
              t('server.entity-updating-error', {
                entity: t('label.governance-policy-lowercase'),
              })
            );
          }
        }
      }
    },
    [currentGovernancePolicy, history]
  );

  const handleCreatePrimaryGovernanceStandard = async (data: CreateGovernanceStandard) => {
    try {
      if (!currentGovernancePolicy?.fullyQualifiedName) {
        showErrorToast(
          t('server.unexpected-error', {
            entity: t('label.governance-standard-lowercase'),
          })
        );
        return;
      }

      await createGovernanceStandard({
        ...data,
        parent: currentGovernancePolicy.fullyQualifiedName,
      });

      // Refresh the standards list in the details view
      governancePolicyDetailsRef.current?.refreshStandards();
      // Refresh governance policies to update counts
      await fetchGovernancePolicies();
    } catch (error) {
      if (
        (error as AxiosError).response?.status === HTTP_STATUS_CODE.CONFLICT
      ) {
        showErrorToast(
          t('server.entity-already-exists', {
            entity: t('label.governance-standard'),
            entityPlural: t('label.governance-standard-lowercase-plural'),
            name: data.name,
          })
        );
      } else {
        showErrorToast(
          error as AxiosError,
          t('server.create-entity-error', {
            entity: t('label.governance-standard-lowercase'),
          })
        );
      }
    } finally {
      setIsAddingGovernanceStandard(false);
    }
  };

  const handleUpdatePrimaryGovernanceStandard = async (updatedData: GovernanceStandard) => {
    if (!isUndefined(editGovernanceStandard)) {
      setIsButtonLoading(true);
      const patchData = compare(editGovernanceStandard, updatedData);
      try {
        const response = await patchGovernanceStandard(editGovernanceStandard.id, patchData);
        if (response) {
          // Refresh the standards list in the details view
          governancePolicyDetailsRef.current?.refreshStandards();
          setEditGovernanceStandard(undefined);
          setIsAddingGovernanceStandard(false);
        }
      } catch (error) {
        if (
          (error as AxiosError).response?.status === HTTP_STATUS_CODE.CONFLICT
        ) {
          showErrorToast(
            t('server.entity-already-exists', {
              entity: t('label.governance-standard'),
              entityPlural: t('label.governance-standard-lowercase-plural'),
              name: updatedData.name,
            })
          );
        } else {
          showErrorToast(
            error as AxiosError,
            t('server.entity-updating-error', {
              entity: t('label.governance-standard-lowercase'),
            })
          );
        }
      } finally {
        setIsButtonLoading(false);
      }
    }
  };

  const handleActionDeleteGovernanceStandard = useCallback(
    (record: GovernanceStandard) => {
      if (currentGovernancePolicy) {
        setDeleteGovernanceStandards({
          data: {
            id: record.id as string,
            name: record.name,
            policyName: currentGovernancePolicy?.fullyQualifiedName,
            isPolicy: false,
            status: 'waiting',
          },
          state: true,
        });
      }
    },
    [currentGovernancePolicy]
  );

  const handleEditGovernanceStandardClick = useCallback((selectedGovernanceStandard: GovernanceStandard) => {
    setIsAddingGovernanceStandard(true);
    setEditGovernanceStandard(selectedGovernanceStandard);
  }, []);

  const handleAddNewGovernanceStandardClick = useCallback(() => {
    setIsAddingGovernanceStandard(true);
  }, []);

  useEffect(() => {
    if (currentGovernancePolicy) {
      fetchCurrentGovernancePolicyPermission();
    }
  }, [currentGovernancePolicy]);

  useEffect(() => {
    /**
     * If policy name is present then fetch that specific policy
     */
    if (policyName) {
      const isTier = policyName.startsWith(TIER_CATEGORY);
      fetchCurrentGovernancePolicy(isTier ? TIER_CATEGORY : policyName);
    }
  }, [policyName]);

  useEffect(() => {
    /**
     * Fetch all governance policies initially
     * Do not set current if we already have currentGovernancePolicy set
     */
    fetchGovernancePolicies(!policyName);
  }, []);

  const onClickGovernancePolicies = (policy: GovernancePolicy) => {
    setCurrentGovernancePolicy(policy);

    navigate(getGovernancePolicyPath(policy.fullyQualifiedName));
  };

  const handleAddGovernanceStandardSubmit = useCallback(
    async (data: SubmitProps) => {
      if (editGovernanceStandard) {
        await handleUpdatePrimaryGovernanceStandard({ ...editGovernanceStandard, ...data });
      } else {
        if (!currentGovernancePolicy?.fullyQualifiedName) {
          showErrorToast(
            t('server.unexpected-error', {
              entity: t('label.governance-standard-lowercase'),
            })
          );
          return;
        }

        const createData: CreateGovernanceStandard = {
          name: data.name,
          description: data.description,
          displayName: data.displayName,
          parent: currentGovernancePolicy.fullyQualifiedName,
        };
        await handleCreatePrimaryGovernanceStandard(createData);
      }
    },
    [editGovernanceStandard, handleUpdatePrimaryGovernanceStandard, handleCreatePrimaryGovernanceStandard, currentGovernancePolicy]
  );

  const handleCancelGovernancePolicyDelete = useCallback(() => {
    setDeleteGovernanceStandards({ data: undefined, state: false });
  }, []);

  const leftPanelLayout = useMemo(
    () => (
      <LeftPanelCard id="governance-policies">
        <TagsLeftPanelSkeleton loading={isLoading}>
          <div className="p-y-xs" data-testid="data-summary-container">
            <Space
              className="w-full p-x-sm m-b-sm"
              direction="vertical"
              size="middle">
              {createGovernancePolicyPermission && (
                <Button
                  block
                  className="text-primary"
                  data-testid="add-governance-policy"
                  icon={<PlusIcon className="align-middle" />}
                  onClick={() => setIsAddingGovernancePolicy(true)}>
                  <Typography.Text
                    className="p-l-xss"
                    ellipsis={{ tooltip: true }}>
                    {t('label.add-entity', {
                      entity: t('label.governance-policy'),
                    })}
                  </Typography.Text>
                </Button>
              )}
            </Space>

            {governancePolicies.map((policy: GovernancePolicy) => (
              <div
                className={classNames(
                  'align-center content-box cursor-pointer text-grey-body text-body d-flex p-y-xss p-x-sm m-y-xss',
                  {
                    activeCategory:
                      currentGovernancePolicy?.name === policy.name,
                  }
                )}
                data-testid="side-panel-governance-policy"
                key={policy.name}
                onClick={() => onClickGovernancePolicies(policy)}>
                <Typography.Paragraph
                  className="ant-typography-ellipsis-custom self-center m-b-0 tag-category"
                  data-testid="policy-name"
                  ellipsis={{ rows: 1, tooltip: true }}>
                  {getEntityName(policy)}
                  {policy.disabled && (
                    <Badge
                      className="m-l-xs badge-grey opacity-60"
                      count={t('label.disabled')}
                      data-testid="disabled"
                      size="small"
                    />
                  )}
                </Typography.Paragraph>

                {getCountBadge(
                  policy.standards?.length ?? 0,
                  'self-center m-l-auto',
                  currentGovernancePolicy?.fullyQualifiedName ===
                    policy.fullyQualifiedName
                )}
              </div>
            ))}
          </div>
        </TagsLeftPanelSkeleton>
      </LeftPanelCard>
    ),
    [
      isLoading,
      governancePolicies,
      currentGovernancePolicy,
      createGovernancePolicyPermission,
    ]
  );

  const createGovernanceStandardsPermission = useMemo(
    () =>
      checkPermission(Operation.Create, ResourceEntity.GOVERNANCE_STANDARD, permissions) ||
      governancePolicyPermissions.EditAll,
    [permissions, governancePolicyPermissions]
  );

  const editGovernanceStandardsDescriptionPermission = useMemo(
    () =>
      checkPermission(
        Operation.EditDescription,
        ResourceEntity.GOVERNANCE_STANDARD,
        permissions
      ) || governancePolicyPermissions.EditAll,
    [permissions, governancePolicyPermissions]
  );

  const editGovernanceStandardsDisplayNamePermission = useMemo(
    () =>
      checkPermission(
        Operation.EditDisplayName,
        ResourceEntity.GOVERNANCE_STANDARD,
        permissions
      ) || governancePolicyPermissions.EditAll,
    [permissions, governancePolicyPermissions]
  );

  const editGovernanceStandardsPermission = useMemo(
    () =>
      checkPermission(Operation.EditAll, ResourceEntity.GOVERNANCE_STANDARD, permissions) ||
      governancePolicyPermissions.EditAll,
    [permissions, governancePolicyPermissions]
  );

  const governanceStandardsFormPermissions = useMemo(
    () => ({
      createGovernanceStandards: createGovernanceStandardsPermission,
      editAll: editGovernanceStandardsPermission,
      editDescription: editGovernanceStandardsDescriptionPermission,
      editDisplayName: editGovernanceStandardsDisplayNamePermission,
    }),
    [
      createGovernanceStandardsPermission,
      editGovernanceStandardsPermission,
      editGovernanceStandardsDescriptionPermission,
      editGovernanceStandardsDisplayNamePermission,
    ]
  );

  const disableEditButton = useMemo(
    () =>
      !(
        editGovernanceStandardsDescriptionPermission ||
        editGovernanceStandardsDisplayNamePermission ||
        editGovernanceStandardsPermission
      ) || isGovernancePolicyDisabled,
    [
      editGovernanceStandardsDescriptionPermission,
      editGovernanceStandardsDisplayNamePermission,
      editGovernanceStandardsPermission,
      isGovernancePolicyDisabled,
    ]
  );

  const governanceStandardsFormHeader = useMemo(
    () =>
      editGovernanceStandard
        ? t('label.edit-entity', {
            entity: t('label.governance-standard'),
          })
        : t('label.adding-new-governance-standard', {
            categoryName: getEntityName(currentGovernancePolicy),
          }),
    [editGovernanceStandard, currentGovernancePolicy]
  );

  if (isLoading) {
    return <Loader />;
  }
  if (error) {
    return (
      <ErrorPlaceHolder>
        <Typography.Paragraph>{error}</Typography.Paragraph>
      </ErrorPlaceHolder>
    );
  }

  return (
    <div>
      <ResizableLeftPanels
        className="content-height-with-resizable-panel"
        firstPanel={{
          className: 'content-resizable-panel-container',
          minWidth: 280,
          flex: 0.13,
          children: leftPanelLayout,
          title: t('label.governance-policy-plural'),
        }}
        pageTitle={t('label.governance-policy-plural')}
        secondPanel={{
          children: (
            <>
              <StandardDetails
                policyPermissions={governancePolicyPermissions}
                currentPolicy={currentGovernancePolicy}
                deleteStandards={deleteGovernanceStandards}
                disableEditButton={disableEditButton}
                handleActionDeleteStandard={handleActionDeleteGovernanceStandard}
                handleAddNewStandardClick={handleAddNewGovernanceStandardClick}
                handleAfterDeleteAction={handleAfterDeleteAction}
                handleEditStandardClick={handleEditGovernanceStandardClick}
                handleUpdatePolicy={handleUpdateGovernancePolicy}
                isAddingStandard={isAddingGovernanceStandard}
                ref={governancePolicyDetailsRef}
              />

              {isAddingGovernancePolicy && (
                <GovernancePolicyForm
                  isGovernancePolicy
                  data={governancePolicies}
                  header={t('label.adding-new-governance-policy')}
                  isEditing={false}
                  isLoading={isButtonLoading}
                  isTier={isTier}
                  visible={isAddingGovernancePolicy}
                  onCancel={handleCancel}
                  onSubmit={handleCreateGovernancePolicy}
                />
              )}

              {isAddingGovernanceStandard && (
                <GovernancePolicyForm
                  header={governanceStandardsFormHeader}
                  initialValues={editGovernanceStandard}
                  isEditing={!isUndefined(editGovernanceStandard)}
                  isLoading={isButtonLoading}
                  isSystemGovernanceStandard={editGovernanceStandard?.provider === 'system'}
                  isTier={isTier}
                  permissions={governanceStandardsFormPermissions}
                  visible={isAddingGovernanceStandard}
                  onCancel={handleCancel}
                  onSubmit={handleAddGovernanceStandardSubmit}
                />
              )}

              <EntityDeleteModal
                bodyText={getEntityDeleteMessage(
                  deleteGovernanceStandards.data?.name ?? '',
                  ''
                )}
                entityName={deleteGovernanceStandards.data?.name ?? ''}
                entityType={t('label.governance-standard')}
                visible={deleteGovernanceStandards.state}
                onCancel={handleCancelGovernancePolicyDelete}
                onConfirm={handleConfirmClick}
              />
            </>
          ),
          className: 'content-resizable-panel-container',
          minWidth: 800,
          flex: 0.87,
        }}
      />
    </div>
  );
};

export default withPageLayout(GovernancePolicyPage);
