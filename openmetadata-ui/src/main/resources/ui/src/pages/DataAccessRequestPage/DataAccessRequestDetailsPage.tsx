import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDataAccessRequestById } from '../../rest/dataAccessRequestAPI';
import {
  Typography as MuiTypography,
  Button as MuiButton,
  CircularProgress,
  Divider,
  Chip,
  Box,
  Alert,
  Snackbar,
  IconButton,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatDateTime, getRelativeTime } from '../../utils/date-time/DateTimeUtils';
import { DateTime } from 'luxon';

const DataAccessRequestDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (id) fetchRequest(id);
  }, [id]);

  const fetchRequest = async (rid: string) => {
    if (fetchedRef.current[rid]) return;
    fetchedRef.current[rid] = true;
    setLoading(true);
    setError(null);

    try {
      const data = await getDataAccessRequestById(rid);
      setRequest(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load request');
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const copyId = async () => {
    if (!request?.id) return;
    try {
      await navigator.clipboard.writeText(request.id);
      setSnackbarOpen(true);
    } catch {
      // ignore
    }
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleApprove = () => {
    navigate(-1);
  };

  const formatLocalDate = (val?: any) => {
    if (val === undefined || val === null || val === '') return '-';

    // Handle array format: [year, month, day]
    if (Array.isArray(val) && val.length >= 3) {
      const year = Number(val[0]);
      const month = Number(val[1]);
      const day = Number(val[2]);
      const dt = DateTime.fromObject({ year, month, day });
      return dt.isValid ? dt.toLocaleString(DateTime.DATE_MED) : '-';
    }

    // Handle object format: { year, month, day }
    if (typeof val === 'object' && val.year && val.month && val.day) {
      const dt = DateTime.fromObject({ year: Number(val.year), month: Number(val.month), day: Number(val.day) });
      return dt.isValid ? dt.toLocaleString(DateTime.DATE_MED) : '-';
    }

    try {
      const dt = typeof val === 'number' ? DateTime.fromMillis(val) : DateTime.fromISO(String(val));
      return dt.isValid ? dt.toLocaleString(DateTime.DATE_MED) : '-';
    } catch {
      return '-';
    }
  };

  const formatTimestamp = (val?: string | number) => {
    if (val === undefined || val === null || val === '') return '-';

    // If it's a number or numeric string, treat as epoch millis
    const num = typeof val === 'number' ? val : Number(val);
    if (!Number.isNaN(num) && String(val).length >= 5) {
      return formatDateTime(num);
    }

    // Try ISO datetime
    const iso = DateTime.fromISO(String(val));
    if (iso.isValid) return iso.toLocaleString(DateTime.DATETIME_MED);

    return '-';
  };

  const getRelativeFromValue = (val?: string | number) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'number' ? val : Number(val);
    if (!Number.isNaN(num) && String(val).length >= 5) return getRelativeTime(num);
    const iso = DateTime.fromISO(String(val));
    return iso.isValid ? iso.toRelative() ?? '' : '';
  };

  const priorityColor = (p?: string) => {
    switch ((p || '').toLowerCase()) {
      case 'high': return 'error';
      case 'low': return 'info';
      case 'normal': default: return 'primary';
    }
  };

  const labelStyle = { fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' };
  const valueBoxStyle = { 
    p: 1.5, 
    borderRadius: 1, 
    border: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.paper',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center'
  };

  const relativeCreatedAt = request ? getRelativeFromValue(request.createdAt) : '';

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      {/* Üst Başlık ve Butonlar */}
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <MuiTypography variant="h5" sx={{ fontWeight: 700 }}>
            {t('label.data-access-request')}
          </MuiTypography>
          <MuiTypography variant="body2" color="text.secondary">
            Manage and review data access requests
          </MuiTypography>
        </Box>

        <Box>
          <MuiButton variant="contained" color="primary" sx={{ mr: 1 }} onClick={handleApprove}>
            {t('label.approve')}
          </MuiButton>
          <MuiButton variant="outlined" color="inherit" onClick={() => navigate(-1)}>
            {t('label.back') || t('label.cancel')}
          </MuiButton>
        </Box>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && request && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 48%', minWidth: 240 }}>
              <MuiTypography variant="caption" sx={labelStyle}>ID</MuiTypography>
              <Box sx={{ ...valueBoxStyle, justifyContent: 'space-between' }}>
                <MuiTypography variant="body2" sx={{ fontFamily: 'monospace' }}>{request.id}</MuiTypography>
                <IconButton size="small" onClick={copyId}><ContentCopyIcon fontSize="small" /></IconButton>
              </Box>
            </Box>

            <Box sx={{ flex: '1 1 48%', minWidth: 240 }}>
              <MuiTypography variant="caption" sx={labelStyle}>{t('label.data-asset')}</MuiTypography>
              <Box sx={valueBoxStyle}><MuiTypography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{request.dataAssetFQN}</MuiTypography></Box>
            </Box>

            <Box sx={{ flex: '1 1 30%', minWidth: 180 }}>
              <MuiTypography variant="caption" sx={labelStyle}>{t('label.priority')}</MuiTypography>
              <Chip label={request.priority ?? '-'} color={priorityColor(request.priority)} size="small" />
            </Box>

            <Box sx={{ flex: '1 1 30%', minWidth: 180 }}>
              <MuiTypography variant="caption" sx={labelStyle}>{t('label.created-by')}</MuiTypography>
              <div>{request.createdBy ?? '-'}</div>
            </Box>

            <Box sx={{ flex: '1 1 30%', minWidth: 180 }}>
              <MuiTypography variant="caption" sx={labelStyle}>{t('label.created-at')}</MuiTypography>
              <MuiTypography variant="body2">
                {formatTimestamp(request.createdAt)}
                {relativeCreatedAt ? (
                  <MuiTypography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({relativeCreatedAt})
                  </MuiTypography>
                ) : null}
              </MuiTypography>
            </Box>

            <Box sx={{ flex: '1 1 48%', minWidth: 240 }}>
              <MuiTypography variant="caption" sx={labelStyle}>{t('label.start-date')}</MuiTypography>
              <Box sx={valueBoxStyle}>{formatLocalDate(request.startDate)}</Box>
            </Box>

            <Box sx={{ flex: '1 1 48%', minWidth: 240 }}>
              <MuiTypography variant="caption" sx={labelStyle}>{t('label.end-date')}</MuiTypography>
              <Box sx={valueBoxStyle}>{formatLocalDate(request.endDate)}</Box>
            </Box>

            <Box sx={{ flex: '1 1 100%' }}>
              <Divider sx={{ my: 1 }} />
              <MuiTypography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{t('label.purpose')}</MuiTypography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                {request.purposeHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: request.purposeHtml }} />
                ) : (
                  <MuiTypography variant="body2">{request.purposeText || '-'}</MuiTypography>
                )}
              </Box>
            </Box>

            <Box sx={{ flex: '1 1 100%' }}>
              <Divider sx={{ my: 1 }} />
              <MuiTypography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{t('label.note-plural')}</MuiTypography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                {request.notesHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: request.notesHtml }} />
                ) : (
                  <MuiTypography variant="body2">{request.notesText || '-'}</MuiTypography>
                )}
              </Box>
            </Box>

          </Box>
        </Paper>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={t('message.copied-to-clipboard') || 'Copied to clipboard'}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default DataAccessRequestDetailsPage;

