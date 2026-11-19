/**
 * Reusable Import Profiles.
 * Defines standard fields, aliases, validation thresholds, and parsing rules.
 * Extensible for new profiles without modifying engine code.
 */

export const ExaminationRequirementProfile = {
  id: 'EXAM_REQUIREMENT',
  name: 'Examination Requirement Profile',
  description: 'Parses city-wise candidate requirements, merged/unmerged date groups, and dynamic shifts.',
  
  sheetNameKeywords: ['requirement', 'requirement_sheet', 'candidates', 'exam', 'sheet1'],
  
  headerRowCandidates: [1, 0], // Check row 1 first (for 2-row layout), fallback to row 0
  dateRowIndex: 0,
  
  standardFields: [
    {
      key: 'sNo',
      label: 'S. No.',
      aliases: ['s. no.', 's.no.', 's.no', 'sr. no.', 'sr no', 'sno', 'sl. no', 'sl no', 'serial no', 'serial number', '#', 'id', 's_no', 'sl_no'],
      type: 'any',
      required: false,
    },
    {
      key: 'region',
      label: 'Region',
      aliases: ['region', 'zone', 'area', 'reg', 'geographic region'],
      type: 'string',
      required: false,
    },
    {
      key: 'state',
      label: 'State',
      aliases: ['state', 'state name', 'province', 'st'],
      type: 'string',
      required: false,
    },
    {
      key: 'city',
      label: 'City',
      aliases: ['city', 'city name', 'centre city', 'center city', 'location', 'exam city', 'centre location', 'test city'],
      type: 'string',
      required: true,
    },
    {
      key: 'districts',
      label: 'Districts',
      aliases: ['districts', 'district', 'dist', 'district name', 'dist.', 'taluk', 'taluka'],
      type: 'string',
      required: false,
    },
    {
      key: 'cityCode',
      label: 'City Code',
      aliases: ['city code', 'location code', 'centre code', 'center code', 'city id', 'code', 'loc code'],
      type: 'string',
      required: false,
    },
    {
      key: 'totalCount',
      label: 'Total Count',
      aliases: ['total count', 'total candidates', 'total', 'candidate count', 'candidate target', 'total requirement', 'total req', 'sum', 'target count'],
      type: 'number',
      required: false,
    },
    {
      key: 'max',
      label: 'Max',
      aliases: ['max', 'maximum', 'max count', 'max per shift', 'peak', 'capacity max', 'max capacity'],
      type: 'number',
      required: false,
    },
  ],

  // Shift column detection
  shiftPattern: /(?:shift|slot)[\s\-_]*(?:\d+|n)|(?:morning|afternoon|evening|night)[\s\-_]*shift/i,

  // Guard limits
  maxFileSizeMB: 30,
  maxRows: 15000,
  maxCols: 200,
};

export const ProfileRegistry = {
  EXAM_REQUIREMENT: ExaminationRequirementProfile,
  getProfile(id = 'EXAM_REQUIREMENT') {
    return this[id] || ExaminationRequirementProfile;
  },
};
