import React from 'react';
import PropTypes from 'prop-types';

import { debounce } from 'lodash';

import { makeStyles } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Typography from '@material-ui/core/Typography';
import InfoIcon from '@material-ui/icons/Info';
import QuoteIcon from '@material-ui/icons/FormatQuote';
import CopyIcon from '@material-ui/icons/Assignment';
import FileIcon from '@material-ui/icons/Description';
import SelectAllIcon from '@material-ui/icons/DoneAll';
import SelectNoneIcon from '@material-ui/icons/Clear';
import SelectFilteredIcon from '@material-ui/icons/FilterList';
import ClearFiltersIcon from '@material-ui/icons/DeleteSweep';
import ClickIcon from '@material-ui/icons/TouchApp';
import ErrorIcon from '@material-ui/icons/ReportProblem';
import ExploreIcon from '@material-ui/icons/Explore';

import { CopyToClipboard } from 'react-copy-to-clipboard';

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import moment from 'moment';

import MaterialTable, { MTableToolbar, MTableFilterRow } from 'material-table';

import DownloadDataContext from '../DownloadDataContext/DownloadDataContext';
import DataProductAvailability from '../DataProductAvailability/DataProductAvailability';
import ExternalHost from '../ExternalHost/ExternalHost';
import ExternalHostProductSpecificLinks from '../ExternalHostProductSpecificLinks/ExternalHostProductSpecificLinks';
import SiteChip from '../SiteChip/SiteChip';
import Theme, { COLORS } from '../Theme/Theme';

import {
  formatBytes,
  AOP_THRESHOLD_POST_BODY_SIZE,
  AOP_THRESHOLD_HARD_DRIVE_WARN,
} from '../../util/manifestUtil';

