/*
 * Copyright 2025 Collate.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Card } from 'antd';
import {
  Box,
  TextField,
  FormControl,
  FormHelperText,
  Typography as MuiTypography,
  Button as MuiButton,
  Stack as MuiStack,
} from '@mui/material';
import { createDataAccessRequest } from '../../rest/dataAccessRequestAPI';
import MUISelect from '../../components/common/MUISelect/MUISelect';
import RichTextEditor from '../../components/common/RichTextEditor/RichTextEditor';

import { AxiosError } from 'axios';
import { DateTime } from 'luxon';
import { FocusEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Searchbar from '../../components/common/SearchBarComponent/SearchBar.component';
import TitleBreadcrumb from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.component';
import AlertBar from '../../components/AlertBar/AlertBar';
import { useAlertStore } from '../../hooks/useAlertStore';
import { TitleBreadcrumbProps } from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.interface';
import ResizablePanels from '../../components/common/ResizablePanels/ResizablePanels';
import ServiceDocPanel from '../../components/common/ServiceDocPanel/ServiceDocPanel';
import { SearchIndex } from '../../enums/search.enum';
import searchClassBase from '../../utils/SearchClassBase';
import { searchData } from '../../rest/miscAPI';
import { getTextFromHtmlString } from '../../utils/BlockEditorUtils';
import { showErrorToast, showSuccessToast } from '../../utils/ToastUtils';
import {
  PriorityLevel,
} from './CreateDataAccessRequestPage.interface';
import { ROUTES } from '../../constants/constants'; 

const MIN_PURPOSE_LENGTH = 10;
const MAX_PURPOSE_LENGTH = 500;
const MIN_ACCESS_DAYS = 1;
const MAX_ACCESS_DAYS = 365;

const CreateDataAccessRequestPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { alert } = useAlertStore();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string>('');
  const [selectedDataAsset, setSelectedDataAsset] = useState<
    any | undefined
  >();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [purposeCharCount, setPurposeCharCount] = useState<number>(0);

  const [editorResetKey, setEditorResetKey] = useState<number>(0);

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

  const handleFieldFocus = useCallback((event: FocusEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const isDescription = target.classList.contains('ProseMirror');
    
    if (isDescription) {
      let parent = target.parentElement;
      let depth = 0;
      const maxDepth = 10;
      
      while (parent && depth < maxDepth) {
        const testId = parent.getAttribute('data-testid');
        
        if (testId === 'purpose' || testId === 'notes') {
          setActiveField(`root/${testId}`);
          return;
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
  }, []);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const [purposeHtml, setPurposeHtml] = useState<string>('');
  const [purposeText, setPurposeText] = useState<string>('');
  const purposeDraftRef = useRef<string>('');
  const [purposeInitialValue, setPurposeInitialValue] = useState<string>('');
  
  const [notesHtml, setNotesHtml] = useState<string>('');
  const notesDraftRef = useRef<string>('');
  const [notesInitialValue, setNotesInitialValue] = useState<string>('');
  
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>(PriorityLevel.NORMAL);

  const [purposeError, setPurposeError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [dataAssetError, setDataAssetError] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | null>(null);

  useEffect(() => {
    setPriority(PriorityLevel.NORMAL);
  }, []);

  const validatePurpose = useCallback((html: string) => {
    const text = getTextFromHtmlString(html);
    if (!text || text.length === 0) {
      return t('message.field-text-is-required', { fieldText: t('label.purpose') });
    }
    if (text.length < MIN_PURPOSE_LENGTH) {
      return t('message.minimum-length-field', { field: t('label.purpose'), length: MIN_PURPOSE_LENGTH });
    }
    if (text.length > MAX_PURPOSE_LENGTH) {
      return t('message.maximum-length-field', { field: t('label.purpose'), length: MAX_PURPOSE_LENGTH });
    }
    return null;
  }, [t]);

  const validateDates = useCallback((s: string | null, e: string | null) => {
    if (!s || !e) {
      return t('message.field-text-is-required', { fieldText: t('label.access-duration') });
    }

    const start = DateTime.fromISO(s);
    const end = DateTime.fromISO(e);
    const diffInDays = end.diff(start, 'days').days;

    if (diffInDays < MIN_ACCESS_DAYS) {
      return t('message.minimum-duration-error', { min: MIN_ACCESS_DAYS });
    }

    if (diffInDays > MAX_ACCESS_DAYS) {
      return t('message.maximum-duration-error', { max: MAX_ACCESS_DAYS });
    }

    return null;
  }, [t]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      let hasError = false;

      if (!selectedDataAsset) {
        setDataAssetError(t('message.field-text-is-required', { fieldText: t('label.data-asset') }));
        hasError = true;
      } else {
        setDataAssetError(null);
      }

      const pError = validatePurpose(purposeHtml);
      setPurposeError(pError);
      if (pError) hasError = true;

      const dError = validateDates(startDate, endDate);
      setDurationError(dError);
      if (dError) hasError = true;

      if (!priority) {
        setPriorityError(t('message.field-text-is-required', { fieldText: t('label.priority') }));
        hasError = true;
      } else {
        setPriorityError(null);
      }

      if (hasError) return;

      setIsSubmitting(true);

      const finalNotes = notesDraftRef.current ?? notesHtml ?? notesInitialValue ?? null;

      const payload = {
        dataAssetFQN: selectedDataAsset!.fullyQualifiedName || selectedDataAsset!.name,
        purposeHtml: purposeHtml || '',
        notesHtml: finalNotes,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        priority: priority,
        attachmentDocumentIds: [],
      };

      createDataAccessRequest(payload)
        .then(() => {
          showSuccessToast(t('server.create-entity-success', { entity: t('label.data-access-request') }));

          // Reset Logic
          purposeDraftRef.current = '';
          notesDraftRef.current = '';

          setPurposeHtml('');
          setPurposeText('');
          setPurposeInitialValue('');
          
          setNotesHtml('');
          setNotesInitialValue('');

          setStartDate(null);
          setEndDate(null);
          setPriority(PriorityLevel.NORMAL);
          setSelectedDataAsset(undefined);
          setSearchResults([]);
          setSearchValue('');
          setPurposeCharCount(0);
          
          setEditorResetKey((prev) => prev + 1);
        })
        .catch((err: AxiosError) => {
          showErrorToast(err);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    },
    [selectedDataAsset, purposeHtml, notesHtml, startDate, endDate, priority, t, navigate, validatePurpose, validateDates]
  );

  const firstPanelChildren = (
    <>
      <TitleBreadcrumb titleLinks={breadcrumbs} />
      {alert && (
        <div data-testid="page-alert" style={{ marginBottom: 12 }}>
          <AlertBar message={alert.message} type={alert.type} />
        </div>
      )}
      <MuiTypography
        variant="h6"
        className="m-t-md"
        data-testid="form-heading"
        gutterBottom>
        {t('label.create-entity', { entity: t('label.data-access-request') })}
      </MuiTypography>
      <div data-testid="add-data-access-request" onFocusCapture={handleFieldFocus}>
        <form onSubmit={handleSubmit}>
          <Box mb={3} onClick={() => setActiveField('root/dataAsset')}>
            {selectedDataAsset ? (
              <Card className="m-b-xs" size="small">
                <Box display="flex" flexDirection="column">
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <MuiTypography fontWeight={600}>
                        {selectedDataAsset.displayName || selectedDataAsset.name}
                      </MuiTypography>
                      <MuiTypography variant="body2" color="text.secondary">
                        {selectedDataAsset.fullyQualifiedName}
                      </MuiTypography>
                    </Box>
                    <MuiButton color="error" size="small" onClick={handleDataAssetClear}>
                      {t('label.clear')}
                    </MuiButton>
                  </Box>
                  {selectedDataAsset.description && (
                    <MuiTypography variant="body2" color="text.secondary" mt={1}>
                      {selectedDataAsset.description}
                    </MuiTypography>
                  )}
                </Box>
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
                    <Box display="flex" flexDirection="column">
                      {searchResults.map((hit) => {
                        const source = hit._source;
                        const entityType = source.entityType || source.serviceType || 'Asset';
                        const entityIcon = searchClassBase.getEntityIcon(source.entityType ?? '');
                        return (
                          <div
                            key={hit._id || source.id}
                            className="cursor-pointer hover-cell-icon"
                            style={{ padding: '8px', borderRadius: '4px' }}
                            onClick={() => {
                              setSelectedDataAsset(source);
                              setSearchResults([]);
                              setSearchValue('');
                            }}>
                            <Box display="flex">
                              {entityIcon && (
                                <span className="w-6 h-6 m-r-xs d-inline-flex text-xl align-middle" style={{ color: 'inherit' }}>
                                  {entityIcon}
                                </span>
                              )}
                              <Box ml={1}>
                                <MuiTypography fontWeight={600}>{source.displayName || source.name}</MuiTypography>
                                <MuiTypography variant="body2" color="text.secondary">({entityType})</MuiTypography>
                                <MuiTypography variant="body2" color="text.secondary">{source.fullyQualifiedName}</MuiTypography>
                              </Box>
                            </Box>
                          </div>
                        );
                      })}
                    </Box>
                  </Card>
                )}
                {dataAssetError && <FormHelperText error>{dataAssetError}</FormHelperText>}
              </div>
            )}
          </Box>

          <Box mb={3} onClick={() => setActiveField('root/purpose')} onBlurCapture={() => {
              const val = purposeDraftRef.current ?? purposeHtml ?? purposeInitialValue ?? '';
              setPurposeHtml(val);
              setPurposeInitialValue(val);
              const text = getTextFromHtmlString(val);
              setPurposeText(text);
              setPurposeCharCount(text.length);
              setPurposeError(validatePurpose(val));
            }} tabIndex={-1}>
            <MuiTypography variant="subtitle1" gutterBottom>{t('label.purpose')}</MuiTypography>
            
            <RichTextEditor
              key={`purpose-editor-${editorResetKey}`}
              data-testid="purpose"
              initialValue={purposeInitialValue}
              placeHolder={t('message.enter-purpose-placeholder')}
              onTextChange={(val: string) => {
                purposeDraftRef.current = val;
                const text = getTextFromHtmlString(val);
                setPurposeText(text);
                setPurposeCharCount(text.length);
                setPurposeError(validatePurpose(val));
              }}
            />
            <Box mt={1} display="flex" justifyContent="flex-start">
              <MuiTypography variant="caption" color="text.secondary">{purposeCharCount} / {MAX_PURPOSE_LENGTH}</MuiTypography>
            </Box>
            {purposeError && <FormHelperText error>{purposeError}</FormHelperText>}
          </Box>

          <Box mb={3} onClick={() => setActiveField('root/accessDuration')}>
            <MuiTypography variant="subtitle1" gutterBottom>{t('label.access-duration')}</MuiTypography>
            <Box display="flex" gap={2}>
              <TextField
                label={t('label.start-date')}
                type="date"
                value={startDate ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val && endDate) {
                    setDurationError(validateDates(val, endDate));
                  } else {
                    setDurationError(null);
                  }
                }}
                onBlur={() => {
                  if (startDate && endDate) setDurationError(validateDates(startDate, endDate));
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: DateTime.now().toISODate() }}
                fullWidth
                data-testid="start-date"
              />
              <TextField
                label={t('label.end-date')}
                type="date"
                value={endDate ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  if (startDate && val) {
                    setDurationError(validateDates(startDate, val));
                  } else {
                    setDurationError(null);
                  }
                }}
                onBlur={() => {
                  if (startDate && endDate) setDurationError(validateDates(startDate, endDate));
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: startDate ?? DateTime.now().toISODate() }}
                fullWidth
                data-testid="end-date"
              />
            </Box>
            <MuiTypography variant="caption" color="text.secondary" mt={1} display="block">
              {t('message.access-duration-range-info', { min: MIN_ACCESS_DAYS, max: MAX_ACCESS_DAYS })}
            </MuiTypography>
            {durationError && <FormHelperText error>{durationError}</FormHelperText>}
          </Box>

          <Box mb={3} onClick={() => setActiveField('root/priority')}>
            <MUISelect
              id="priority-select"
              label={t('label.priority')}
              value={priority}
              options={priorityOptions.map((o) => ({ label: o.label, value: o.value }))}
              placeholder={t('label.select-field', { field: t('label.priority') })}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <MuiTypography sx={{ color: 'text.secondary' }}>
                      {t('label.select-field', { field: t('label.priority') })}
                    </MuiTypography>
                  );
                }
                const found = priorityOptions.find(
                  (o) => String(o.value).toLowerCase() === String(selected).toLowerCase()
                );
                if (found) {
                  return found.label;
                }
                const s = String(selected);
                return s.charAt(0).toUpperCase() + s.slice(1);
              }}
              onFocus={() => setActiveField('root/priority')}
              onOpen={() => setActiveField('root/priority')}
              onChange={(e) => { setPriority(e.target.value as string); setPriorityError(null); setActiveField('root/priority'); }}
            />
            {priorityError && <FormHelperText error>{priorityError}</FormHelperText>}
          </Box>

          <Box mb={5} onClick={() => setActiveField('root/notes')} onBlurCapture={() => {
              const val = notesDraftRef.current ?? notesHtml ?? notesInitialValue ?? '';
              setNotesHtml(val);
              setNotesInitialValue(val);
            }} tabIndex={-1}>
            <MuiTypography variant="subtitle1" gutterBottom>{t('label.note-plural')}</MuiTypography>
            
            <RichTextEditor
              key={`notes-editor-${editorResetKey}`}
              data-testid="notes"
              initialValue={notesInitialValue}
              placeHolder={t('message.enter-notes-placeholder')}
              onTextChange={(val: string) => {
                notesDraftRef.current = val;
              }}
            />
          </Box>

          <Box display="flex" justifyContent="flex-end" data-testid="cta-buttons" sx={{ mt: 3 }}>
            <MuiButton data-testid="cancel-button" variant="text" onClick={handleCancel}>{t('label.cancel')}</MuiButton>
            <MuiButton data-testid="submit-button" type="submit" variant="contained" color="primary" disabled={isSubmitting} sx={{ ml: 2 }}>{t('label.submit')}</MuiButton>
          </Box>
        </form>
      </div>
    </>
  );

  const secondPanelChildren = (
    <div data-testid="right-panel">
      <MuiTypography variant="h6" gutterBottom>
        {t('label.configure-entity', {
          entity: t('label.data-access-request'),
        })}
      </MuiTypography>
      <MuiTypography variant="body2" className="mb-5">
        {t('message.data-access-request-description')}
      </MuiTypography>
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
        cardClassName: 'm-x-auto max-w-lg',
        allowScroll: true,
        children: firstPanelChildren,
        minWidth: 800,
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