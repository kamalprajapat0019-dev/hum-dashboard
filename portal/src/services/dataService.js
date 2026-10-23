/**
 * Data Service — Phase 2
 * localStorage-backed CRUD store. Phase 3 replaces with real API calls.
 * All mutations return { success, data, error }
 */

// ── Master Data ───────────────────────────────────────────────────────────────
export const REGIONS = [
  { id: 'r1', label: 'North' },
  { id: 'r2', label: 'South' },
  { id: 'r3', label: 'East' },
  { id: 'r4', label: 'West' },
  { id: 'r5', label: 'Central' },
  { id: 'r6', label: 'North-East' },
];

export const STATES = [
  { id: 'st1', label: 'Delhi',           regionId: 'r1' },
  { id: 'st2', label: 'Uttar Pradesh',   regionId: 'r1' },
  { id: 'st3', label: 'Haryana',         regionId: 'r1' },
  { id: 'st4', label: 'Punjab',          regionId: 'r1' },
  { id: 'st5', label: 'Rajasthan',       regionId: 'r1' },
  { id: 'st6', label: 'Maharashtra',     regionId: 'r4' },
  { id: 'st7', label: 'Gujarat',         regionId: 'r4' },
  { id: 'st8', label: 'Karnataka',       regionId: 'r2' },
  { id: 'st9', label: 'Tamil Nadu',      regionId: 'r2' },
  { id: 'st10',label: 'Telangana',       regionId: 'r2' },
  { id: 'st11',label: 'Andhra Pradesh',  regionId: 'r2' },
  { id: 'st12',label: 'Kerala',          regionId: 'r2' },
  { id: 'st13',label: 'West Bengal',     regionId: 'r3' },
  { id: 'st14',label: 'Bihar',           regionId: 'r3' },
  { id: 'st15',label: 'Odisha',          regionId: 'r3' },
  { id: 'st16',label: 'Madhya Pradesh',  regionId: 'r5' },
  { id: 'st17',label: 'Chhattisgarh',    regionId: 'r5' },
  { id: 'st18',label: 'Assam',           regionId: 'r6' },
];

export const CITIES = [
  { id: 'c1',  label: 'New Delhi',   stateId: 'st1' },
  { id: 'c2',  label: 'Noida',       stateId: 'st2' },
  { id: 'c3',  label: 'Lucknow',     stateId: 'st2' },
  { id: 'c4',  label: 'Agra',        stateId: 'st2' },
  { id: 'c5',  label: 'Gurugram',    stateId: 'st3' },
  { id: 'c6',  label: 'Faridabad',   stateId: 'st3' },
  { id: 'c7',  label: 'Chandigarh',  stateId: 'st4' },
  { id: 'c8',  label: 'Jaipur',      stateId: 'st5' },
  { id: 'c9',  label: 'Mumbai',      stateId: 'st6' },
  { id: 'c10', label: 'Pune',        stateId: 'st6' },
  { id: 'c11', label: 'Nagpur',      stateId: 'st6' },
  { id: 'c12', label: 'Ahmedabad',   stateId: 'st7' },
  { id: 'c13', label: 'Surat',       stateId: 'st7' },
  { id: 'c14', label: 'Bangalore',   stateId: 'st8' },
  { id: 'c15', label: 'Mysore',      stateId: 'st8' },
  { id: 'c16', label: 'Chennai',     stateId: 'st9' },
  { id: 'c17', label: 'Coimbatore',  stateId: 'st9' },
  { id: 'c18', label: 'Hyderabad',   stateId: 'st10' },
  { id: 'c19', label: 'Visakhapatnam',stateId:'st11' },
  { id: 'c20', label: 'Kochi',       stateId: 'st12' },
  { id: 'c21', label: 'Kolkata',     stateId: 'st13' },
  { id: 'c22', label: 'Patna',       stateId: 'st14' },
  { id: 'c23', label: 'Bhubaneswar', stateId: 'st15' },
  { id: 'c24', label: 'Bhopal',      stateId: 'st16' },
  { id: 'c25', label: 'Indore',      stateId: 'st16' },
  { id: 'c26', label: 'Raipur',      stateId: 'st17' },
  { id: 'c27', label: 'Guwahati',    stateId: 'st18' },
];

export const ORG_TYPES = ['Individual', 'Trust', 'Society', 'Partnership', 'Company', 'Other'];
export const VENUE_STATUS_OPTS = ['New', 'Old'];
export const CENTRE_STATUSES = ['Draft', 'Active', 'Approved', 'Rejected', 'Inactive'];

// ── Default seed data ────────────────────────────────────────────────────────
const SEED_CENTRES = [
  {
    id: 'cn001', centre_id: 'CN-001',
    region_id: 'r1', state_id: 'st1', city_id: 'c1',
    edu_code: 'EDU-DL-2041', tc_code: 'TC-DL-1082',
    centre_name: 'Lotus Computer Education',
    centre_address: 'Plot 24, Sector 8, Rohini, New Delhi - 110085',
    pincode: '110085',
    actual_state_id: '', actual_city_id: '', actual_node: '',
    venue_status: 'Old', previous_edu_exam: 'NEET PG 2025',
    official_email: 'lotus@gmail.com',
    google_map_link: 'https://maps.google.com/?q=Rohini+Delhi',
    remarks: 'Long-standing centre, excellent track record.',
    centre_status: 'Approved',
    organization_type: 'Trust',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z',
  },
  {
    id: 'cn002', centre_id: 'CN-002',
    region_id: 'r4', state_id: 'st6', city_id: 'c9',
    edu_code: 'EDU-MH-1120', tc_code: 'TC-MH-0892',
    centre_name: 'Sunrise IT Academy',
    centre_address: 'Bldg 7A, MIDC, Andheri East, Mumbai - 400093',
    pincode: '400093',
    actual_state_id: '', actual_city_id: '', actual_node: '',
    venue_status: 'New', previous_edu_exam: '',
    official_email: 'sunrise@itmumbai.in',
    google_map_link: 'https://maps.google.com/?q=Andheri+Mumbai',
    remarks: '',
    centre_status: 'Approved',
    organization_type: 'Company',
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-10-14T10:00:00Z',
  },
  {
    id: 'cn003', centre_id: 'CN-003',
    region_id: 'r2', state_id: 'st8', city_id: 'c14',
    edu_code: 'EDU-KA-0441', tc_code: 'TC-KA-0312',
    centre_name: 'Tech Valley Institute',
    centre_address: 'No. 12, 3rd Main, Koramangala, Bangalore - 560034',
    pincode: '560034',
    actual_state_id: '', actual_city_id: '', actual_node: '',
    venue_status: 'Old', previous_edu_exam: 'JEE Mains 2026',
    official_email: 'techvalley@institute.in',
    google_map_link: '',
    remarks: 'Re-audit required — MOU stamping pending.',
    centre_status: 'Active',
    organization_type: 'Society',
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-10-18T15:00:00Z',
  },
  {
    id: 'cn004', centre_id: 'CN-004',
    region_id: 'r2', state_id: 'st10', city_id: 'c18',
    edu_code: 'EDU-TG-0889', tc_code: 'TC-TG-0563',
    centre_name: 'Saraswati Computers',
    centre_address: '5-9-22, Basheerbagh, Hyderabad - 500029',
    pincode: '500029',
    actual_state_id: '', actual_city_id: '', actual_node: '',
    venue_status: 'New', previous_edu_exam: '',
    official_email: 'saraswati@computers.in',
    google_map_link: '',
    remarks: '',
    centre_status: 'Draft',
    organization_type: 'Individual',
    createdAt: '2026-10-01T11:00:00Z',
    updatedAt: '2026-10-10T09:00:00Z',
  },
  {
    id: 'cn005', centre_id: 'CN-005',
    region_id: 'r2', state_id: 'st9', city_id: 'c16',
    edu_code: 'EDU-TN-0234', tc_code: 'TC-TN-0198',
    centre_name: 'Global Test Centre',
    centre_address: '23, Anna Salai, Teynampet, Chennai - 600018',
    pincode: '600018',
    actual_state_id: '', actual_city_id: '', actual_node: '',
    venue_status: 'Old', previous_edu_exam: 'NEET UG 2024',
    official_email: 'global@testcentre.in',
    google_map_link: '',
    remarks: 'Blacklisted — failed audit twice.',
    centre_status: 'Rejected',
    organization_type: 'Company',
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-10-05T14:00:00Z',
  },
  {
    id: 'cn006', centre_id: 'CN-006',
    region_id: 'r3', state_id: 'st13', city_id: 'c21',
    edu_code: 'EDU-WB-0671', tc_code: 'TC-WB-0488',
    centre_name: 'Pioneer Academy',
    centre_address: '14B, Park Street, Kolkata - 700016',
    pincode: '700016',
    actual_state_id: '', actual_city_id: '', actual_node: '',
    venue_status: 'Old', previous_edu_exam: 'CUET UG 2025',
    official_email: 'pioneer@academy.in',
    google_map_link: '',
    remarks: '',
    centre_status: 'Approved',
    organization_type: 'Trust',
    createdAt: '2026-09-08T08:00:00Z',
    updatedAt: '2026-10-12T11:00:00Z',
  },
];