const useStyles = makeStyles(theme => ({
  copyButton: {
    marginLeft: Theme.spacing(2),
    padding: Theme.spacing(0.5, 2),
    backgroundColor: '#fff',
  },
  fileTable: {
    position: 'relative',
    '& td': {
      whiteSpace: 'nowrap',
    },
    '& label + .MuiInput-formControl': {
      marginTop: '0px',
    },
  },
  formControlBold: {
    '& span': {
      fontWeight: 600,
    },
  },
  loadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    top: 0,
    left: 0,
    zIndex: 10,
    paddingTop: theme.spacing(14),
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  infoSnackbar: {
    backgroundColor: theme.palette.grey[50],
    color: '#000',
    border: `1px solid ${theme.palette.primary.main}80`,
  },
  infoSnackbarIcon: {
    color: theme.palette.grey[300],
    marginRight: theme.spacing(2),
  },
  radio: {
    marginBottom: theme.spacing(1),
  },
  radioLabel: {
    marginTop: theme.spacing(1.5),
  },
  showColumnsLabel: {
    backgroundColor: theme.palette.grey[50],
    '& span': {
      color: '#000',
    },
  },
  startFlex: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  stepSummary: {
    marginBottom: theme.spacing(3),
  },
  stepSummaryHeader: {
    userSelect: 'none',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  stepSummaryContent: {
    marginLeft: theme.spacing(4.25),
  },
  summaryChip: {
    cursor: 'pointer',
    marginTop: theme.spacing(0.25),
    marginRight: theme.spacing(1),
    fontSize: '1rem',
    fontWeight: 600,
    height: theme.spacing(3),
    '& span': {
      padding: theme.spacing(0, 1),
    },
  },
  summaryText: {
    fontSize: '1.2rem',
  },
  summaryTextIncomplete: {
    fontSize: '1.2rem',
    fontStyle: 'italic',
    color: theme.palette.error.main,
  },
}));

const dataUsageAndCitationPoliciesLink = ExternalHost.renderExternalLink(
  'https://www.neonscience.org/data/about-data/data-policies',
  'Data Usage and Citation Policies',
  'NEON',
);

export default function DownloadStepForm(props) {
  const classes = useStyles(Theme);

  const {
    stepKey,
    changeToStep,
    changeToNextUncompletedStep,
    renderDownloadButton,
  } = props;
  const [state, dispatch] = DownloadDataContext.useDownloadDataState();

  const setState = (stateKey, newValue) => dispatch({
    type: 'setValidatableValue',
    key: stateKey,
    value: newValue,
  });

  const renderStepSummary = {
    sitesAndDateRange: () => {
      const { value: sites } = state.sites;
      const { value: dateRange } = state.dateRange;
      const sitesPlural = sites.length > 1 ? 's' : '';
      const getYearMonthMoment = yearMonth => moment(`${yearMonth}-01`);
      const humanDateRange = `${getYearMonthMoment(dateRange[0]).format('MMM YYYY')} - ${getYearMonthMoment(dateRange[1]).format('MMM YYYY')}`;
      const siteChipLabel = `${sites.length} site${sitesPlural} — ${humanDateRange}`;
      return (
        <SiteChip size="large" variant="default" label={siteChipLabel} />
      );
    },
    documentation: () => {
      const { value: documentation } = state.documentation;
      return (
        <Typography variant="body2" className={classes.summaryText}>
          {`${documentation.charAt(0).toUpperCase()}${documentation.substring(1)}`}
        </Typography>
      );
    },
    packageType: () => {
      const { value: packageType } = state.packageType;
      return (
        <Typography variant="body2" className={classes.summaryText}>
          {`${packageType.charAt(0).toUpperCase()}${packageType.substring(1)}`}
        </Typography>
      );
    },
    s3Files: () => {
      const { value: files, totalSize } = state.s3Files;
      return (
        <Typography variant="body2" className={classes.summaryText}>
          {`${files.length} file${files.length === 1 ? '' : 's'} (${formatBytes(totalSize)} uncompressed)`}
        </Typography>
      );
    },
  };

  const renderStepForm = {
    /**
       SITES AND DATE RANGE
    */
    sitesAndDateRange: () => (
      <div>
        <DataProductAvailability
          data-selenium="download-data-dialog.step-form.sites-and-date-range"
          view="states"
          disableSelectionCollapse
        />
        <SnackbarContent
          className={classes.infoSnackbar}
          style={{ marginTop: Theme.spacing(2), marginBottom: Theme.spacing(1), justifyContent: 'center' }}
          message={(
            <div className={classes.startFlex}>
              <ClickIcon fontSize="large" className={classes.infoSnackbarIcon} />
              <div>
                <Typography variant="body1" component="div">
                  <ul style={{ margin: 0, paddingLeft: Theme.spacing(2.5) }}>
                    <li>Click on rows in the grid above to select individual sites or states</li>
                    <li>Click and drag the grid to pan across time</li>
                    <li>Click and drag the sides of the selection to change the date range</li>
                  </ul>
                </Typography>
              </div>
            </div>
          )}
        />
      </div>
    ),

    /**
       DOCUMENTATION
    */
    documentation: () => {
      const neonFaqLink = ExternalHost.renderExternalLink(
        'http://data.neonscience.org/faq',
        'NEON FAQ',
        'NEON',
      );
      const knbLink = ExternalHost.renderExternalLink(
        'https://eml.ecoinformatics.org/',
        'KNB',
        'KNB',
      );
      const { value, validValues } = state.documentation;
      return (
        <Grid
          container
          spacing={2}
          alignItems="flex-start"
          data-selenium="download-data-dialog.step-form.documentation"
        >
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="Documentation"
                name="documentation"
                value={value || ''}
                onChange={(e) => {
                  setState('documentation', e.target.value);
                  changeToNextUncompletedStep();
                }}
              >
                <FormControlLabel
                  className={classes.radio}
                  value={validValues[0]}
                  control={<Radio />}
                  label={(
                    <div className={classes.radioLabel}>
                      <Typography variant="h6">Include</Typography>
                      <Typography variant="body2">
                        Include relevant documents for this Data Product
                      </Typography>
                    </div>
                  )}
                />
                <FormControlLabel
                  className={classes.radio}
                  value={validValues[1]}
                  control={<Radio />}
                  label={(
                    <div className={classes.radioLabel}>
                      <Typography variant="h6">Exclude</Typography>
                      <Typography variant="body2">
                        Data only, no relevant documents for this Data Product
                      </Typography>
                    </div>
                  )}
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <SnackbarContent
              className={classes.infoSnackbar}
              style={{ marginTop: Theme.spacing(1.5) }}
              message={(
                <div className={classes.startFlex}>
                  <InfoIcon fontSize="large" className={classes.infoSnackbarIcon} />
                  <div>
                    <Typography variant="body1">
                      {/* eslint-disable react/jsx-one-expression-per-line */}
                      EML files for this Data Product are included in all downloads.
                      Learn more about EML files in the {neonFaqLink} and at {knbLink}.
                      {/* eslint-enable react/jsx-one-expression-per-line */}
                    </Typography>
                  </div>
                </div>
              )}
            />
          </Grid>
        </Grid>
      );
    },

    /**
       S3 Files
    */
    s3Files: () => {
      const { s3FileFetches, s3FileFetchProgress } = state;
      const isLoading = Object.keys(s3FileFetches)
        .some(key => ['awaitingFetchCall', 'fetching'].includes(s3FileFetches[key]));
      const {
        value: selection,
        validValues,
        valueLookups,
        totalSize,
        estimatedPostSize,
        filters,
        filteredFileCount,
        visibleColumns,
      } = state.s3Files;
      const columns = [
        {
          title: 'Site',
          field: 'site',
          lookup: valueLookups.site,
          defaultFilter: filters.site || [],
          hidden: !visibleColumns.includes('site'),
        },
        {
          title: 'Date',
          field: 'yearMonth',
          lookup: valueLookups.yearMonth,
          defaultFilter: filters.yearMonth || [],
          hidden: !visibleColumns.includes('date'),
        },
        {
          title: 'Visit',
          field: 'visit',
          lookup: valueLookups.visit,
          defaultFilter: filters.visit || [],
          hidden: !visibleColumns.includes('visit'),
        },
        {
          title: 'Name',
          field: 'name',
          defaultFilter: filters.name || '',
          hidden: !visibleColumns.includes('name'),
        },
        {
          title: 'Type',
          field: 'type',
          lookup: valueLookups.type,
          defaultFilter: filters.type || [],
          hidden: !visibleColumns.includes('type'),
        },
        {
          title: 'Size',
          field: 'size',
          filtering: false,
          removable: false,
          render: row => formatBytes(row.size),
        },
      ];
      const aopHardDriveLink = ExternalHost.renderExternalLink(
        'https://www.neonscience.org/data-collection/airborne-remote-sensing/aop-data-hard-drive-request',
        'AOP Data to Hard Drive Request',
        'NEON',
      );
      const debouncedFilterDispatch = debounce((filter, value) => {
        dispatch({ type: 'setS3FilesFilterValue', filter, value });
      }, 200);
      const noFiltersApplied = Object.keys(filters).every(col => !filters[col].length);
      /* eslint-disable react/jsx-one-expression-per-line */
      const postSizeError = (estimatedPostSize >= AOP_THRESHOLD_POST_BODY_SIZE) ? (
        <Grid item xs={12}>
          <SnackbarContent
            className={classes.infoSnackbar}
            style={{ marginBottom: Theme.spacing(2), backgroundColor: COLORS.ORANGE[100], justifyContent: 'center' }}
            message={(
              <div className={classes.startFlex}>
                <ErrorIcon
                  fontSize="large"
                  className={classes.infoSnackbarIcon}
                  style={{ color: COLORS.ORANGE[800] }}
                />
                <div>
                  <Typography variant="body1">
                    Too many files requested! Current selection will make an
                    estimated <b>{formatBytes(estimatedPostSize)}</b> request; max
                    size is <b>{formatBytes(AOP_THRESHOLD_POST_BODY_SIZE)}</b>.
                    Please select fewer files in order to proceed.
                  </Typography>
                </div>
              </div>
            )}
          />
        </Grid>
      ) : null;
      const downloadSizeWarning = (!postSizeError && totalSize > AOP_THRESHOLD_HARD_DRIVE_WARN) ? (
        <Grid item xs={12}>
          <SnackbarContent
            className={classes.infoSnackbar}
            style={{ marginBottom: Theme.spacing(2) }}
            message={(
              <div className={classes.startFlex}>
                <InfoIcon fontSize="small" className={classes.infoSnackbarIcon} />
                <div>
                  <Typography variant="body2">
                    This will be a large download. An alternate way to obtain
                    lots of data is to submit an {aopHardDriveLink}.
                  </Typography>
                </div>
              </div>
            )}
          />
        </Grid>
      ) : null;
      const components = {
        Container: Box,
        Toolbar: toolbarProps => (
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={6}>
              <div style={{ marginBottom: Theme.spacing(1) }}>
                <ToggleButtonGroup
                  size="small"
                  value={visibleColumns}
                  onChange={(event, newVisibleColumns) => dispatch({
                    type: 'setS3FilesVisibleColumns',
                    visibleColumns: newVisibleColumns,
                  })}
                  aria-label="show and hide columns"
                  data-selenium="download-data-dialog.s3-files.show-hide-columns-button-group"
                >
                  <ToggleButton value="label" className={classes.showColumnsLabel} disabled>
                    Show Columns:
                  </ToggleButton>
                  <ToggleButton value="site">
                    Site
                  </ToggleButton>
                  <ToggleButton value="visit">
                    Visit
                  </ToggleButton>
                  <ToggleButton value="date">
                    Date
                  </ToggleButton>
                  <ToggleButton value="name">
                    Name
                  </ToggleButton>
                  <ToggleButton value="type">
                    Type
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>
              <div style={{ marginBottom: Theme.spacing(1) }}>
                <Button
                  data-selenium="download-data-dialog.s3-files.select-all-button"
                  size="small"
                  color="primary"
                  variant="outlined"
                  onClick={() => { dispatch({ type: 'setS3FilesValueSelectAll' }); }}
                  disabled={isLoading || !validValues.length}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <SelectAllIcon fontSize="small" style={{ marginRight: Theme.spacing(1) }} />
                  Select All ({isLoading ? '…' : validValues.length})
                </Button>
                <Button
                  data-selenium="download-data-dialog.s3-files.select-none-button"
                  size="small"
                  color="primary"
                  variant="outlined"
                  onClick={() => { dispatch({ type: 'setS3FilesValueSelectNone' }); }}
                  disabled={isLoading || !validValues.length}
                  style={{ marginLeft: Theme.spacing(1), whiteSpace: 'nowrap' }}
                >
                  <SelectNoneIcon fontSize="small" style={{ marginRight: Theme.spacing(1) }} />
                  Select None
                </Button>
              </div>
              <div>
                <Button
                  data-selenium="download-data-dialog.s3-files.select-filtered-button"
                  size="small"
                  color="primary"
                  variant="outlined"
                  onClick={() => { dispatch({ type: 'setS3FilesValueSelectFiltered' }); }}
                  disabled={noFiltersApplied || isLoading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <SelectFilteredIcon fontSize="small" style={{ marginRight: Theme.spacing(1) }} />
                  Select Filtered{noFiltersApplied ? '' : ` (${isLoading ? '…' : filteredFileCount})`}
                </Button>
                <Button
                  data-selenium="download-data-dialog.s3-files.clear-filters-button"
                  size="small"
                  color="primary"
                  variant="outlined"
                  disabled={noFiltersApplied || isLoading}
                  onClick={() => { dispatch({ type: 'clearS3FilesFilterValues' }); }}
                  style={{ marginLeft: Theme.spacing(1), whiteSpace: 'nowrap' }}
                >
                  <ClearFiltersIcon fontSize="small" style={{ marginRight: Theme.spacing(1) }} />
                  Clear Filters
                </Button>
              </div>
            </Grid>
            <Grid item xs={12} md={6}>
              <MTableToolbar {...toolbarProps} style={{ borderRadius: Theme.spacing(0.5) }} />
            </Grid>
            {postSizeError}
            {downloadSizeWarning}
          </Grid>
        ),
        FilterRow: filterRowProps => (
          <MTableFilterRow
            {...filterRowProps}
            onFilterChanged={(columnId, value) => {
              filterRowProps.onFilterChanged(columnId, value);
              const filter = columns[columnId].field;
              const current = filters[filter];
              if (filter === 'name' && value !== current) {
                debouncedFilterDispatch(filter, value);
                return;
              }
              if (
                current
                && (value.length !== current.length || value.some(v => !current.includes(v)))
              ) {
                dispatch({ type: 'setS3FilesFilterValue', filter, value });
              }
            }}
          />
        ),
      };
      /* eslint-enable react/jsx-one-expression-per-line */
      const localization = {
        pagination: {
          labelRowsSelect: 'files',
        },
        toolbar: {
          nRowsSelected: `{0} file${selection.length === 1 ? '' : 's'} selected (${formatBytes(totalSize)} uncompressed)`,
        },
        body: {
          emptyDataSourceMessage: 'No files to display. Select more sites, broaden date range, or broaden search / filters.',
        },
      };
      return (validValues.length || isLoading) ? (
        <div className={classes.fileTable}>
          <MaterialTable
            components={components}
            columns={columns}
            data={validValues}
            localization={localization}
            options={{
              selection: true,
              showSelectAllCheckbox: false,
              padding: 'dense',
              filtering: true,
              columnsButton: false,
              pageSize: 10,
              pageSizeOptions: [5, 10, 50, 100],
              showTitle: false,
              search: false,
              isLoading,
            }}
            onSelectionChange={(rows, file) => {
              dispatch({
                type: 'setIndividualS3FileSelected',
                id: file.id,
                selected: file.tableData.checked,
              });
            }}
          />
          <div className={classes.loadingOverlay} style={{ display: isLoading ? 'block' : 'none' }}>
            <Typography variant="h6" style={{ marginBottom: Theme.spacing(4) }}>
              {`Loading files (${(s3FileFetchProgress || 0).toFixed(1)}%)...`}
            </Typography>
            <CircularProgress variant="static" value={s3FileFetchProgress} />
          </div>
        </div>
      ) : (
        <Typography variant="subtitle1" style={{ marginTop: Theme.spacing(3) }}>
          Select sites and date range in order to generate a list of files to choose from.
        </Typography>
      );
    },

    /**
       PACKAGE TYPE
    */
    packageType: () => {
      const { value, validValues } = state.packageType;
      let { productBasicDescription, productExpandedDescription } = state.productData;
      if (!productBasicDescription) {
        productBasicDescription = 'Includes the data product, summary statistics, expanded uncertainty, and final quality flag';
      }
      if (!productExpandedDescription) {
        productExpandedDescription = 'Includes the basic package information plus quality metrics for all of the quality assessment and quality control analysis';
      }
      return (
        <FormControl
          data-selenium="download-data-dialog.step-form.package-type"
          component="fieldset"
        >
          <RadioGroup
            aria-label="Package Type"
            name="package-type"
            value={value || ''}
            onChange={(e) => {
              setState('packageType', e.target.value);
              changeToNextUncompletedStep();
            }}
          >
            <FormControlLabel
              className={classes.radio}
              value={validValues[0]}
              control={<Radio />}
              label={(
                <div className={classes.radioLabel}>
                  <Typography variant="h6">Basic</Typography>
                  <Typography variant="body2">
                    {productBasicDescription}
                  </Typography>
                </div>
              )}
            />
            <FormControlLabel
              className={classes.radio}
              value={validValues[1]}
              control={<Radio />}
              label={(
                <div className={classes.radioLabel}>
                  <Typography variant="h6">Expanded</Typography>
                  <Typography variant="body2">
                    {productExpandedDescription}
                  </Typography>
                </div>
              )}
            />
          </RadioGroup>
        </FormControl>
      );
    },

    /**
       EXTERNAL LINKS - EXCLUSIVE HOSTING
    */
    externalExclusive: () => {
      const externalHost = ExternalHost.getByProductCode(state.productData.productCode);
      if (!externalHost) { return null; }
      return (
        <div data-selenium={`download-data-dialog.step-form.external-links.${externalHost.id.toLowerCase()}`}>
          <SnackbarContent
            className={classes.infoSnackbar}
            style={{ marginBottom: Theme.spacing(3) }}
            message={(
              <div className={classes.startFlex}>
                <InfoIcon fontSize="large" className={classes.infoSnackbarIcon} />
                <div>
                  <Typography variant="subtitle2">
                    {/* eslint-disable react/jsx-one-expression-per-line */}
                    Data for this product is not currently available for download through
                    the NEON Data Portal. Please use the links below to access data for
                    this product for a particular site from the {externalHost.renderLink()}.
                    {/* eslint-enable react/jsx-one-expression-per-line */}
                  </Typography>
                </div>
              </div>
            )}
          />
          <ExternalHostProductSpecificLinks productCode={state.productData.productCode} />
        </div>
      );
    },

    /**
       POLICIES
    */
    policies: () => {
      const { value: agreed } = state.policies;
      const checkbox = (
        <Checkbox
          color="primary"
          value="policies"
          checked={agreed}
          disabled={agreed}
          onChange={() => {
            setState('policies', true);
            changeToNextUncompletedStep();
          }}
        />
      );
      /* eslint-disable react/jsx-one-expression-per-line */
      return (
        <div data-selenium="download-data-dialog.step-form.policies">
          <Typography variant="subtitle1" gutterBottom>
            In order to proceed to download NEON data you must agree to
            the {dataUsageAndCitationPoliciesLink}.
          </Typography>
          <FormControlLabel
            control={checkbox}
            className={classes.formControlBold}
            label="I agree to the NEON Data Usage and Citation Policies."
          />
        </div>
      );
      /* eslint-enable react/jsx-one-expression-per-line */
    },

    /**
       SUMMARY
    */
    summary: () => {
      const stepSummary = (
        <div data-selenium="download-data-dialog.step-form.summary">
          {state.requiredSteps.map((step, index) => {
            if (['summary', 'policies'].includes(step.key)) { return null; }
            const { isComplete } = state.requiredSteps[index];
            return (
              <div key={step.key} className={classes.stepSummary}>
                <div
                  role="button"
                  tabIndex={0}
                  className={classes.stepSummaryHeader}
                  onClick={() => changeToStep(index)}
                  onKeyPress={() => changeToStep(index)}
                >
                  <Chip
                    color={isComplete ? 'primary' : 'default'}
                    label={index + 1}
                    className={classes.summaryChip}
                  />
                  <Typography variant="h6" style={{ flexGrow: 1 }}>
                    {DownloadDataContext.ALL_STEPS[step.key].label}
                  </Typography>
                </div>
                <div className={classes.stepSummaryContent}>
                  {isComplete ? renderStepSummary[step.key]() : (
                    <Typography variant="body2" className={classes.summaryTextIncomplete}>
                      Incomplete
                    </Typography>
                  )}
                </div>
              </div>
            );
          })}
          <div key="download" className={classes.stepSummary}>
            {renderDownloadButton()}
          </div>
        </div>
      );
      const downloadAndExploreLink = ExternalHost.renderExternalLink(
        'https://www.neonscience.org/download-explore-neon-data',
        'Download and Explore NEON Data',
        'NEON',
      );
      const downloadAndExploreSnackbar = (
        <div data-selenium="download-data-dialog.step-form.summary.file-naming">
          <SnackbarContent
            className={classes.infoSnackbar}
            style={{ margin: Theme.spacing(0.5, 0, 3, 0) }}
            message={(
              <div className={classes.startFlex}>
                <ExploreIcon fontSize="large" className={classes.infoSnackbarIcon} />
                {/* eslint-disable react/jsx-one-expression-per-line */}
                <Typography variant="subtitle2">
                  Tip: Check out our {downloadAndExploreLink} tutorial.
                  This tutorial will explain how our neonUtilities package can
                  be used to unzip and join data tables with just a few lines of code.
                </Typography>
                {/* eslint-enable react/jsx-one-expression-per-line */}
              </div>
            )}
          />
        </div>
      );
      const fileNamingConventionsLink = ExternalHost.renderExternalLink(
        'https://data.neonscience.org/file-naming-conventions',
        'NEON File Naming Conventions',
        'NEON',
      );
      const fileNamingSnackbar = (
        <div data-selenium="download-data-dialog.step-form.summary.file-naming">
          <SnackbarContent
            className={classes.infoSnackbar}
            style={{ margin: Theme.spacing(0.5, 0, 3, 0) }}
            message={(
              <div className={classes.startFlex}>
                <FileIcon fontSize="large" className={classes.infoSnackbarIcon} />
                {/* eslint-disable react/jsx-one-expression-per-line */}
                <Typography variant="subtitle2">
                  Files in this download will follow {fileNamingConventionsLink}.
                </Typography>
                {/* eslint-enable react/jsx-one-expression-per-line */}
              </div>
            )}
          />
        </div>
      );
      const { productCode, productName } = state.productData;
      const year = moment().format('YYYY');
      const today = moment().format('MMMM D, YYYY');
      const maturity = 'Provisional';
      const url = 'http://data.neonscience.org';
      const citationText = `National Ecological Observatory Network. ${year}. Data Product ${productCode}, ${productName}. ${maturity} data downloaded from ${url} on ${today}. Battelle, Boulder, CO, USA NEON. ${year}.`;
      const citationSnackbar = (
        <div data-selenium="download-data-dialog.step-form.summary.citation">
          <SnackbarContent
            className={classes.infoSnackbar}
            style={{ margin: Theme.spacing(0.5, 0, 3, 0) }}
            message={(
              <div>
                <div className={classes.startFlex}>
                  <QuoteIcon fontSize="large" className={classes.infoSnackbarIcon} />
                  {/* eslint-disable react/jsx-one-expression-per-line */}
                  <Typography variant="subtitle2" style={{ flexGrow: 1 }}>
                    Please use this citation in your publications.
                    See {dataUsageAndCitationPoliciesLink} for more info.
                  </Typography>
                  {/* eslint-enable react/jsx-one-expression-per-line */}
                  <CopyToClipboard text={citationText}>
                    <Button color="primary" variant="outlined" size="small" className={classes.copyButton}>
                      <CopyIcon fontSize="small" style={{ marginRight: Theme.spacing(1) }} />
                      Copy
                    </Button>
                  </CopyToClipboard>
                </div>
                <Divider style={{ margin: Theme.spacing(1.5, 0) }} />
                <Typography
                  variant="body2"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }} // For copy+paste
                >
                  {citationText}
                </Typography>
              </div>
            )}
          />
        </div>
      );
      return (
        <Grid
          container
          spacing={2}
          alignItems="flex-start"
        >
          <Grid item xs={12} md={6}>
            {stepSummary}
          </Grid>
          <Grid item xs={12} md={6}>
            {downloadAndExploreSnackbar}
            {fileNamingSnackbar}
            {citationSnackbar}
          </Grid>
        </Grid>
      );
    },
  };

  return renderStepForm[stepKey] ? renderStepForm[stepKey]() : null;
}

DownloadStepForm.propTypes = {
  stepKey: PropTypes.oneOf(Object.keys(DownloadDataContext.ALL_STEPS)).isRequired,
  changeToStep: PropTypes.func,
  changeToNextUncompletedStep: PropTypes.func,
  renderDownloadButton: PropTypes.func,
};

DownloadStepForm.defaultProps = {
  changeToStep: () => {},
  changeToNextUncompletedStep: () => {},
  renderDownloadButton: () => null,
};
