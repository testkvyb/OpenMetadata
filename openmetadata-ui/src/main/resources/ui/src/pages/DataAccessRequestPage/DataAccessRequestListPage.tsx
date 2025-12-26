import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listDataAccessRequests } from '../../rest/dataAccessRequestAPI';
import { ROUTES } from '../../constants/constants';
import { formatDateTime } from '../../utils/date-time/DateTimeUtils';
import {
  Paper,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button as MuiButton,
  Typography as MuiTypography,
  Stack as MuiStack,
  CircularProgress,
  Box,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const DataAccessRequestListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await listDataAccessRequests({ limit: 50, offset: 0 });
      setData(res.data || []);
    } catch (err) {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  const truncateStyle = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block', 
    width: '100%',    
  };

  return (
    <Paper sx={{ padding: 2, width: '100%', overflow: 'hidden' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 4, mt: 2 }}>
        <MuiTypography variant="h5">
          {t('label.data-access-request-plural')}
        </MuiTypography>

        <MuiButton variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => navigate(ROUTES.SUBMIT_DATA_ACCESS_REQUEST)}>
          {t('label.create-data-access-request')}
        </MuiButton>
      </Box>

      {loading ? (
        <MuiStack alignItems="center">
          <CircularProgress />
        </MuiStack>
      ) : (
        <TableContainer>
          <MuiTable sx={{ tableLayout: 'fixed', minWidth: 650 }}> 
            <TableHead>
              <TableRow>
                <TableCell width="10%">{t('label.data-access-request-id')}</TableCell>
                <TableCell width="20%">{t('label.data-asset')}</TableCell>
                <TableCell width="25%">{t('label.purpose')}</TableCell>
                <TableCell width="10%">{t('label.priority')}</TableCell>
                <TableCell width="12%">{t('label.created-by')}</TableCell>
                <TableCell width="10%">{t('label.created-at')}</TableCell>
                <TableCell width="13%">{t('label.data-access-request-action-plural')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} hover>
                  
                  {/* ID Column */}
                  <TableCell>
                    <Tooltip title={row.id} placement="top">
                      <Box component="span" sx={truncateStyle}>
                        {row.id}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* Asset Column */}
                  <TableCell>
                    <Tooltip title={row.dataAssetFQN} placement="top">
                      <Box component="code" sx={{ ...truncateStyle, fontFamily: 'monospace' }}>
                        {row.dataAssetFQN}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Tooltip title={row.purposeText || ''} placement="top">
                      <Box component="span" sx={truncateStyle}>
                        {row.purposeText || '-'}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    {row.priority}
                  </TableCell>

                  {/* Created By */}
                  <TableCell>
                     <Tooltip title={row.createdBy} placement="top">
                      <Box component="span" sx={truncateStyle}>
                        {row.createdBy}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* Created At */}
                  <TableCell>
                     <MuiTypography variant="body2" noWrap>
                        {row.createdAt ? formatDateTime(Number(row.createdAt)) : ''}
                     </MuiTypography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <MuiStack direction="row" spacing={1}>
                      <MuiButton 
                        size="small" 
                        variant="outlined" 
                        onClick={() => navigate(ROUTES.DATA_ACCESS_REQUEST_DETAILS.replace(':id', row.id))}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        {t('label.view')}
                      </MuiButton>
                      <MuiButton 
                        size="small" 
                        color="success" 
                        variant="contained" 
                        onClick={() => navigate(ROUTES.DATA_ACCESS_REQUEST_DETAILS.replace(':id', row.id))} 
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        {t('label.approve')}
                      </MuiButton>
                    </MuiStack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
    </Paper>
  );
};

export default DataAccessRequestListPage;