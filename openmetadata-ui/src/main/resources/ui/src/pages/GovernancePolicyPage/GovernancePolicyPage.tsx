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
import { isUndefined, omit } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as PlusIcon } from '../../assets/svg/plus-primary.svg';
import ClassificationDetails from '../../components/Classifications/ClassificationDetails/ClassificationDetails';
import { ClassificationDetailsRef } from '../../components/Classifications/ClassificationDetails/ClassificationDetails.interface';
import ErrorPlaceHolder from '../../components/common/ErrorWithPlaceholder/ErrorPlaceHolder';
import LeftPanelCard from '../../components/common/LeftPanelCard/LeftPanelCard';
import Loader from '../../components/common/Loader/Loader';
import ResizableLeftPanels from '../../components/common/ResizablePanels/ResizableLeftPanels';
import TagsLeftPanelSkeleton from '../../components/common/Skeleton/Tags/TagsLeftPanelSkeleton.component';
import EntityDeleteModal from '../../components/Modals/EntityDeleteModal/EntityDeleteModal';
import { HTTP_STATUS_CODE } from '../../constants/Auth.constants';
import { TIER_CATEGORY } from '../../constants/constants';
import { usePermissionProvider } from '../../context/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from '../../context/PermissionProvider/PermissionProvider.interface';
import { TabSpecificField } from '../../enums/entity.enum';
import { CreateClassification } from '../../generated/api/classification/createClassification';
import {
  CreateTag,
  ProviderType,
} from '../../generated/api/classification/createTag';
import { Classification } from '../../generated/entity/classification/classification';
import { Tag } from '../../generated/entity/classification/tag';
import { Operation } from '../../generated/entity/policies/accessControl/rule';
import { withPageLayout } from '../../hoc/withPageLayout';
import { useFqn } from '../../hooks/useFqn';
import {
  createClassification,
  createTag,
  deleteTag,
  getAllClassifications,
  getClassificationByName,
  patchClassification,
  patchTag,
} from '../../rest/tagAPI';
import { getCountBadge, getEntityDeleteMessage } from '../../utils/CommonUtils';
import { getEntityName } from '../../utils/EntityUtils';
import {
  checkPermission,
  DEFAULT_ENTITY_PERMISSION,
} from '../../utils/PermissionsUtils';
import { getGovernancePolicyPath } from '../../utils/RouterUtils';
import { getErrorText } from '../../utils/StringsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import GovernancePolicyForm from './GovernancePolicyForm';
import { DeleteGovernanceStandardsType, SubmitProps } from './GovernancePolicyPage.interface';
import { DeleteTagsType } from '../TagsPage/TagsPage.interface';

interface GovernancePolicyPageProps {
  pageTitle?: string;
}

