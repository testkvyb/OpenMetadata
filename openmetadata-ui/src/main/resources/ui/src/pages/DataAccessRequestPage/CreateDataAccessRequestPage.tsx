/*
 *  Copyright 2025 Collate.
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

import {
  Button,
  Card,
  Form,
  Space,
  Typography,
  notification,
} from 'antd';
import { AxiosError } from 'axios';
import { DateTime } from 'luxon';
import { FocusEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Searchbar from '../../components/common/SearchBarComponent/SearchBar.component';
import TitleBreadcrumb from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.component';
import { TitleBreadcrumbProps } from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.interface';
import DatePicker from '../../components/common/DatePicker/DatePicker';
import ResizablePanels from '../../components/common/ResizablePanels/ResizablePanels';
import ServiceDocPanel from '../../components/common/ServiceDocPanel/ServiceDocPanel';
import { SearchIndex } from '../../enums/search.enum';
import searchClassBase from '../../utils/SearchClassBase';
import {
  FieldProp,
  FieldTypes,
} from '../../interface/FormUtils.interface';
import { searchData } from '../../rest/miscAPI';
import { getField } from '../../utils/formUtils';
import { getTextFromHtmlString } from '../../utils/BlockEditorUtils';
import { showErrorToast, showSuccessToast } from '../../utils/ToastUtils';
import {
  DataAccessRequestFormData,
  PriorityLevel,
} from './CreateDataAccessRequestPage.interface';
import {ROUTES} from '../../../src/constants/constants' 

const { RangePicker } = DatePicker;
const { Text } = Typography;

const MIN_PURPOSE_LENGTH = 10;
const MAX_PURPOSE_LENGTH = 500;
const MIN_ACCESS_DAYS = 1;
const MAX_ACCESS_DAYS = 365;

const CreateDataAccessRequestPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm<DataAccessRequestFormData>();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string>('');
  const [selectedDataAsset, setSelectedDataAsset] = useState<
    any | undefined
  >();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [purposeCharCount, setPurposeCharCount] = useState<number>(0);

  const breadcrumbs: TitleBreadcrumbProps['titleLinks'] = useMemo(
    () => [
      {
        name: t('label.data-access'),
        url: ROUTES.SUBMIT_DATA_ACCESS_REQUEST,
      },
      {
        name: t('label.create-entity', {
          entity: t('label.request'),
        }),
        url: '',
      },
    ],
    [t]
  );

  const priorityOptions = useMemo(
    () => [
      {
        label: t('label.none'),
        value: PriorityLevel.NONE,
      },
      {
        label: t('label.low'),
        value: PriorityLevel.LOW,
      },
      {
        label: t('label.normal'),
        value: PriorityLevel.NORMAL,
      },
      {
        label: t('label.high'),
        value: PriorityLevel.HIGH,
      },
      {
        label: t('label.critical'),
        value: PriorityLevel.CRITICAL,
      },
    ],
    [t]
  );

  const handleFieldFocus = useCallback((event: FocusEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement;
    const isDescription = target.classList.contains('ProseMirror');
    
    if (isDescription) {
      // Find the parent Form.Item with data-testid
      let parent = target.parentElement;
      let depth = 0;
      const maxDepth = 10;
      
      while (parent && depth < maxDepth) {
        // Check if this parent has data-testid attribute
        const testId = parent.getAttribute('data-testid');
        
        if (testId === 'purpose' || testId === 'notes') {
          setActiveField(`root/${testId}`);
          return;
        }
        
        // Also check if parent has class that indicates form item
        if (parent.classList.contains('ant-form-item')) {
          // Try to find data-testid in children
          const formItemWithTestId = parent.querySelector('[data-testid="purpose"], [data-testid="notes"]');
          if (formItemWithTestId) {
            const testId = formItemWithTestId.getAttribute('data-testid');
            if (testId) {
              setActiveField(`root/${testId}`);
              return;
            }
          }
        }
        
        parent = parent.parentElement;
        depth++;
      }
    } else {
      setActiveField(target.id);
    }
  }, []);

  const handleSearch = useCallback(
    async (searchTerm: string) => {
      setSearchValue(searchTerm);
      
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await searchData(
          searchTerm,
          1,
          10,
          '',
          '',
          '',
          SearchIndex.ALL
        );

        const hits = (res.data?.hits?.hits || []) as any[];
        setSearchResults(hits);
      } catch (error) {
        showErrorToast(error as AxiosError);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleDataAssetClear = useCallback(() => {
    setSelectedDataAsset(undefined);
    setSearchResults([]);
    setSearchValue('');
    form.setFieldsValue({ dataAsset: undefined });
  }, [form]);

  const validateAccessDuration = useCallback(
    (_: unknown, value: [DateTime | null, DateTime | null]) => {
      if (!value || !value[0] || !value[1]) {
        return Promise.reject(
          new Error(t('message.field-text-is-required', { fieldText: t('label.access-duration') }))
        );
      }

      const startDate = value[0];
      const endDate = value[1];
      const diffInDays = endDate.diff(startDate, 'days').days;

      if (diffInDays < MIN_ACCESS_DAYS) {
        return Promise.reject(
          new Error(
            t('message.minimum-duration-error', {
              min: MIN_ACCESS_DAYS,
            })
          )
        );
      }

      if (diffInDays > MAX_ACCESS_DAYS) {
        return Promise.reject(
          new Error(
            t('message.maximum-duration-error', {
              max: MAX_ACCESS_DAYS,
            })
          )
        );
      }

      return Promise.resolve();
    },
    [t]
  );

  const disabledDate = useCallback((current: DateTime) => {
    // Disable dates before today
    return current < DateTime.now().startOf('day');
  }, []);

  const handleSubmit = useCallback(
    async (values: DataAccessRequestFormData) => {
      if (!selectedDataAsset) {
        showErrorToast(
          t('message.field-text-is-required', {
            fieldText: t('label.data-asset'),
          })
        );

        return;
      }

      setIsSubmitting(true);
      try {
        // Mock API call - replace with actual API when backend is ready
        const requestData = {
          dataAssetFQN: selectedDataAsset.fullyQualifiedName || selectedDataAsset.name,
          dataAssetType: selectedDataAsset.entityType || selectedDataAsset.serviceType,
          purpose: values.purpose,
          startDate: values.accessDuration[0]?.toISO() ?? '',
          endDate: values.accessDuration[1]?.toISO() ?? '',
          notes: values.notes,
          priority: values.priority,
        };

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        notification.success({
          message: t('label.success'),
          description: t('server.create-entity-success', {
            entity: t('label.data-access-request'),
          }),
          placement: 'topRight',
        });

        // Reset form and clear state after showing toast
        setTimeout(() => {
          form.resetFields();
          setSelectedDataAsset(undefined);
          setSearchResults([]);
          setSearchValue('');
          setPurposeCharCount(0);
          form.setFieldsValue({ priority: PriorityLevel.NORMAL });
        }, 500);
        
        // TODO: Navigate to request list or details page when implemented
        // navigate('/access/requests');
      } catch (error) {
        showErrorToast(error as AxiosError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedDataAsset, t, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    // Set default priority to NORMAL
    form.setFieldsValue({ priority: PriorityLevel.NORMAL });
  }, [form]);

  // Form fields definition
  const purposeField: FieldProp = {
    name: 'purpose',
    required: true,
    label: t('label.purpose'),
    id: 'root/purpose',
    type: FieldTypes.DESCRIPTION,
    props: {
      'data-testid': 'purpose',
      initialValue: '',
      height: '100px',
      placeholder: t('message.enter-purpose-placeholder'),
      // RichTextEditor uses `onTextChange` as the change event
      onTextChange: (value: string) => {
        const text = getTextFromHtmlString(value);
        setPurposeCharCount(text.length);

        // Trigger form validation for live errors
        void form.validateFields(['purpose']).catch(() => {});
      },
    },
    formItemProps: {
      extra: (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: '#888' }}>{purposeCharCount} / {MAX_PURPOSE_LENGTH}</span>
        </div>
      ),
    },
    rules: [
      {
        required: true,
        validator: (_: unknown, value: string) => {
          const text = getTextFromHtmlString(value);
          if (!text || text.length === 0) {
            return Promise.reject(t('message.field-text-is-required', { fieldText: t('label.purpose') }));
          }
          if (text.length < MIN_PURPOSE_LENGTH) {
            return Promise.reject(
              t('message.minimum-length-field', {
                field: t('label.purpose'),
                length: MIN_PURPOSE_LENGTH,
              })
            );
          }
          if (text.length > MAX_PURPOSE_LENGTH) {
            return Promise.reject(
              t('message.maximum-length-field', {
                field: t('label.purpose'),
                length: MAX_PURPOSE_LENGTH,
              })
            );
          }
          return Promise.resolve();
        },
      },
    ],
  };

  // Access duration will be rendered manually due to RangePicker complexity

  const priorityField: FieldProp = {
    name: 'priority',
    id: 'root/priority',
    required: true,
    label: t('label.priority'),
    type: FieldTypes.SELECT,
    props: {
      'data-testid': 'priority-select',
      options: priorityOptions,
      placeholder: t('label.select-field', { field: t('label.priority') }),
    },
    rules: [
      {
        required: true,
        message: t('message.field-text-is-required', {
          fieldText: t('label.priority'),
        }),
      },
    ],
  };

  const notesField: FieldProp = {
    name: 'notes',
    required: false,
    label: t('label.note-plural'),
    id: 'root/notes',
    type: FieldTypes.DESCRIPTION,
    props: {
      'data-testid': 'notes',
      initialValue: '',
      height: '100px',
      placeholder: t('message.enter-notes-placeholder'),
    },
  };

  const firstPanelChildren = (
    <>
      <TitleBreadcrumb titleLinks={breadcrumbs} />
      <Typography.Title
        className="m-t-md"
        data-testid="form-heading"
        level={5}>
        {t('label.create-entity', { entity: t('label.data-access-request') })}
      </Typography.Title>
      <div data-testid="add-data-access-request">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFocusCapture={handleFieldFocus}>
          <div onClick={() => setActiveField('root/dataAsset')}>
            <Form.Item
              data-testid="data-asset-form-item"
              id="root/dataAsset"
              label={t('label.data-asset')}
              name="dataAsset"
              required
              rules={[
                {
                  required: true,
                  message: t('message.field-text-is-required', {
                    fieldText: t('label.data-asset'),
                  }),
                },
              ]}>
              {selectedDataAsset ? (
              <Card className="m-b-xs" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space
                    align="start"
                    style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space direction="vertical" size={0}>
                      <Text strong>
                        {selectedDataAsset.displayName || selectedDataAsset.name}
                      </Text>
                      <Text style={{ fontSize: '12px' }} type="secondary">
                        {selectedDataAsset.fullyQualifiedName}
                      </Text>
                    </Space>
                    <Button
                      danger
                      size="small"
                      type="text"
                      onClick={handleDataAssetClear}>
                      {t('label.clear')}
                    </Button>
                  </Space>
                  {selectedDataAsset.description && (
                    <Text style={{ fontSize: '13px' }} type="secondary">
                      {selectedDataAsset.description}
                    </Text>
                  )}
                </Space>
              </Card>
            ) : (
              <div>
                <Searchbar
                  placeholder={t('message.search-for-data-assets-placeholder')}
                  removeMargin
                  searchBarDataTestId="data-asset-search"
                  searchValue={searchValue}
                  showClearSearch
                  showLoadingStatus
                  typingInterval={1000}
                  onSearch={handleSearch}
                />
                {searchResults.length > 0 && (
                  <Card
                    className="m-t-xs"
                    data-testid="search-results-dropdown"
                    size="small"
                    style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      border: '1px solid #d9d9d9',
                    }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {searchResults.map((hit) => {
                        const source = hit._source;
                        const entityType = source.entityType || source.serviceType || 'Asset';
                        const entityIcon = searchClassBase.getEntityIcon(source.entityType ?? '');
                        return (
                          <div
                            key={hit._id || source.id}
                            className="cursor-pointer hover-cell-icon"
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                            }}
                            onClick={() => {
                              setSelectedDataAsset(source);
                              form.setFieldsValue({
                                dataAsset: source.fullyQualifiedName,
                              });
                              setSearchResults([]);
                              setSearchValue('');
                            }}>
                            <Space size={4}>
                              {entityIcon && (
                                <span className="w-6 h-6 m-r-xs d-inline-flex text-xl align-middle" style={{ color: 'inherit' }}>
                                  {entityIcon}
                                </span>
                              )}
                              <Space direction="vertical" size={0}>
                                <Space size={4}>
                                  <Text strong>
                                    {source.displayName || source.name}
                                  </Text>
                                  <Text
                                    style={{ fontSize: '11px' }}
                                    type="secondary">
                                    ({entityType})
                                  </Text>
                                </Space>
                                <Text
                                  style={{ fontSize: '12px' }}
                                  type="secondary">
                                  {source.fullyQualifiedName}
                                </Text>
                              </Space>
                            </Space>
                          </div>
                        );
                      })}
                    </Space>
                  </Card>
                )}
              </div>
            )}
          </Form.Item>
          </div>


          <div onClick={() => setActiveField('root/purpose')}>
            {getField(purposeField)}
          </div>

          <div className="m-b-md" onClick={() => setActiveField('root/accessDuration')}>
            <Form.Item
              data-testid="access-duration-form-item"
              id="root/accessDuration"
              label={t('label.access-duration')}
              name="accessDuration"
              required
              rules={[
                {
                  required: true,
                  message: t('message.field-text-is-required', {
                    fieldText: t('label.access-duration'),
                  }),
                },
                { validator: validateAccessDuration },
              ]}>
              <RangePicker
                className="w-full"
                data-testid="access-duration-range-picker"
                disabledDate={disabledDate}
                format="YYYY-MM-DD"
                id="root/accessDuration"
                placeholder={[t('label.start-date'), t('label.end-date')]}
              />
            </Form.Item>
            <Text className="m-t-xs" type="secondary">
              {t('message.access-duration-range-info', {
                min: MIN_ACCESS_DAYS,
                max: MAX_ACCESS_DAYS,
              })}
            </Text>
          </div>

          <div className="m-b-md" onClick={() => setActiveField('root/priority')}>{getField(priorityField)}</div>

          <div onClick={() => setActiveField('root/notes')}>
            {getField(notesField)}
          </div>

          <Space
            className="w-full justify-end"
            data-testid="cta-buttons"
            size={16}>
            <Button
              data-testid="cancel-button"
              type="link"
              onClick={handleCancel}>
              {t('label.cancel')}
            </Button>
            <Button
              data-testid="submit-button"
              htmlType="submit"
              loading={isSubmitting}
              type="primary">
              {t('label.submit')}
            </Button>
          </Space>
        </Form>
      </div>
    </>
  );

  const secondPanelChildren = (
    <div data-testid="right-panel">
      <Typography.Title level={5}>
        {t('label.configure-entity', {
          entity: t('label.data-access-request'),
        })}
      </Typography.Title>
      <Typography.Text className="mb-5">
        {t('message.data-access-request-description')}
      </Typography.Text>
      <ServiceDocPanel
        activeField={activeField}
        serviceName="DataAccessRequest"
        serviceType="DataAccess"
      />
    </div>
  );

  return (
    <ResizablePanels
      className="content-height-with-resizable-panel"
      firstPanel={{
        className: 'content-resizable-panel-container',
        cardClassName: 'm-x-auto max-w-md',
        allowScroll: true,
        children: firstPanelChildren,
        minWidth: 700,
        flex: 0.7,
      }}
      pageTitle={t('label.add-entity', {
        entity: t('label.data-access-request'),
      })}
      secondPanel={{
        children: secondPanelChildren,
        className: 'content-resizable-panel-container',
        minWidth: 400,
        flex: 0.3,
      }}
    />
  );
};

export default CreateDataAccessRequestPage;