export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

/**
 * FRD Sec. 6.1: Exact Centre Category Options
 * School; College; University; Government Institution; Private Educational Institution;
 * IT/Computer Training Institute; Dedicated Examination Centre; Other
 */
export const CENTRE_CATEGORIES = [
  'School',
  'College',
  'University',
  'Government Institution',
  'Private Educational Institution',
  'IT/Computer Training Institute',
  'Dedicated Examination Centre',
  'Other'
];

/**
 * FRD Sec. 8: Centre Legal Structure / Type
 * Proprietorship; Partnership Firm; Trust/Society
 */
export const ORGANIZATION_TYPES = [
  'Proprietorship',
  'Partnership Firm',
  'Trust/Society'
];

/**
 * FRD Sec. 6.1: Region Options
 * NR; SR; ER; WR; CR; NER; NWR; MPR
 */
export const REGIONS = [
  'NR',
  'SR',
  'ER',
  'WR',
  'CR',
  'NER',
  'NWR',
  'MPR'
];

export const REGION_LABELS = {
  NR: 'NR — Northern Region',
  SR: 'SR — Southern Region',
  ER: 'ER — Eastern Region',
  WR: 'WR — Western Region',
  CR: 'CR — Central Region',
  NER: 'NER — North Eastern Region',
  NWR: 'NWR — North Western Region',
  MPR: 'MPR — Madhya Pradesh Region',
};

/**
 * FRD Sec. 10: Electricity Connection Types
 * Domestic; Commercial; Industrial; Other
 */
export const ELECTRICITY_CONNECTION_TYPES = [
  'Domestic',
  'Commercial',
  'Industrial',
  'Other'
];

/**
 * FRD Sec. 10: Generator Fuel Types
 * Diesel; Petrol; CNG; Other
 */
export const GENERATOR_FUEL_TYPES = [
  'Diesel',
  'Petrol',
  'CNG',
  'Other'
];

/**
 * FRD Sec. 10: LAN Types
 * Single LAN; LAN
 */
export const LAN_TYPES = [
  'Single LAN',
  'LAN'
];

export const BUILDING_TYPES = [
  'Independent Building',
  'Commercial Building',
  'Educational Institution Building',
  'Government Building',
  'Mixed-Use Building',
  'Other'
];

export const MAJOR_BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank',
  'Bank of Baroda', 'Axis Bank', 'Canara Bank', 'Union Bank of India',
  'Bank of India', 'IndusInd Bank', 'Kotak Mahindra Bank', 'Yes Bank',
  'IDBI Bank', 'Central Bank of India', 'Indian Bank', 'Other'
];

/**
 * FRD Sec. 11: Bank Account Types
 * Savings; Current
 */
export const BANK_ACCOUNT_TYPES = [
  'Savings',
  'Current'
];

export const LAB_TYPES = [
  'Dedicated CBT Lab',
  'College Computer Lab',
  'Language Lab',
  'Engineering CAD/CAM Lab',
  'Shared Lab',
  'Other'
];

export const PARTITION_TYPES = [
  'Full Wood Partition with Acrylic Shield',
  'Wood',
  'Glass',
  'Acrylic',
  'Cardboard',
  'Metal Sheet',
  'None'
];

export const SYSTEM_OWNERSHIP_TYPES = [
  'Owned',
  'Rented',
  'Leased',
  'Shared'
];

export const SUBMODULE_KEYS = {
  BASIC_INFO: 'BASIC_INFO',
  PERSONNEL: 'PERSONNEL',
  DOCUMENTS: 'DOCUMENTS',
  BUILDING_INFRA: 'BUILDING_INFRA',
  POWER_NETWORK: 'POWER_NETWORK',
  BANK_DETAILS: 'BANK_DETAILS',
};