const SEED_PROJECTS = [
  { id: 'p001', project_code: 'PRJ-001', name: 'NEET UG 2026 – Season 1', client_id: 'cl001', client_name: 'NTA', exam_type: 'NEET UG', stage: 'Execution', status: 'Active', exam_date: '2026-11-15', cities: 24, candidate_target: 54000, centre_target: 180, pm_id: 'u002', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'p002', project_code: 'PRJ-002', name: 'JEE Mains 2027 – January', client_id: 'cl001', client_name: 'NTA', exam_type: 'JEE Mains', stage: 'Audit & Compliance', status: 'Active', exam_date: '2027-01-22', cities: 18, candidate_target: 36000, centre_target: 120, pm_id: 'u002', createdAt: '2026-09-15T08:00:00Z' },
  { id: 'p003', project_code: 'PRJ-003', name: 'CUET PG 2026', client_id: 'cl002', client_name: 'UGC', exam_type: 'CUET PG', stage: 'Document Verification', status: 'Active', exam_date: '2026-12-10', cities: 12, candidate_target: 22000, centre_target: 80, pm_id: 'u002', createdAt: '2026-10-01T08:00:00Z' },
  { id: 'p004', project_code: 'PRJ-004', name: 'AIAPGET 2026', client_id: 'cl003', client_name: 'AICTE', exam_type: 'AIAPGET', stage: 'Booking', status: 'Active', exam_date: '2026-12-28', cities: 8, candidate_target: 9000, centre_target: 45, pm_id: 'u002', createdAt: '2026-10-10T08:00:00Z' },
  { id: 'p005', project_code: 'PRJ-005', name: 'NEET PG 2025', client_id: 'cl001', client_name: 'NTA', exam_type: 'NEET PG', stage: 'Closed', status: 'Closed', exam_date: '2025-06-11', cities: 30, candidate_target: 72000, centre_target: 220, pm_id: 'u002', createdAt: '2025-03-01T08:00:00Z' },
];

const SEED_CLIENTS = [
  { id: 'cl001', name: 'NTA', full_name: 'National Testing Agency', contact: 'nta@gov.in', status: 'Active' },
  { id: 'cl002', name: 'UGC', full_name: 'University Grants Commission', contact: 'ugc@gov.in', status: 'Active' },
  { id: 'cl003', name: 'AICTE', full_name: 'All India Council for Technical Education', contact: 'aicte@gov.in', status: 'Active' },
];

const SEED_USERS = [
  { id: 'u001', name: 'Rajesh Kumar',  email: 'admin@oemportal.in',   role: 'admin',                avatar: 'RK', status: 'Active',   lastLogin: '2026-10-22T08:30:00Z' },
  { id: 'u002', name: 'Priya Sharma',  email: 'pm@oemportal.in',      role: 'project_manager',      avatar: 'PS', status: 'Active',   lastLogin: '2026-10-22T09:15:00Z' },
  { id: 'u003', name: 'Amit Verma',    email: 'auditor@oemportal.in', role: 'auditor_it',           avatar: 'AV', status: 'Active',   lastLogin: '2026-10-21T16:45:00Z' },
  { id: 'u004', name: 'Sneha Patel',   email: 'ops@oemportal.in',     role: 'operations_executive', avatar: 'SP', status: 'Active',   lastLogin: '2026-10-22T10:00:00Z' },
  { id: 'u005', name: 'Deepak Gupta',  email: 'finance@oemportal.in', role: 'accounts_finance',     avatar: 'DG', status: 'Active',   lastLogin: '2026-10-22T07:45:00Z' },
  { id: 'u006', name: 'Centre ABC',    email: 'centre@oemportal.in',  role: 'centre_user',          avatar: 'CA', status: 'Active',   lastLogin: '2026-10-20T11:30:00Z' },
  { id: 'u007', name: 'Ravi Shankar',  email: 'ravi.s@oemportal.in',  role: 'auditor_it',           avatar: 'RS', status: 'Inactive', lastLogin: '2026-10-10T09:00:00Z' },
  { id: 'u008', name: 'Meera Iyer',    email: 'meera.i@oemportal.in', role: 'operations_executive', avatar: 'MI', status: 'Active',   lastLogin: '2026-10-21T14:00:00Z' },
];

