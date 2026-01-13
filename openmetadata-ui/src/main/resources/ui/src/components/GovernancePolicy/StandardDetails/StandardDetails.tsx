/*
 *  Copyright 2023 Collate.
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

import Icon from '@ant-design/icons/lib/components/Icon';
import { Button, Card, Col, Row, Space, Tag, Tooltip, Typography } from 'antd';
import ButtonGroup from 'antd/lib/button/button-group';
import { ColumnsType } from 'antd/lib/table';
import { AxiosError } from 'axios';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { capitalize, isEmpty, isUndefined, toString } from 'lodash';
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as LockIcon } from '../../../assets/svg/closed-lock.svg';
import { ReactComponent as IconEdit } from '../../../assets/svg/edit-new.svg';
import { ReactComponent as IconDelete } from '../../../assets/svg/ic-delete.svg';
import { ReactComponent as VersionIcon } from '../../../assets/svg/ic-version.svg';
import { ReactComponent as IconPolicy } from '../../../assets/svg/policies-colored.svg';
import { DE_ACTIVE_COLOR } from '../../../constants/constants';
import { CustomizeEntityType } from '../../../constants/Customize.constants';
import { usePermissionProvider } from '../../../context/PermissionProvider/PermissionProvider';
import { ResourceEntity } from '../../../context/PermissionProvider/PermissionProvider.interface';
import { EntityType } from '../../../enums/entity.enum';
import { GovernancePolicy, PolicyStatus } from '../../../generated/entity/governancePolicy/governancePolicy';
import { GovernanceStandard } from '../../../generated/entity/governancePolicy/governanceStandard';
import { Operation } from '../../../generated/entity/policies/policy';
import { Paging } from '../../../generated/type/paging';
import { usePaging } from '../../../hooks/paging/usePaging';
import { useApplicationStore } from '../../../hooks/useApplicationStore';
import { useFqn } from '../../../hooks/useFqn';
import { getAllGovernanceStandards } from '../../../rest/governancePolicyAPI';
import { getEntityName } from '../../../utils/EntityUtils';
import { checkPermission } from '../../../utils/PermissionsUtils';
import {
    getGovernancePolicyPath,
    getGovernancePolicyVersionsPath
} from '../../../utils/RouterUtils';
import { getErrorText } from '../../../utils/StringsUtils';
import { showErrorToast } from '../../../utils/ToastUtils';
import AppBadge from '../../common/Badge/Badge.component';
import DescriptionV1 from '../../common/EntityDescription/DescriptionV1';
import ManageButton from '../../common/EntityPageInfos/ManageButton/ManageButton';
import ErrorPlaceHolder from '../../common/ErrorWithPlaceholder/ErrorPlaceHolder';
import { NextPreviousProps } from '../../common/NextPrevious/NextPrevious.interface';
import Table from '../../common/Table/Table';
import { GenericProvider } from '../../Customization/GenericProvider/GenericProvider';
import { DomainLabelV2 } from '../../DataAssets/DomainLabelV2/DomainLabelV2';
import { OwnerLabelV2 } from '../../DataAssets/OwnerLabelV2/OwnerLabelV2';
import EntityHeaderTitle from '../../Entity/EntityHeaderTitle/EntityHeaderTitle.component';
import './standard-details.less';
import { StandardDetailsProps } from './StandardDetails.interface';

const StandardDetails = forwardRef(
  (
    {
      currentPolicy,
      handleAfterDeleteAction,
      policyPermissions,
      handleUpdatePolicy,
      handleEditStandardClick,
      deleteStandards,
      isAddingStandard,
      handleActionDeleteStandard,
      handleAddNewStandardClick,
      disableEditButton,
      isVersionView = false,
    }: Readonly<StandardDetailsProps>,
    ref
  ) => {
    const { theme } = useApplicationStore();
    const { permissions } = usePermissionProvider();
    const { t } = useTranslation();
    const { fqn: policyName } = useFqn();
    const navigate = useNavigate();
    const [standards, setStandards] = useState<GovernanceStandard[]>([]);
    const [isStandardsLoading, setIsStandardsLoading] = useState(true);
    const {
      currentPage,
      paging,
      pageSize,
      pagingCursor,
      handlePageChange,
      handlePageSizeChange,
      handlePagingChange,
      showPagination,
    } = usePaging();

    const fetchPolicyStandards = async (
      currentPolicyName: string,
      paging?: Partial<Paging>
    ) => {
      setIsStandardsLoading(true);
      setStandards([]);
      try {
        const { data, paging: standardPaging } = await getAllGovernanceStandards({
          parent: currentPolicyName,
          after: paging?.after,
          before: paging?.before,
          limit: pageSize,
        });
        setStandards(data);
        handlePagingChange(standardPaging);
      } catch (error) {
        const errMsg = getErrorText(
          error as AxiosError,
          t('server.entity-fetch-error', { entity: t('label.governance-standard-plural') })
        );
        showErrorToast(errMsg);
        setStandards([]);
      } finally {
        setIsStandardsLoading(false);
      }
    };

    const handleStandardsPageChange: NextPreviousProps['pagingHandler'] = ({
      currentPage,
      cursorType,
    }) => {
      if (cursorType) {
        fetchPolicyStandards(
          currentPolicy?.fullyQualifiedName ?? '',
          {
            [cursorType]: paging[cursorType],
          }
        );
        handlePageChange(
          currentPage,
          { cursorType, cursorValue: paging[cursorType] },
          pageSize
        );
      }
    };

    const {
      currentVersion,
      isPolicyDisabled,
      name,
      displayName,
      description,
      isSystemPolicy,
      isPolicyDeleted,
      policyType,
      status,
      reviewDate,
    } = useMemo(() => {
      const isDisabled = currentPolicy?.disabled ?? false;
      const isDeleted = currentPolicy?.deleted ?? false;
      const isSystem = currentPolicy?.provider === 'system';

      return {
        currentVersion: currentPolicy?.version ?? 0.1,
        isPolicyDisabled: isDisabled,
        name: currentPolicy?.name,
        displayName: currentPolicy?.displayName,
        description: currentPolicy?.description,
        isSystemPolicy: isSystem,
        isPolicyDeleted: isDeleted,
        policyType: currentPolicy?.policyType,
        status: currentPolicy?.status,
        reviewDate: currentPolicy?.reviewDate,
      };
    }, [currentPolicy, isVersionView]);

    const versionHandler = useCallback(() => {
      isVersionView
        ? navigate(getGovernancePolicyPath(policyName))
        : navigate(
            getGovernancePolicyVersionsPath(
              policyName,
              toString(currentVersion)
            )
          );
    }, [currentVersion, policyName, isVersionView, navigate]);

    const {
      editPolicyPermission,
      editDescriptionPermission,
      createPermission,
      deletePermission,
      editDisplayNamePermission,
      editOwnerPermission,
      editDomainPermission,
    } = useMemo(() => {
      const isEditable = !isPolicyDisabled && !isPolicyDeleted;

      return {
        editPolicyPermission: policyPermissions.EditAll,
        editDescriptionPermission:
          !isVersionView &&
          !isPolicyDisabled &&
          (policyPermissions.EditAll ||
            policyPermissions.EditDescription),
        createPermission:
          !isVersionView &&
          (checkPermission(Operation.Create, ResourceEntity.GOVERNANCE_STANDARD, permissions) ||
            policyPermissions.EditAll),
        deletePermission:
          policyPermissions.Delete && !isSystemPolicy,
        editDisplayNamePermission:
          policyPermissions.EditAll ||
          policyPermissions.EditDisplayName,
        editOwnerPermission:
          isEditable &&
          (policyPermissions.EditAll ||
            policyPermissions.EditOwners),
        editDomainPermission: isEditable && policyPermissions.EditAll,
      };
    }, [
      permissions,
      policyPermissions,
      isVersionView,
      isPolicyDisabled,
      isSystemPolicy,
      isPolicyDeleted,
    ]);

    const headerBadge = useMemo(
      () =>
        isSystemPolicy ? (
          <AppBadge
            className="whitespace-nowrap"
            icon={<LockIcon height={12} />}
            label={capitalize(currentPolicy?.provider)}
          />
        ) : null,
      [isSystemPolicy, currentPolicy]
    );

    const showDisableOption = useMemo(
      () => isSystemPolicy && editPolicyPermission,
      [isSystemPolicy, editPolicyPermission]
    );

    const showManageButton = useMemo(
      () =>
        !isVersionView &&
        (editDisplayNamePermission || deletePermission || showDisableOption),
      [
        editDisplayNamePermission,
        deletePermission,
        showDisableOption,
        isVersionView,
      ]
    );

    const handleUpdateDisplayName = async (data: {
      name: string;
      displayName?: string;
    }) => {
      if (!isUndefined(currentPolicy)) {
        return handleUpdatePolicy?.({
          ...currentPolicy,
          ...data,
        });
      }
    };

    const handleUpdateDescription = async (updatedHTML: string) => {
      if (!isUndefined(currentPolicy)) {
        handleUpdatePolicy?.({
          ...currentPolicy,
          description: updatedHTML,
        });
      }
    };

    const handleEnableDisablePolicyClick = useCallback(() => {
      if (!isUndefined(currentPolicy)) {
        handleUpdatePolicy?.({
          ...currentPolicy,
          disabled: !isPolicyDisabled,
        });
      }
    }, [
      currentPolicy,
      handleUpdatePolicy,
      isPolicyDisabled,
    ]);

    const addStandardButtonToolTip = useMemo(() => {
      if (isPolicyDisabled) {
        return t('message.disabled-policy-actions-message');
      }
      if (!createPermission) {
        return t('message.no-permission-for-action');
      }

      return null;
    }, [createPermission, isPolicyDisabled]);

    const getStatusBadge = (status?: PolicyStatus) => {
      if (!status) return null;
      
      const statusConfig: Record<PolicyStatus, { color: string; label: string }> = {
        [PolicyStatus.Active]: { color: 'success', label: t('label.active') },
        [PolicyStatus.Draft]: { color: 'default', label: t('label.draft') },
        [PolicyStatus.Deprecated]: { color: 'error', label: t('label.deprecated') },
        [PolicyStatus.UnderReview]: { color: 'processing', label: t('label.under-review') },
      };

      const config = statusConfig[status];

      return (
        <Tag color={config.color}>
          {config.label}
        </Tag>
      );
    };

    const tableColumn: ColumnsType<GovernanceStandard> = useMemo(
      () => [
        {
          title: t('label.name'),
          dataIndex: 'name',
          key: 'name',
          render: (name: string, record: GovernanceStandard) => (
            <Typography.Text strong>{getEntityName(record)}</Typography.Text>
          ),
        },
        {
          title: t('label.description'),
          dataIndex: 'description',
          key: 'description',
          render: (description: string) => {
            // Strip HTML tags from description for display in list
            const plainText = description?.replace(/<[^>]*>/g, '') || t('label.no-description');
            return (
              <Typography.Paragraph
                ellipsis={{ rows: 2 }}
                className="m-b-0">
                {plainText}
              </Typography.Paragraph>
            );
          },
        },
        {
          title: t('label.action-plural'),
          key: 'actions',
          width: 90,
          render: (_, record: GovernanceStandard) => (
            <Space size="middle">
              <Tooltip
                placement="bottom"
                title={
                  disableEditButton
                    ? t('message.no-permission-for-action')
                    : t('label.edit')
                }>
                <Button
                  className="flex-center p-0"
                  data-testid={`edit-button-${record.name}`}
                  disabled={disableEditButton}
                  icon={
                    <IconEdit
                      height={16}
                      style={{ color: disableEditButton ? DE_ACTIVE_COLOR : undefined }}
                      width={16}
                    />
                  }
                  size="small"
                  type="text"
                  onClick={() => handleEditStandardClick?.(record)}
                />
              </Tooltip>
              <Tooltip
                placement="bottom"
                title={
                  isPolicyDisabled ||
                  record.provider === 'system' ||
                  !policyPermissions.EditAll
                    ? t('message.no-permission-for-action')
                    : t('label.delete')
                }>
                <Button
                  className="flex-center p-0"
                  data-testid={`delete-button-${record.name}`}
                  disabled={
                    isPolicyDisabled ||
                    record.provider === 'system' ||
                    !policyPermissions.EditAll
                  }
                  icon={
                    <IconDelete
                      height={16}
                      style={{
                        color:
                          isPolicyDisabled ||
                          record.provider === 'system' ||
                          !policyPermissions.EditAll
                            ? DE_ACTIVE_COLOR
                            : undefined,
                      }}
                      width={16}
                    />
                  }
                  size="small"
                  type="text"
                  onClick={() => handleActionDeleteStandard?.(record)}
                />
              </Tooltip>
            </Space>
          ),
        },
      ],
      [
        isPolicyDisabled,
        policyPermissions,
        deleteStandards,
        disableEditButton,
        handleEditStandardClick,
        handleActionDeleteStandard,
        isVersionView,
      ]
    );

    const extraDropdownContent = useMemo(
      () =>
        showDisableOption
          ? [
              {
                label: isPolicyDisabled
                  ? t('label.enable')
                  : t('label.disable'),
                key: 'enable-disable',
                onClick: handleEnableDisablePolicyClick,
              },
            ]
          : [],
      [
        isPolicyDisabled,
        showDisableOption,
        handleEnableDisablePolicyClick,
      ]
    );

    useEffect(() => {
      if (currentPolicy?.fullyQualifiedName && !isAddingStandard) {
        const { cursorType, cursorValue } = pagingCursor ?? {};

        if (cursorType && cursorValue) {
          fetchPolicyStandards(
            currentPolicy.fullyQualifiedName,
            {
              [cursorType]: cursorValue,
            }
          );
        } else {
          fetchPolicyStandards(currentPolicy.fullyQualifiedName);
        }
      }
    }, [currentPolicy?.fullyQualifiedName, pageSize, pagingCursor]);

    useImperativeHandle(ref, () => ({
      refreshStandards() {
        if (currentPolicy?.fullyQualifiedName) {
          fetchPolicyStandards(currentPolicy.fullyQualifiedName);
        }
      },
    }));

    return (
      <div className="h-full overflow-y-auto" data-testid="policy-standards-container">
        {currentPolicy ? (
          <>
            <Row data-testid="header" wrap={false}>
              <Col flex="auto">
                <EntityHeaderTitle
                  badge={
                    <div className="d-flex gap-1">
                      {headerBadge}
                      {status && getStatusBadge(status)}
                    </div>
                  }
                  className={classNames('flex-wrap', {
                    'opacity-60': isPolicyDisabled,
                  })}
                  displayName={displayName}
                  icon={
                    <IconPolicy className="h-9" style={{ color: DE_ACTIVE_COLOR }} />
                  }
                  isDisabled={isPolicyDisabled}
                  name={name ?? currentPolicy.name}
                  serviceName="governancePolicy"
                />
            
            {policyType && (
              <div className="m-t-xs">
                <Tag color="blue">{t(`label.${policyType.toLowerCase()}`)}</Tag>
              </div>
            )}

            {reviewDate && (
              <div className="m-t-xs">
                <Typography.Text type="secondary">
                  {t('label.review-date')}: {dayjs(reviewDate).format('YYYY-MM-DD')}
                </Typography.Text>
              </div>
            )}
          </Col>

          <Col className="d-flex justify-end items-start" flex="270px">
            <Space size={12}>
              {createPermission && (
                <Tooltip title={addStandardButtonToolTip}>
                  <Button
                    data-testid="add-new-standard-button"
                    disabled={isPolicyDisabled}
                    type="primary"
                    onClick={handleAddNewStandardClick}>
                    {t('label.add-entity', {
                      entity: t('label.governance-standard'),
                    })}
                  </Button>
                </Tooltip>
              )}

              <ButtonGroup className="spaced" size="small">
                <Tooltip
                  title={t(
                    `label.${
                      isVersionView
                        ? 'exit-version-history'
                        : 'version-plural-history'
                    }`
                  )}>
                  <Button
                    className="w-16 p-0"
                    data-testid="version-button"
                    icon={<Icon component={VersionIcon} />}
                    onClick={versionHandler}>
                    <Typography.Text>{currentVersion}</Typography.Text>
                  </Button>
                </Tooltip>
                {showManageButton && (
                  <ManageButton
                    isRecursiveDelete
                    afterDeleteAction={handleAfterDeleteAction}
                    allowRename={!isSystemPolicy}
                    allowSoftDelete={false}
                    canDelete={deletePermission && !isPolicyDisabled}
                    displayName={getEntityName(currentPolicy)}
                    editDisplayNamePermission={
                      editDisplayNamePermission && !isPolicyDisabled
                    }
                    entityFQN={currentPolicy.fullyQualifiedName}
                    entityId={currentPolicy.id}
                    entityName={currentPolicy.name}
                    entityType={EntityType.GOVERNANCE_POLICY}
                    extraDropdownContent={extraDropdownContent}
                    onEditDisplayName={handleUpdateDisplayName}
                  />
                )}
              </ButtonGroup>
            </Space>
          </Col>
        </Row>

        <GenericProvider<GovernancePolicy>
          data={currentPolicy as GovernancePolicy}
          isVersionView={isVersionView}
          permissions={policyPermissions}
          type={EntityType.GOVERNANCE_POLICY as CustomizeEntityType}
          onUpdate={(updatedData: GovernancePolicy) =>
            Promise.resolve(handleUpdatePolicy?.(updatedData))
          }>
          <Row className="m-t-md" gutter={16}>
            <Col span={18}>
              <Card className="governance-policy-details-card">
                <div className="m-b-sm" data-testid="description-container">
                  <DescriptionV1
                    wrapInCard
                    className={classNames({
                      'opacity-60': isPolicyDisabled,
                    })}
                    description={description}
                    entityName={getEntityName(currentPolicy)}
                    entityType={EntityType.GOVERNANCE_POLICY}
                    hasEditAccess={editDescriptionPermission}
                    isDescriptionExpanded={isEmpty(standards)}
                    showCommentsIcon={false}
                    onDescriptionUpdate={handleUpdateDescription}
                  />
                </div>

                <Table
                  className={classNames({
                    'opacity-60': isPolicyDisabled,
                  })}
                  columns={tableColumn}
                  customPaginationProps={{
                    currentPage,
                    isLoading: isStandardsLoading,
                    pageSize,
                    paging,
                    showPagination,
                    pagingHandler: handleStandardsPageChange,
                    onShowSizeChange: handlePageSizeChange,
                  }}
                  data-testid="standards-table"
                  dataSource={standards}
                  loading={isStandardsLoading}
                  locale={{
                    emptyText: (
                      <ErrorPlaceHolder
                        className="m-y-md"
                        placeholderText={t('message.no-governance-standards')}
                      />
                    ),
                  }}
                  pagination={false}
                  rowClassName={(record) =>
                    record.disabled ? 'opacity-60' : ''
                  }
                  rowKey="id"
                  scroll={{ x: true }}
                  size="small"
                />
              </Card>
            </Col>
            <Col span={6}>
              <div className="d-flex flex-column gap-5">
                <DomainLabelV2
                  multiple
                  showDomainHeading
                  hasPermission={editDomainPermission}
                />
                <OwnerLabelV2
                  dataTestId="policy-owner-name"
                  hasPermission={editOwnerPermission}
                />
              </div>
            </Col>
          </Row>
        </GenericProvider>
          </>
        ) : (
          <ErrorPlaceHolder
            className="m-y-lg"
            heading={t('label.governance-policy')}
            placeholderText={t('message.select-governance-policy-to-view-details')}
          />
        )}
      </div>
    );
  }
);

export default StandardDetails;
