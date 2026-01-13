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

import { PlusOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Modal, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DomainLabel } from '../../components/common/DomainLabel/DomainLabel.component';
import { EntityAttachmentProvider } from '../../components/common/EntityDescription/EntityAttachmentProvider/EntityAttachmentProvider';
import { OwnerLabel } from '../../components/common/OwnerLabel/OwnerLabel.component';
import { VALIDATION_MESSAGES } from '../../constants/constants';
import { TAG_NAME_REGEX } from '../../constants/regex.constants';
import { DEFAULT_FORM_VALUE } from '../../constants/Tags.constant';
import { EntityType } from '../../enums/entity.enum';
import { PolicyType } from '../../generated/entity/governancePolicy/governancePolicy';
import { EntityReference } from '../../generated/tests/testCase';
import { useDomainStore } from '../../hooks/useDomainStore';
import { useEntityRules } from '../../hooks/useEntityRules';
import {
    FieldProp,
    FieldTypes,
    FormItemLayout
} from '../../interface/FormUtils.interface';
import { generateFormFields, getField } from '../../utils/formUtils';
import { GovernancePolicyFormProps, SubmitProps } from './GovernancePolicyPage.interface';

const GovernancePolicyForm = ({
  visible,
  onCancel,
  header,
  initialValues,
  onSubmit,
  isLoading,
  isSystemGovernanceStandard,
  permissions,
  isGovernancePolicy,
  isEditing = false,
  isTier = false,
}: GovernancePolicyFormProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { entityRules } = useEntityRules(EntityType.GOVERNANCE_POLICY);
  const selectedDomain = Form.useWatch<EntityReference[] | undefined>(
    'domains',
    form
  );

  const selectedOwners =
    Form.useWatch<EntityReference | EntityReference[]>('owners', form) ?? [];

  const ownersList = Array.isArray(selectedOwners)
    ? selectedOwners
    : [selectedOwners];
  const { activeDomainEntityRef } = useDomainStore();

  useEffect(() => {
    const formData: any = { ...initialValues };
    
    if (isGovernancePolicy && initialValues && 'reviewDate' in initialValues && initialValues.reviewDate) {
      formData.reviewDate = dayjs(initialValues.reviewDate);
    }
    
    form.setFieldsValue(formData);
  }, [initialValues, isGovernancePolicy]);

  const disableNameField = useMemo(
    () => isEditing && isSystemGovernanceStandard,
    [isEditing, isSystemGovernanceStandard]
  );

  const disableDisplayNameField = useMemo(
    () =>
      isEditing
        ? !(permissions?.editDisplayName || permissions?.editAll)
        : !(permissions?.createGovernanceStandards || isGovernancePolicy),
    [isEditing, isGovernancePolicy, permissions]
  );

  const disableDescriptionField = useMemo(
    () =>
      isEditing
        ? !(permissions?.editDescription || permissions?.editAll)
        : !(permissions?.createGovernanceStandards || isGovernancePolicy),
    [isEditing, isGovernancePolicy, permissions]
  );

  const ownerField: FieldProp = useMemo(
    () => ({
      name: 'owners',
      id: 'root/owner',
      required: false,
      label: t('label.owner-plural'),
      type: FieldTypes.USER_TEAM_SELECT,
      props: {
        hasPermission: true,
        children: (
          <Button
            data-testid="add-owner"
            icon={<PlusOutlined style={{ color: 'white', fontSize: '12px' }} />}
            size="small"
            type="primary"
          />
        ),
        multiple: {
          user: entityRules.canAddMultipleUserOwners,
          team: entityRules.canAddMultipleTeamOwner,
        },
      },
      formItemLayout: FormItemLayout.HORIZONTAL,
      formItemProps: {
        valuePropName: 'owners',
        trigger: 'onUpdate',
      },
    }),
    [entityRules]
  );

  const domainField: FieldProp = useMemo(
    () => ({
      name: 'domains',
      id: 'root/domains',
      required: false,
      label: t('label.domain-plural'),
      type: FieldTypes.DOMAIN_SELECT,
      props: {
        selectedDomain: activeDomainEntityRef,
        children: (
          <Button
            data-testid="add-domain"
            icon={<PlusOutlined style={{ color: 'white', fontSize: '12px' }} />}
            size="small"
            type="primary"
          />
        ),
        multiple: entityRules.canAddMultipleDomains,
      },
      formItemLayout: FormItemLayout.HORIZONTAL,
      formItemProps: {
        valuePropName: 'selectedDomain',
        trigger: 'onUpdate',
        initialValue: activeDomainEntityRef,
      },
    }),
    [entityRules.canAddMultipleDomains]
  );

  const formFields: FieldProp[] = [
    {
      name: 'name',
      id: 'root/name',
      required: true,
      label: t('label.name'),
      type: FieldTypes.TEXT,
      rules: [
        {
          pattern: TAG_NAME_REGEX,
          message: t('message.entity-name-validation'),
        },
        {
          type: 'string',
          min: 2,
          max: 64,
          message: t('message.entity-size-must-be-between-2-and-64', {
            entity: t('label.name'),
          }),
        },
      ],
      props: {
        'data-testid': 'name',
        disabled: disableNameField,
      },
      placeholder: t('label.name'),
    },
    {
      name: 'displayName',
      id: 'root/displayName',
      required: false,
      label: t('label.display-name'),
      type: FieldTypes.TEXT,
      props: {
        'data-testid': 'displayName',
        disabled: disableDisplayNameField,
      },
      placeholder: t('label.display-name'),
    },
    {
      name: 'description',
      required: true,
      label: t('label.description'),
      id: 'root/description',
      type: FieldTypes.DESCRIPTION,
      props: {
        'data-testid': 'description',
        initialValue: initialValues?.description ?? '',
        readonly: disableDescriptionField,
      },
    },
    ...(!isGovernancePolicy
      ? [
          {
            name: 'rule',
            required: false,
            label: t('label.rule'),
            id: 'root/rule',
            type: FieldTypes.TEXT,
            props: {
              'data-testid': 'rule',
              placeholder: t('message.enter-rule-definition'),
              rows: 4,
            },
          },
        ]
      : []),
    ...(isGovernancePolicy
      ? [
          {
            name: 'policyType',
            id: 'root/policyType',
            label: t('label.policy-type'),
            required: true,
            type: FieldTypes.SELECT,
            props: {
              'data-testid': 'policy-type',
              placeholder: t('label.select-field', { field: t('label.policy-type') }),
              options: [
                { label: t('label.security'), value: PolicyType.Security },
                { label: t('label.data-quality'), value: PolicyType.DataQuality },
                { label: t('label.retention'), value: PolicyType.Retention },
                { label: t('label.privacy'), value: PolicyType.Privacy },
              ],
            },
          }
        ]
      : []),
  ];

  const handleSave = async (data: SubmitProps) => {
    setSaving(true);
    try {
      const submitData: SubmitProps = {
        ...data,
        ...(isGovernancePolicy && data.reviewDate 
          ? { reviewDate: dayjs(data.reviewDate).valueOf() } 
          : {}),
      };

      await onSubmit(submitData);
      form.setFieldsValue(DEFAULT_FORM_VALUE);
    } catch {
      // Parent will handle the error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      centered
      destroyOnClose
      closable={false}
      data-testid="modal-container"
      okButtonProps={{
        form: 'governance-policy-form',
        type: 'primary',
        htmlType: 'submit',
        loading: isLoading || saving,
      }}
      okText={t('label.save')}
      open={visible}
      title={
        <Typography.Text strong data-testid="header">
          {header}
        </Typography.Text>
      }
      width={750}
      onCancel={() => {
        form.setFieldsValue(DEFAULT_FORM_VALUE);
        onCancel();
      }}>
      <EntityAttachmentProvider
        entityFqn={initialValues?.fullyQualifiedName}
        entityType={
          isGovernancePolicy ? EntityType.GOVERNANCE_POLICY : EntityType.GOVERNANCE_STANDARD
        }>
        <Form
          form={form}
          initialValues={initialValues ?? DEFAULT_FORM_VALUE}
          layout="vertical"
          name="governance-policy-form"
          validateMessages={VALIDATION_MESSAGES}
          onFinish={handleSave}>
          {generateFormFields(formFields)}
          {isGovernancePolicy && (
            <Form.Item
              label={t('label.review-date')}
              name="reviewDate">
              <DatePicker
                className="w-full"
                data-testid="review-date-picker"
                format="YYYY-MM-DD"
                placeholder={t('label.select-field', { field: t('label.review-date') })}
              />
            </Form.Item>
          )}
          <div className="m-y-xs">
            {getField(ownerField)}
            {Boolean(ownersList.length) && (
              <Space wrap data-testid="owner-container" size={[8, 8]}>
                <OwnerLabel owners={ownersList} />
              </Space>
            )}
          </div>
          <div className="m-t-xss">
            {getField(domainField)}
            {selectedDomain && (
              <DomainLabel
                domains={selectedDomain}
                entityFqn=""
                entityId=""
                entityType={
                  isGovernancePolicy ? EntityType.GOVERNANCE_POLICY : EntityType.GOVERNANCE_STANDARD
                }
                hasPermission={false}
              />
            )}
          </div>
        </Form>
      </EntityAttachmentProvider>
    </Modal>
  );
};

export default GovernancePolicyForm;