// ── Generic localStorage store ────────────────────────────────────────────────
function makeStore(key, seedData) {
  const init = () => {
    const existing = localStorage.getItem(key);
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(seedData));
    }
  };
  init();

  return {
    getAll: () => {
      try { return JSON.parse(localStorage.getItem(key)) || []; }
      catch { return []; }
    },
    getById: (id) => {
      const all = JSON.parse(localStorage.getItem(key)) || [];
      return all.find(r => r.id === id) || null;
    },
    create: (data) => {
      const all = JSON.parse(localStorage.getItem(key)) || [];
      const newItem = { ...data, id: `${key}_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      all.unshift(newItem);
      localStorage.setItem(key, JSON.stringify(all));
      return { success: true, data: newItem };
    },
    update: (id, data) => {
      const all = JSON.parse(localStorage.getItem(key)) || [];
      const idx = all.findIndex(r => r.id === id);
      if (idx === -1) return { success: false, error: 'Record not found' };
      all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(all));
      return { success: true, data: all[idx] };
    },
    delete: (id) => {
      const all = JSON.parse(localStorage.getItem(key)) || [];
      const filtered = all.filter(r => r.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      return { success: true };
    },
    reset: () => {
      localStorage.setItem(key, JSON.stringify(seedData));
    },
  };
}

export const CentreStore   = makeStore('oem_centres',  SEED_CENTRES);
export const ProjectStore  = makeStore('oem_projects', SEED_PROJECTS);
export const ClientStore   = makeStore('oem_clients',  SEED_CLIENTS);
export const UserStore     = makeStore('oem_users',    SEED_USERS);

// Centre Contacts store
export const CONTACT_TYPES = ['Owner', 'Centre Head / Venue CS', 'TCA', 'IT Person', 'Electrician'];

const SEED_CONTACTS = [
  { id: 'ct001', centre_id: 'cn001', person_type: 'Owner',         full_name: 'Ramesh Gupta',   contact_number: '9811234567', email: 'ramesh@lotus.in', aadhaar_number: '1234-5678-9012', father_name: 'Suresh Gupta',   mother_name: 'Geeta Gupta',   permanent_address: 'Plot 24, Rohini, Delhi', current_address: 'Plot 24, Rohini, Delhi', is_primary: true,  is_active: true },
  { id: 'ct002', centre_id: 'cn001', person_type: 'TCA',           full_name: 'Kavita Sharma',  contact_number: '9812345678', email: 'kavita@lotus.in', aadhaar_number: '',              father_name: '',               mother_name: '',              permanent_address: '', current_address: '', is_primary: false, is_active: true },
  { id: 'ct003', centre_id: 'cn001', person_type: 'IT Person',     full_name: 'Sunil Kumar',    contact_number: '9813456789', email: 'sunil@lotus.in',  aadhaar_number: '',              father_name: '',               mother_name: '',              permanent_address: '', current_address: '', is_primary: false, is_active: true },
  { id: 'ct004', centre_id: 'cn001', person_type: 'Electrician',   full_name: 'Mohan Lal',      contact_number: '9814567890', email: '',                aadhaar_number: '',              father_name: '',               mother_name: '',              permanent_address: '', current_address: '', is_primary: false, is_active: true },
];
export const ContactStore = makeStore('oem_contacts', SEED_CONTACTS);

// Centre Documents store
export const DOC_TYPES = [
  { key: 'confirmation_letter',    label: 'Confirmation Letter',       mandatory: true },
  { key: 'mou',                    label: 'MOU (500 stamp)',            mandatory: true },
  { key: 'nda',                    label: 'NDA (100 stamp)',            mandatory: true },
  { key: 'owner_id_proof',         label: 'Owner ID Proof',            mandatory: true },
  { key: 'owner_police_verification',label:'Owner Police Verification',mandatory: false },
  { key: 'tca_id_proof',           label: 'TCA ID Proof',              mandatory: false },
  { key: 'tca_police_verification',label: 'TCA Police Verification',   mandatory: false },
  { key: 'it_id_proof',            label: 'IT ID Proof',               mandatory: false },
  { key: 'it_police_verification', label: 'IT Police Verification',    mandatory: false },
  { key: 'electrician_id_proof',   label: 'Electrician ID Proof',      mandatory: false },
  { key: 'electrician_pcc',        label: 'Electrician PCC',           mandatory: false },
  { key: 'tca_authorization_letter',label:'TCA Authorization Letter',  mandatory: true },
  { key: 'electricity_bill',       label: 'Current Electricity Bill',  mandatory: true },
  { key: 'cancelled_cheque',       label: 'Cancel Cheque',             mandatory: false },
  { key: 'venue_pan',              label: 'Venue PAN',                 mandatory: false },
  { key: 'gst_document',           label: 'GST Certificate',           mandatory: false },
  { key: 'rent_agreement',         label: 'Rent Agreement',            mandatory: false },
  { key: 'registration_certificate',label:'Registration Certificate',  mandatory: true },
  { key: 'trust_society_certificate',label:'Trust / Society Certificate',mandatory: false },
  { key: 'affiliation_letter',     label: 'Affiliation Letter',        mandatory: false },
];

const SEED_DOCS = [
  { id: 'doc001', centre_id: 'cn001', doc_type: 'confirmation_letter',    status: 'Approved', file_name: 'confirmation_letter.pdf', uploaded_at: '2026-10-12', version: 1, remark: '' },
  { id: 'doc002', centre_id: 'cn001', doc_type: 'mou',                    status: 'Approved', file_name: 'mou_500stamp.pdf',       uploaded_at: '2026-10-13', version: 1, remark: '' },
  { id: 'doc003', centre_id: 'cn001', doc_type: 'nda',                    status: 'Approved', file_name: 'nda_100stamp.pdf',       uploaded_at: '2026-10-13', version: 1, remark: '' },
  { id: 'doc004', centre_id: 'cn001', doc_type: 'owner_id_proof',         status: 'Approved', file_name: 'owner_id.pdf',           uploaded_at: '2026-10-14', version: 1, remark: '' },
  { id: 'doc005', centre_id: 'cn001', doc_type: 'tca_id_proof',           status: 'Approved', file_name: 'tca_id.pdf',             uploaded_at: '2026-10-15', version: 1, remark: '' },
  { id: 'doc006', centre_id: 'cn001', doc_type: 'tca_police_verification',status: 'Pending',  file_name: '',                       uploaded_at: '',           version: 0, remark: 'Required urgently' },
  { id: 'doc007', centre_id: 'cn001', doc_type: 'electricity_bill',       status: 'Approved', file_name: 'electricity_bill.pdf',   uploaded_at: '2026-10-17', version: 1, remark: '' },
  { id: 'doc008', centre_id: 'cn001', doc_type: 'registration_certificate',status:'Approved', file_name: 'reg_cert.pdf',           uploaded_at: '2026-10-14', version: 1, remark: '' },
];
export const DocStore = makeStore('oem_docs', SEED_DOCS);

// Centre Capacity / Project Assignment
const SEED_ASSIGNMENTS = [
  { id: 'asgn001', centre_id: 'cn001', project_id: 'p001', booking_start_date: '2026-11-14', booking_end_date: '2026-11-15', total_systems_available: 45, exam_nodes: 40, buffer_percentage: 10, buffer_count: 4, registration_desk_count: 2, total_required_systems: 40, booked_count: 40, total_nodes_including_buffer: 44, working_count: 43, assignment_status: 'Active' },
];
export const AssignmentStore = makeStore('oem_assignments', SEED_ASSIGNMENTS);

// ── Phase 3 Core Operations Stores ──────────────────────────────────────────

// 1. Eligibility & Blacklist Store
const SEED_ELIGIBILITY = [
  {
    id: 'el001',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    city: 'New Delhi',
    state: 'Delhi',
    total_capacity: 45,
    power_backup: 'Dual Generator + 30KVA Online UPS',
    cctv_coverage: '100% IP Cameras with 30-day storage',
    audit_status: 'Audit Passed',
    eligibility_status: 'Eligible',
    score: 96,
    is_blacklisted: false,
    blacklist_reason: '',
    blacklist_date: '',
    overrule_history: [],
  },
  {
    id: 'el002',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    city: 'Mumbai',
    state: 'Maharashtra',
    total_capacity: 60,
    power_backup: 'Single Generator + 20KVA UPS',
    cctv_coverage: 'Covered with blind spots in Entry Lab 2',
    audit_status: 'Audit Passed',
    eligibility_status: 'Eligible',
    score: 88,
    is_blacklisted: false,
    blacklist_reason: '',
    blacklist_date: '',
    overrule_history: [],
  },
  {
    id: 'el003',
    centre_id: 'cn003',
    centre_name: 'Tech Valley Institute',
    city: 'Bangalore',
    state: 'Karnataka',
    total_capacity: 50,
    power_backup: 'UPS Backup only (No DG Set)',
    cctv_coverage: 'Full lab coverage',
    audit_status: 'Re-audit Required',
    eligibility_status: 'Conditional',
    score: 72,
    is_blacklisted: false,
    blacklist_reason: '',
    blacklist_date: '',
    overrule_history: [
      { date: '2026-09-20', authorized_by: 'Rajesh Kumar (Admin)', justification: 'Conditional permission granted pending secondary DG installation.' }
    ],
  },
  {
    id: 'el004',
    centre_id: 'cn004',
    centre_name: 'Saraswati Computers',
    city: 'Hyderabad',
    state: 'Telangana',
    total_capacity: 35,
    power_backup: 'Commercial grid only (UPS under repair)',
    cctv_coverage: 'Analog system without cloud/backup NVR',
    audit_status: 'Audit Pending',
    eligibility_status: 'Conditional',
    score: 64,
    is_blacklisted: false,
    blacklist_reason: '',
    blacklist_date: '',
    overrule_history: [],
  },
  {
    id: 'el005',
    centre_id: 'cn005',
    centre_name: 'Global Test Centre',
    city: 'Chennai',
    state: 'Tamil Nadu',
    total_capacity: 40,
    power_backup: 'Inadequate backup',
    cctv_coverage: 'Faulty NVR unit',
    audit_status: 'Failed',
    eligibility_status: 'Blacklisted',
    score: 38,
    is_blacklisted: true,
    blacklist_reason: 'Repeat audit failure & security protocol non-compliance during mock dry run.',
    blacklist_date: '2026-09-18',
    overrule_history: [],
  },
  {
    id: 'el006',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    city: 'Kolkata',
    state: 'West Bengal',
    total_capacity: 70,
    power_backup: 'Dual DG + Redundant UPS',
    cctv_coverage: 'Full 4K coverage with biometric checkpoint',
    audit_status: 'Audit Passed',
    eligibility_status: 'Eligible',
    score: 94,
    is_blacklisted: false,
    blacklist_reason: '',
    blacklist_date: '',
    overrule_history: [],
  },
];
export const EligibilityStore = makeStore('oem_eligibility', SEED_ELIGIBILITY);

// 2. Booking & Locking Store
const SEED_BOOKINGS = [
  {
    id: 'bk001',
    booking_code: 'BK-2026-001',
    project_id: 'p001',
    project_name: 'NEET UG 2026 – Season 1',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    city: 'New Delhi',
    exam_date: '2026-11-15',
    shifts: 2,
    requested_nodes: 40,
    buffer_nodes: 4,
    rate_per_node: 180,
    status: 'Locked',
    is_locked: true,
    locked_at: '2026-10-15T14:30:00Z',
    conflict_detected: false,
    conflict_details: '',
  },
  {
    id: 'bk002',
    booking_code: 'BK-2026-002',
    project_id: 'p001',
    project_name: 'NEET UG 2026 – Season 1',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    city: 'Mumbai',
    exam_date: '2026-11-15',
    shifts: 2,
    requested_nodes: 50,
    buffer_nodes: 5,
    rate_per_node: 190,
    status: 'Locked',
    is_locked: true,
    locked_at: '2026-10-16T11:00:00Z',
    conflict_detected: false,
    conflict_details: '',
  },
  {
    id: 'bk003',
    booking_code: 'BK-2026-003',
    project_id: 'p002',
    project_name: 'JEE Mains 2027 – January',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    city: 'New Delhi',
    exam_date: '2027-01-22',
    shifts: 2,
    requested_nodes: 40,
    buffer_nodes: 4,
    rate_per_node: 180,
    status: 'Invited',
    is_locked: false,
    locked_at: '',
    conflict_detected: false,
    conflict_details: '',
  },
  {
    id: 'bk004',
    booking_code: 'BK-2026-004',
    project_id: 'p003',
    project_name: 'CUET PG 2026',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    city: 'Kolkata',
    exam_date: '2026-12-10',
    shifts: 2,
    requested_nodes: 60,
    buffer_nodes: 6,
    rate_per_node: 175,
    status: 'Consent Accepted',
    is_locked: false,
    locked_at: '',
    conflict_detected: false,
    conflict_details: '',
  },
  {
    id: 'bk005',
    booking_code: 'BK-2026-005',
    project_id: 'p004',
    project_name: 'AIAPGET 2026',
    centre_id: 'cn003',
    centre_name: 'Tech Valley Institute',
    city: 'Bangalore',
    exam_date: '2026-12-28',
    shifts: 1,
    requested_nodes: 40,
    buffer_nodes: 4,
    rate_per_node: 170,
    status: 'Discussing',
    is_locked: false,
    locked_at: '',
    conflict_detected: true,
    conflict_details: 'Concurrent local recruitment exam reported on 28 Dec.',
  },
];
export const BookingStore = makeStore('oem_bookings', SEED_BOOKINGS);

// 3. Digital Consent Workflow Store
const SEED_CONSENTS = [
  {
    id: 'cs001',
    booking_id: 'bk001',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    project_name: 'NEET UG 2026 – Season 1',
    exam_date: '2026-11-15',
    proposed_nodes: 40,
    proposed_shifts: 2,
    proposed_rate: '₹180 per candidate/node',
    terms: 'National Testing Agency Standard Examination Security Undertaking (CBT-2026/SOP)',
    status: 'Accepted',
    consent_sign_name: 'Ramesh Gupta (Centre Head / Owner)',
    consent_signed_at: '2026-10-14T11:20:00Z',
    discuss_remark: '',
    reject_reason: '',
  },
  {
    id: 'cs002',
    booking_id: 'bk002',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    project_name: 'NEET UG 2026 – Season 1',
    exam_date: '2026-11-15',
    proposed_nodes: 50,
    proposed_shifts: 2,
    proposed_rate: '₹190 per candidate/node',
    terms: 'National Testing Agency Standard Examination Security Undertaking (CBT-2026/SOP)',
    status: 'Accepted',
    consent_sign_name: 'Kishore Deshmukh (Authorised Signatory)',
    consent_signed_at: '2026-10-15T09:45:00Z',
    discuss_remark: '',
    reject_reason: '',
  },
  {
    id: 'cs003',
    booking_id: 'bk003',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    project_name: 'JEE Mains 2027 – January',
    exam_date: '2027-01-22',
    proposed_nodes: 40,
    proposed_shifts: 2,
    proposed_rate: '₹180 per candidate/node',
    terms: 'JEE Apex Board Standard Center Delivery Guidelines & Digital Proctoring MoU',
    status: 'Pending',
    consent_sign_name: '',
    consent_signed_at: '',
    discuss_remark: '',
    reject_reason: '',
  },
  {
    id: 'cs004',
    booking_id: 'bk004',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    project_name: 'CUET PG 2026',
    exam_date: '2026-12-10',
    proposed_nodes: 60,
    proposed_shifts: 2,
    proposed_rate: '₹175 per candidate/node',
    terms: 'UGC Examination Delivery & Infrastructure Availability Agreement',
    status: 'Accepted',
    consent_sign_name: 'Subhash Bose (Principal & Venue CS)',
    consent_signed_at: '2026-10-17T16:10:00Z',
    discuss_remark: '',
    reject_reason: '',
  },
  {
    id: 'cs005',
    booking_id: 'bk005',
    centre_id: 'cn003',
    centre_name: 'Tech Valley Institute',
    project_name: 'AIAPGET 2026',
    exam_date: '2026-12-28',
    proposed_nodes: 40,
    proposed_shifts: 1,
    proposed_rate: '₹170 per candidate/node',
    terms: 'AICTE Online Examination MoU',
    status: 'Discuss',
    consent_sign_name: '',
    consent_signed_at: '',
    discuss_remark: 'Requested rate adjustment to ₹190 due to specialized Sunday staff overtime.',
    reject_reason: '',
  },
];
export const ConsentStore = makeStore('oem_consents', SEED_CONSENTS);

// ── Phase 4: Compliance & Technical Audit Stores ──────────────────────────────
export const SEED_AUDITS = [
  {
    id: 'aud001',
    audit_code: 'AUD-2026-001',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    city: 'New Delhi',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    auditor_id: 'u003',
    auditor_name: 'Amit Verma (Senior IT Auditor)',
    scheduled_date: '2026-10-24',
    conducted_date: '2026-10-21',
    status: 'Rework Required',
    validity_status: 'Rework Pending',
    validity_days_left: 45,
    overall_score: 74,
    scores: {
      physical: 85,
      power: 65,
      network: 62,
      cctv: 84
    },
    evidence_count: 8,
    findings: [
      {
        id: 'f001',
        severity: 'Critical',
        category: 'Network & Security',
        description: 'Duplicate MAC address detected on 3 nodes (LAB1-PC-14, LAB1-PC-15, LAB2-PC-08). Risk of unauthorized packet replay / cloning.',
        photo_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
        rework_required: 'True',
        corrective_owner: 'Center TCA & Network Engg (Rajesh Sharma)',
        rework_due_date: '2026-10-25',
        rework_status: 'Open'
      },
      {
        id: 'f002',
        severity: 'High',
        category: 'Power Redundancy',
        description: 'DG Set switchover relay delayed by 14 seconds causing 6 node restarts during load simulation.',
        photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
        rework_required: 'True',
        corrective_owner: 'Facility Electrician (M. Khan)',
        rework_due_date: '2026-10-26',
        rework_status: 'Open'
      },
      {
        id: 'f003',
        severity: 'Medium',
        category: 'CCTV Surveillance',
        description: 'Server room camera blindspot near back rack. Camera angle needs readjustment + 30-day retention verification.',
        photo_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&q=80',
        rework_required: 'True',
        corrective_owner: 'CCTV Vendor & IT Admin',
        rework_due_date: '2026-10-27',
        rework_status: 'Open'
      }
    ]
  },
  {
    id: 'aud002',
    audit_code: 'AUD-2026-002',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    city: 'Noida',
    project_id: 'p002',
    project_name: 'JEE Mains 2027 – January',
    auditor_id: 'u003',
    auditor_name: 'Amit Verma (Senior IT Auditor)',
    scheduled_date: '2026-10-20',
    conducted_date: '2026-10-19',
    status: 'Re-Audit Pending',
    validity_status: 'Re-Audit Triggered',
    validity_days_left: 60,
    overall_score: 58,
    scores: {
      physical: 70,
      power: 45,
      network: 60,
      cctv: 55
    },
    evidence_count: 5,
    findings: [
      {
        id: 'f004',
        severity: 'Critical',
        category: 'Power Redundancy',
        description: 'Online UPS batteries failed 30-min discharge test. Battery backup collapsed after 8 minutes.',
        photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
        rework_required: 'True',
        corrective_owner: 'Centre Administrator (P. Verma)',
        rework_due_date: '2026-10-24',
        rework_status: 'Submitted'
      }
    ]
  },
  {
    id: 'aud003',
    audit_code: 'AUD-2026-003',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    auditor_id: 'u007',
    auditor_name: 'Ravi Shankar (Field Auditor)',
    scheduled_date: '2026-10-18',
    conducted_date: '2026-10-18',
    status: 'Passed',
    validity_status: 'Valid (52 days remaining)',
    validity_days_left: 52,
    overall_score: 96,
    scores: {
      physical: 98,
      power: 95,
      network: 96,
      cctv: 95
    },
    evidence_count: 12,
    findings: [
      {
        id: 'f005',
        severity: 'Low',
        category: 'Physical Infrastructure',
        description: 'Biometric registration desk lighting was slightly dim; recommended additional LED fixture.',
        photo_url: '',
        rework_required: 'False',
        corrective_owner: 'Facility Admin',
        rework_due_date: '2026-11-01',
        rework_status: 'Resolved'
      }
    ]
  },
  {
    id: 'aud004',
    audit_code: 'AUD-2026-004',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    city: 'Chandigarh',
    project_id: 'p003',
    project_name: 'CUET PG 2026',
    auditor_id: 'u003',
    auditor_name: 'Amit Verma (Senior IT Auditor)',
    scheduled_date: '2026-10-15',
    conducted_date: '2026-10-15',
    status: 'Passed',
    validity_status: 'Valid (49 days remaining)',
    validity_days_left: 49,
    overall_score: 91,
    scores: {
      physical: 92,
      power: 90,
      network: 90,
      cctv: 92
    },
    evidence_count: 9,
    findings: []
  },
  {
    id: 'aud005',
    audit_code: 'AUD-2026-005',
    centre_id: 'cn003',
    centre_name: 'Tech Valley Institute',
    city: 'Gurugram',
    project_id: 'p004',
    project_name: 'AIAPGET 2026',
    auditor_id: 'u003',
    auditor_name: 'Amit Verma (Senior IT Auditor)',
    scheduled_date: '2026-10-28',
    conducted_date: '',
    status: 'Assigned',
    validity_status: 'Audit Scheduled',
    validity_days_left: 60,
    overall_score: 0,
    scores: { physical: 0, power: 0, network: 0, cctv: 0 },
    evidence_count: 0,
    findings: []
  }
];
export const AuditStore = makeStore('oem_audits', SEED_AUDITS);

export const SEED_TECHNICAL_SCANS = [
  {
    id: 'scan001',
    scan_code: 'SCAN-2026-01',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    city: 'New Delhi',
    project_name: 'NEET UG 2026',
    scan_date: '2026-10-22',
    total_nodes: 120,
    scanned_nodes: 120,
    compliant_nodes: 115,
    duplicate_mac_count: 3,
    high_latency_count: 2,
    avg_latency_ms: 1.8,
    os_compliance_pct: '97.5%',
    usb_blocked_pct: '98%',
    scan_status: 'Critical Alert',
    nodes: [
      { id: 'n01', hostname: 'LAB1-PC-01', ip: '192.168.10.11', mac: '50:EB:71:A2:91:01', ram: '8 GB', os: 'Windows 11 Pro 23H2', latency: '1.2 ms', usb_blocked: true, duplicate: false, status: 'Compliant' },
      { id: 'n02', hostname: 'LAB1-PC-02', ip: '192.168.10.12', mac: '50:EB:71:A2:91:02', ram: '8 GB', os: 'Windows 11 Pro 23H2', latency: '1.4 ms', usb_blocked: true, duplicate: false, status: 'Compliant' },
      { id: 'n14', hostname: 'LAB1-PC-14', ip: '192.168.10.24', mac: '00:1B:44:11:3A:B7', ram: '8 GB', os: 'Windows 10 Enterprise', latency: '1.6 ms', usb_blocked: true, duplicate: true,  status: 'Duplicate MAC Flag' },
      { id: 'n15', hostname: 'LAB1-PC-15', ip: '192.168.10.25', mac: '00:1B:44:11:3A:B7', ram: '8 GB', os: 'Windows 10 Enterprise', latency: '1.9 ms', usb_blocked: true, duplicate: true,  status: 'Duplicate MAC Flag' },
      { id: 'n28', hostname: 'LAB2-PC-08', ip: '192.168.20.18', mac: '00:1B:44:11:3A:B7', ram: '8 GB', os: 'Windows 10 Enterprise', latency: '2.1 ms', usb_blocked: false,duplicate: true,  status: 'Duplicate MAC Flag' },
      { id: 'n44', hostname: 'LAB2-PC-24', ip: '192.168.20.34', mac: '70:85:C2:5B:44:10', ram: '16 GB', os: 'Windows 11 Pro 23H2', latency: '6.8 ms', usb_blocked: true, duplicate: false, status: 'High Latency' },
      { id: 'n45', hostname: 'LAB2-PC-25', ip: '192.168.20.35', mac: '70:85:C2:5B:44:11', ram: '8 GB', os: 'Windows 11 Pro 23H2', latency: '1.1 ms', usb_blocked: true, duplicate: false, status: 'Compliant' },
      { id: 'n51', hostname: 'LAB3-PC-01', ip: '192.168.30.11', mac: 'BC:24:11:80:EF:30', ram: '8 GB', os: 'Windows 11 Pro 23H2', latency: '1.3 ms', usb_blocked: true, duplicate: false, status: 'Compliant' }
    ]
  },
  {
    id: 'scan002',
    scan_code: 'SCAN-2026-02',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    project_name: 'NEET UG 2026',
    scan_date: '2026-10-21',
    total_nodes: 250,
    scanned_nodes: 250,
    compliant_nodes: 250,
    duplicate_mac_count: 0,
    high_latency_count: 0,
    avg_latency_ms: 1.1,
    os_compliance_pct: '100%',
    usb_blocked_pct: '100%',
    scan_status: 'Certified Compliant',
    nodes: [
      { id: 'ax01', hostname: 'APEX-LAB1-01', ip: '10.10.1.11', mac: '3C:52:82:11:99:A1', ram: '16 GB', os: 'Windows 11 Pro', latency: '0.8 ms', usb_blocked: true, duplicate: false, status: 'Compliant' },
      { id: 'ax02', hostname: 'APEX-LAB1-02', ip: '10.10.1.12', mac: '3C:52:82:11:99:A2', ram: '16 GB', os: 'Windows 11 Pro', latency: '0.9 ms', usb_blocked: true, duplicate: false, status: 'Compliant' }
    ]
  }
];
export const TechnicalScanStore = makeStore('oem_tech_scans', SEED_TECHNICAL_SCANS);

export const SEED_MOCKS = [
  {
    id: 'mock001',
    mock_code: 'MCK-2026-001',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    city: 'New Delhi',
    project_name: 'NEET UG 2026',
    mock_date: '2026-10-20',
    status: 'Pass',
    candidate_count: 120,
    system_crashes: 0,
    power_switchover_sec: 1.2,
    remarks: 'Mock drill completed successfully. All 120 client systems connected to test server with zero jitter or packet loss.',
    failure_reason: '',
    escalation_status: 'Normal',
    auditor_sign: 'Amit Verma'
  },
  {
    id: 'mock002',
    mock_code: 'MCK-2026-002',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    city: 'Noida',
    project_name: 'JEE Mains 2027 – January',
    mock_date: '2026-10-21',
    status: 'Fail',
    candidate_count: 200,
    system_crashes: 14,
    power_switchover_sec: 18.5,
    remarks: 'UPS load test failed during mock test simulation. 14 client PCs in Lab 3 rebooted during live test run.',
    failure_reason: 'UPS Phase 2 Overload & Delayed DG Switchover (>15s)',
    escalation_status: 'Escalated to PM',
    auditor_sign: 'Amit Verma'
  },
  {
    id: 'mock003',
    mock_code: 'MCK-2026-003',
    centre_id: 'cn003',
    centre_name: 'Tech Valley Institute',
    city: 'Gurugram',
    project_name: 'AIAPGET 2026',
    mock_date: '2026-10-25',
    status: 'Not Conducted',
    candidate_count: 80,
    system_crashes: 0,
    power_switchover_sec: 0,
    remarks: 'Scheduled for Saturday morning 10:00 AM once network cabling audit is cleared.',
    failure_reason: '',
    escalation_status: 'Normal',
    auditor_sign: ''
  },
  {
    id: 'mock004',
    mock_code: 'MCK-2026-004',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    project_name: 'NEET UG 2026',
    mock_date: '2026-10-19',
    status: 'Pass',
    candidate_count: 240,
    system_crashes: 0,
    power_switchover_sec: 0.8,
    remarks: 'Full 3-hour load test simulation passed with seamless zero-second UPS battery switchover.',
    failure_reason: '',
    escalation_status: 'Normal',
    auditor_sign: 'Ravi Shankar'
  }
];
export const MockExamStore = makeStore('oem_mocks', SEED_MOCKS);

// ── Phase 5: Execution Layer Stores ───────────────────────────────────────────
export const SEED_ALLOCATIONS = [
  {
    id: 'alc001',
    allocation_code: 'ALC-2026-001',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    exam_date: '2026-11-15',
    venue_capacity: 250,
    buffer_pct: 12,
    shifts: [
      { shift_no: 1, start_time: '09:00 AM', end_time: '12:20 PM', candidates: 220, buffer_nodes: 25 },
      { shift_no: 2, start_time: '02:30 PM', end_time: '05:50 PM', candidates: 220, buffer_nodes: 25 }
    ],
    total_candidates: 440,
    is_locked: true,
    locked_at: '2026-10-21T14:30:00Z',
    locked_by: 'Priya Nair (Project Manager)',
    lock_version: 'v1.0 (Final)',
    change_requests: []
  },
  {
    id: 'alc002',
    allocation_code: 'ALC-2026-002',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    city: 'Chandigarh',
    exam_date: '2026-11-15',
    venue_capacity: 100,
    buffer_pct: 10,
    shifts: [
      { shift_no: 1, start_time: '09:00 AM', end_time: '12:20 PM', candidates: 90, buffer_nodes: 10 },
      { shift_no: 2, start_time: '02:30 PM', end_time: '05:50 PM', candidates: 90, buffer_nodes: 10 }
    ],
    total_candidates: 180,
    is_locked: false,
    locked_at: '',
    locked_by: '',
    lock_version: 'v0.9 (Draft Review)',
    change_requests: [
      {
        id: 'cr01',
        requested_by: 'Vikram Mehta (Ops Exec)',
        reason: 'Client requested adding 10 additional candidate quota per shift.',
        requested_at: '2026-10-22T10:15:00Z',
        status: 'Pending PM Approval'
      }
    ]
  },
  {
    id: 'alc003',
    allocation_code: 'ALC-2026-003',
    project_id: 'p002',
    project_name: 'JEE Mains 2027 – January',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    city: 'Noida',
    exam_date: '2027-01-22',
    venue_capacity: 220,
    buffer_pct: 15,
    shifts: [
      { shift_no: 1, start_time: '09:00 AM', end_time: '12:00 PM', candidates: 180, buffer_nodes: 25 },
      { shift_no: 2, start_time: '03:00 PM', end_time: '06:00 PM', candidates: 180, buffer_nodes: 25 }
    ],
    total_candidates: 360,
    is_locked: false,
    locked_at: '',
    locked_by: '',
    lock_version: 'v0.5 (Awaiting Mock Clearance)',
    change_requests: []
  }
];
export const AllocationStore = makeStore('oem_allocations', SEED_ALLOCATIONS);

export const SEED_READINESS = [
  {
    id: 'rdy001',
    readiness_code: 'RDY-2026-001',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    project_name: 'NEET UG 2026',
    exam_date: '2026-11-15',
    checklist: {
      manpower: { invigilators: 18, it_execs: 4, security_guards: 6, electrician: 2, status: 'Confirmed' },
      power: { dg_fuel_liters: 220, ups_backup_mins: 75, status: 'Ready & Load Tested' },
      network: { primary_mbps: 300, backup_mbps: 150, latency_ms: '1.1 ms', status: 'Redundant Active' },
      security: { jammers: 8, biometrics: 6, metal_detectors: 4, cctv_status: '32/32 Online', status: 'Secured' }
    },
    centre_signoff: {
      signed_by: 'Dr. R. K. Singhania (Centre Superintendent)',
      signed_at: '2026-10-22T08:30:00Z',
      is_signed: true
    },
    exam_day_status: 'Gate Closed & Bio-Auth in Progress',
    live_attendance: 218,
    total_expected: 220,
    overall_readiness_pct: 100
  },
  {
    id: 'rdy002',
    readiness_code: 'RDY-2026-002',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    city: 'Chandigarh',
    project_name: 'NEET UG 2026',
    exam_date: '2026-11-15',
    checklist: {
      manpower: { invigilators: 10, it_execs: 2, security_guards: 4, electrician: 1, status: 'Partially Confirmed' },
      power: { dg_fuel_liters: 120, ups_backup_mins: 60, status: 'DG Top-up Required' },
      network: { primary_mbps: 100, backup_mbps: 50, latency_ms: '1.4 ms', status: 'Tested' },
      security: { jammers: 4, biometrics: 3, metal_detectors: 2, cctv_status: '16/16 Online', status: 'Secured' }
    },
    centre_signoff: {
      signed_by: '',
      signed_at: '',
      is_signed: false
    },
    exam_day_status: 'T-Minus 24h Setup Verification',
    live_attendance: 0,
    total_expected: 90,
    overall_readiness_pct: 78
  }
];
export const ReadinessStore = makeStore('oem_readiness', SEED_READINESS);

export const SEED_INCIDENTS = [
  {
    id: 'inc001',
    ticket_code: 'INC-2026-001',
    project_name: 'NEET UG 2026',
    centre_id: 'cn001',
    centre_name: 'Lotus Computer Education',
    city: 'New Delhi',
    title: 'Duplicate MAC address on subnet risking node disqualification',
    category: 'Network & Security',
    priority: 'P0 Critical',
    sla_mins_remaining: 18,
    reporter: 'Amit Verma (Auditor)',
    owner: 'Operations Team Lead',
    status: 'Investigating',
    created_at: '2026-10-22T10:30:00Z',
    messages: [
      { sender: 'Amit Verma (Auditor)', time: '10:30 AM', text: 'Scanned 120 nodes. 3 nodes have duplicate MAC 00:1B:44:11:3A:B7.' },
      { sender: 'Centre TCA', time: '10:45 AM', text: 'Replaced Ethernet dongles on LAB1-PC-14 and 15 with dedicated Intel PCIe NICs. Re-scan requested.' }
    ]
  },
  {
    id: 'inc002',
    ticket_code: 'INC-2026-002',
    project_name: 'JEE Mains 2027 – January',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    city: 'Noida',
    title: 'UPS load failure during 3-phase mock test',
    category: 'Power Redundancy',
    priority: 'P0 Critical',
    sla_mins_remaining: 0,
    reporter: 'Amit Verma (Auditor)',
    owner: 'Project Manager (Priya Nair)',
    status: 'Escalated to PM',
    created_at: '2026-10-21T16:00:00Z',
    messages: [
      { sender: 'Amit Verma (Auditor)', time: '04:00 PM', text: '14 client workstations crashed during power switchover test.' },
      { sender: 'Priya Nair (PM)', time: '04:20 PM', text: 'Freezing candidate allocation until UPS replacement NOC is received from vendor.' }
    ]
  },
  {
    id: 'inc003',
    ticket_code: 'INC-2026-003',
    project_name: 'NEET UG 2026',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    title: 'Biometric registration desk printer ribbon jammed',
    category: 'Hardware & Peripherals',
    priority: 'P2 Medium',
    sla_mins_remaining: 85,
    reporter: 'Centre User (R. K. Singhania)',
    owner: 'Ops Field Executive',
    status: 'Resolved',
    created_at: '2026-10-22T08:15:00Z',
    messages: [
      { sender: 'Centre User', time: '08:15 AM', text: 'Spare thermal printer connected and operational. Issue closed.' }
    ]
  }
];
export const IncidentStore = makeStore('oem_incidents', SEED_INCIDENTS);

export const SEED_INVENTORY = [
  { id: 'inv01', item_name: '4G/5G All-Band Cellular Jammer', serial_no: 'JAM-2026-8819', centre_name: 'Apex Online Test Hub', project_name: 'NEET UG 2026', status: 'Deployed & Active', custodian: 'Exam Security Squad' },
  { id: 'inv02', item_name: 'Biometric Iris & Fingerprint Terminal', serial_no: 'BIO-2026-3021', centre_name: 'Apex Online Test Hub', project_name: 'NEET UG 2026', status: 'Deployed & Active', custodian: 'TCA (S. Verma)' },
  { id: 'inv03', item_name: 'Handheld Metal Detector (HHMD)', serial_no: 'HMD-2026-0144', centre_name: 'Pioneer Academy', project_name: 'CUET PG 2026', status: 'In Transit', custodian: 'Courier / Logistics' },
  { id: 'inv04', item_name: '8TB CBT Exam NVR Storage Server', serial_no: 'NVR-2026-9022', centre_name: 'Lotus Computer Education', project_name: 'NEET UG 2026', status: 'Deployed & Active', custodian: 'CCTV Lead' }
];
export const InventoryStore = makeStore('oem_inventory', SEED_INVENTORY);

// ── Phase 6: Commercial & Finance Stores ──────────────────────────────────────
export const SEED_COST_SHEETS = [
  {
    id: 'cst001',
    sheet_code: 'CST-2026-001',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    rates: {
      node_rate: 180,
      shift_count: 2,
      allocated_candidates: 440,
      buffer_nodes: 50,
      buffer_rate: 90,
      manpower_charge: 14000,
      surveillance_charge: 8000,
      diesel_generator_charge: 7500
    },
    subtotal: 113200,
    gst_pct: 18,
    gst_amount: 20376,
    total_cost: 133576,
    version: 'v1.0 (Approved)',
    status: 'Approved',
    approved_by: 'Ananya Roy (Head of Finance)',
    approved_at: '2026-10-21T16:00:00Z',
    versions_history: [
      { version: 'v1.0', updated_by: 'Ananya Roy', date: '2026-10-21', total_amount: 133576, diff_summary: 'Baseline agreed commercial rate approved.' }
    ]
  },
  {
    id: 'cst002',
    sheet_code: 'CST-2026-002',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    city: 'Chandigarh',
    rates: {
      node_rate: 175,
      shift_count: 2,
      allocated_candidates: 180,
      buffer_nodes: 20,
      buffer_rate: 85,
      manpower_charge: 8000,
      surveillance_charge: 5000,
      diesel_generator_charge: 4500
    },
    subtotal: 50700,
    gst_pct: 18,
    gst_amount: 9126,
    total_cost: 59826,
    version: 'v1.1 (Under Review)',
    status: 'Submitted for Review',
    approved_by: '',
    approved_at: '',
    versions_history: [
      { version: 'v1.0', updated_by: 'Vikram Mehta', date: '2026-10-18', total_amount: 56500, diff_summary: 'Initial draft calculation.' },
      { version: 'v1.1', updated_by: 'Centre Principal', date: '2026-10-22', total_amount: 59826, diff_summary: 'Updated DG diesel charges due to Sunday shift.' }
    ]
  },
  {
    id: 'cst003',
    sheet_code: 'CST-2026-003',
    project_id: 'p002',
    project_name: 'JEE Mains 2027 – January',
    centre_id: 'cn002',
    centre_name: 'Sunrise IT Academy',
    city: 'Noida',
    rates: {
      node_rate: 210,
      shift_count: 2,
      allocated_candidates: 360,
      buffer_nodes: 50,
      buffer_rate: 100,
      manpower_charge: 16000,
      surveillance_charge: 10000,
      diesel_generator_charge: 9000
    },
    subtotal: 115600,
    gst_pct: 18,
    gst_amount: 20808,
    total_cost: 136408,
    version: 'v0.9 (Draft)',
    status: 'Draft',
    approved_by: '',
    approved_at: '',
    versions_history: []
  }
];
export const CostSheetStore = makeStore('oem_cost_sheets', SEED_COST_SHEETS);

export const SEED_INVOICES = [
  {
    id: 'inv001',
    invoice_number: 'INV-2026-881',
    invoice_date: '2026-10-22',
    centre_id: 'cn004',
    centre_name: 'Apex Online Test Hub',
    city: 'Jaipur',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    cost_sheet_code: 'CST-2026-001',
    billed_candidates: 438,
    attended_candidates: 438,
    attendance_match: true,
    base_amount: 113200,
    cgst_9pct: 10188,
    sgst_9pct: 10188,
    total_invoice_amount: 133576,
    tds_deducted_2pct: 2264,
    net_payable_amount: 131312,
    bank_details: {
      bank_name: 'HDFC Bank Ltd',
      account_no: '501004829104',
      ifsc: 'HDFC0001234',
      pan_gst: '07AAACL1234A1Z5'
    },
    status: 'Approved for Payment',
    approval_notes: '100% attendance match against biometrics log. All tax invoices and gate passes verified.',
    payment_status: 'Unpaid'
  },
  {
    id: 'inv002',
    invoice_number: 'INV-2026-842',
    invoice_date: '2026-10-20',
    centre_id: 'cn006',
    centre_name: 'Pioneer Academy',
    city: 'Chandigarh',
    project_id: 'p001',
    project_name: 'NEET UG 2026',
    cost_sheet_code: 'CST-2026-002',
    billed_candidates: 180,
    attended_candidates: 178,
    attendance_match: false,
    base_amount: 50700,
    cgst_9pct: 4563,
    sgst_9pct: 4563,
    total_invoice_amount: 59826,
    tds_deducted_2pct: 1014,
    net_payable_amount: 58812,
    bank_details: {
      bank_name: 'State Bank of India',
      account_no: '30991823901',
      ifsc: 'SBIN0004321',
      pan_gst: '03BBBCP9821B2Z1'
    },
    status: 'Under Verification',
    approval_notes: '2 candidates discrepancy between invoice claim (180) vs Biometric log (178). Rework reconciliation requested.',
    payment_status: 'Hold'
  }
];
export const InvoiceStore = makeStore('oem_invoices', SEED_INVOICES);

export const SEED_PAYMENTS = [
  {
    id: 'pay001',
    payment_code: 'PAY-2026-041',
    invoice_id: 'inv001',
    invoice_number: 'INV-2026-881',
    centre_name: 'Apex Online Test Hub',
    project_name: 'NEET UG 2026',
    payment_mode: 'NEFT',
    utr_number: 'HDFCN26102298711',
    paid_amount: 131312,
    payment_date: '2026-10-22',
    bank_ref: 'TXN-998124',
    status: 'Completed',
    commercial_closure_signed: true,
    closure_certificate_no: 'CLS-NEET-2026-01'
  }
];
export const PaymentStore = makeStore('oem_payments', SEED_PAYMENTS);

// Audit Log (immutable append)
export function appendAuditLog(entry) {
  const logs = JSON.parse(localStorage.getItem('oem_audit_log') || '[]');
  logs.unshift({ ...entry, id: `log_${Date.now()}`, ts: new Date().toISOString() });
  localStorage.setItem('oem_audit_log', JSON.stringify(logs.slice(0, 500))); // keep last 500
}
export function getAuditLogs() {
  return JSON.parse(localStorage.getItem('oem_audit_log') || '[]');
}