const GovernancePolicyPage = ({ pageTitle }: GovernancePolicyPageProps) => {
  const { getEntityPermission, permissions } = usePermissionProvider();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fqn: policyName } = useFqn();
  const [governancePolicies, setGovernancePolicies] = useState<Array<Classification>>(
    []
  );
  const [currentGovernancePolicy, setCurrentGovernancePolicy] =
    useState<Classification>();
  const [isAddingGovernancePolicy, setIsAddingGovernancePolicy] =
    useState<boolean>(false);
  const [isAddingGovernanceStandard, setIsAddingGovernanceStandard] = useState<boolean>(false);
  const [editGovernanceStandard, setEditGovernanceStandard] = useState<Tag>();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const governancePolicyDetailsRef = useRef<ClassificationDetailsRef>(null);

  const [deleteGovernanceStandards, setDeleteGovernanceStandards] = useState<DeleteTagsType>({
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
        ResourceEntity.CLASSIFICATION,
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
        ResourceEntity.CLASSIFICATION,
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
      const response = await getAllClassifications({
        fields: [
          TabSpecificField.TERM_COUNT,
          TabSpecificField.OWNERS,
          TabSpecificField.DOMAINS,
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
        const currentGovernancePolicy = await getClassificationByName(fqn, {
          fields: [
            TabSpecificField.OWNERS,
            TabSpecificField.USAGE_COUNT,
            TabSpecificField.TERM_COUNT,
            TabSpecificField.DOMAINS,
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

  const handleCreateGovernancePolicy = async (data: CreateClassification) => {
    setIsButtonLoading(true);
    try {
      const res = await createClassification(data);
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
   * Takes policy name and governance standard id and delete the governance standard
   * @param policyName - governance policy name
   * @param governanceStandardId -  governance standard id
   */
  const handleDeleteGovernanceStandard = async (governanceStandardId: string) => {
    try {
      const res = await deleteTag(governanceStandardId);

      if (res) {
        setGovernancePolicies((prevGovernancePolicies) =>
          prevGovernancePolicies.map((policy) => {
            if (policy.id === currentGovernancePolicy?.id) {
              return {
                ...policy,
                termCount: (policy.termCount ?? 1) - 1,
              };
            }

            return policy;
          })
        );
        governancePolicyDetailsRef.current?.refreshClassificationTags();
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
   * It redirects to respective function call based on governance standard/GovernancePolicy
   */
  const handleConfirmClick = useCallback(async () => {
    if (deleteGovernanceStandards.data?.id) {
      await handleDeleteGovernanceStandard(deleteGovernanceStandards.data.id);
    }
  }, [deleteGovernanceStandards.data?.id, handleDeleteGovernanceStandard]);

  const handleUpdateGovernancePolicy = useCallback(
    async (updatedGovernancePolicy: Classification) => {
      if (!isUndefined(currentGovernancePolicy)) {
        const patchData = compare(currentGovernancePolicy, updatedGovernancePolicy);
        try {
          const data = await patchClassification(
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

  const handleCreatePrimaryGovernanceStandard = async (data: CreateTag) => {
    try {
      await createTag({
        ...data,
        classification: currentGovernancePolicy?.fullyQualifiedName,
      });

      setGovernancePolicies((prevGovernancePolicies) =>
        prevGovernancePolicies.map((policy) => {
          if (policy.id === currentGovernancePolicy?.id) {
            return {
              ...policy,
              termCount: (policy.termCount ?? 0) + 1,
            };
          }

          return policy;
        })
      );
      governancePolicyDetailsRef.current?.refreshClassificationTags();
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

  const handleUpdatePrimaryGovernanceStandard = async (updatedData: Tag) => {
    if (!isUndefined(editGovernanceStandard)) {
      setIsButtonLoading(true);
      const patchData = compare(editGovernanceStandard, updatedData);
      try {
        const response = await patchTag(editGovernanceStandard.id, patchData);
        if (response) {
          governancePolicyDetailsRef.current?.refreshClassificationTags();
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
    (record: Tag) => {
      if (currentGovernancePolicy) {
        setDeleteGovernanceStandards({
          data: {
            id: record.id as string,
            name: record.name,
            categoryName: currentGovernancePolicy?.fullyQualifiedName,
            isCategory: false,
            status: 'waiting',
          },
          state: true,
        });
      }
    },
    [currentGovernancePolicy]
  );

  const handleEditGovernanceStandardClick = useCallback((selectedGovernanceStandard: Tag) => {
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
     * If PolicyName is present then fetch that policy
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

  const onClickGovernancePolicies = (policy: Classification) => {
    setCurrentGovernancePolicy(policy);

    navigate(getGovernancePolicyPath(policy.fullyQualifiedName));
  };

  const handleAddGovernanceStandardSubmit = useCallback(
    async (data: SubmitProps) => {
      const updatedData = omit(data, 'color', 'iconURL');
      const style = {
        color: data.color,
        iconURL: data.iconURL,
      };

      if (editGovernanceStandard) {
        await handleUpdatePrimaryGovernanceStandard({ ...editGovernanceStandard, ...updatedData, style });
      } else {
        await handleCreatePrimaryGovernanceStandard({ ...updatedData, style });
      }
    },
    [editGovernanceStandard, handleUpdatePrimaryGovernanceStandard, handleCreatePrimaryGovernanceStandard]
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

            {governancePolicies.map((policy: Classification) => (
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
                  policy.termCount,
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
      checkPermission(Operation.Create, ResourceEntity.TAG, permissions) ||
      governancePolicyPermissions.EditAll,
    [permissions, governancePolicyPermissions]
  );

  const editGovernanceStandardsDescriptionPermission = useMemo(
    () =>
      checkPermission(
        Operation.EditDescription,
        ResourceEntity.TAG,
        permissions
      ) || governancePolicyPermissions.EditAll,
    [permissions, governancePolicyPermissions]
  );

  const editGovernanceStandardsDisplayNamePermission = useMemo(
    () =>
      checkPermission(
        Operation.EditDisplayName,
        ResourceEntity.TAG,
        permissions
      ) || governancePolicyPermissions.EditAll,
    [permissions, governancePolicyPermissions]
  );

  const editGovernanceStandardsPermission = useMemo(
    () =>
      checkPermission(Operation.EditAll, ResourceEntity.TAG, permissions) ||
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
        : t('message.adding-new-tag', {
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
              <ClassificationDetails
                classificationPermissions={governancePolicyPermissions}
                currentClassification={currentGovernancePolicy}
                deleteTags={deleteGovernanceStandards}
                disableEditButton={disableEditButton}
                handleActionDeleteTag={handleActionDeleteGovernanceStandard}
                handleAddNewTagClick={handleAddNewGovernanceStandardClick}
                handleAfterDeleteAction={handleAfterDeleteAction}
                handleEditTagClick={handleEditGovernanceStandardClick}
                handleUpdateClassification={handleUpdateGovernancePolicy}
                isAddingTag={isAddingGovernanceStandard}
                ref={governancePolicyDetailsRef}
              />

              {isAddingGovernancePolicy && (
                <GovernancePolicyForm
                  isGovernancePolicy
                  showMutuallyExclusive
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
                  isSystemGovernanceStandard={editGovernanceStandard?.provider === ProviderType.System}
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
