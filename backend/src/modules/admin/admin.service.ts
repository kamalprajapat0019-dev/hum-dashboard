/**
 * Admin Service Orchestrator (Modularized)
 * Delegates to domain-specific services in `./services/`:
 *  - AnalyticsService (Executive analytics & annual calendar sync)
 *  - UserAdminService (User CRUD, invitations, password resets, allowed domains)
 *  - ClientAdminService (Client management & summary)
 *  - ProjectAdminService (Project management, sequence codes, multi-date schedules)
 *  - CentreAdminService (Centre master, profile review, KYC docs, bank verification, audits, blacklists)
 *  - SystemAdminService (Audit logs & system configurations)
 *  - ExamAdminService (Exam types, multi-year exam instances, shifts, Excel parser & metrics lineage)
 */

import {
  AnalyticsService,
  UserAdminService,
  ProjectAdminService,
  CentreAdminService,
  SystemAdminService,
  ClientAdminService,
  ExamAdminService,
} from './services/index.js';
import { ExamSummaryResult } from './exam-summary.engine.js';

export {
  AnalyticsService,
  UserAdminService,
  ProjectAdminService,
  CentreAdminService,
  SystemAdminService,
  ClientAdminService,
  ExamAdminService,
  ExamSummaryResult,
};

export class AdminService {
  // ── 1. Analytics & Calendar Domain ─────────────────────────────────────────
  static getExecutiveAnalytics = AnalyticsService.getExecutiveAnalytics;
  static getCalendarExams = AnalyticsService.getCalendarExams;

  // ── 2. User Administration Domain ──────────────────────────────────────────
  static getUserSummary = UserAdminService.getUserSummary;
  static listUsers = UserAdminService.listUsers;
  static isDomainAllowed = UserAdminService.isDomainAllowed;
  static createUser = UserAdminService.createUser;
  static getUserById = UserAdminService.getUserById;
  static updateUser = UserAdminService.updateUser;
  static activateUser = UserAdminService.activateUser;
  static deactivateUser = UserAdminService.deactivateUser;
  static deleteUser = UserAdminService.deleteUser;
  static initiatePasswordReset = UserAdminService.initiatePasswordReset;
  static completePasswordReset = UserAdminService.completePasswordReset;
  static verifyResetToken = UserAdminService.verifyResetToken;
  static inviteCentreUser = UserAdminService.inviteCentreUser;
  static listCentreInvitations = UserAdminService.listCentreInvitations;
  static recordInvitationFollowUp = UserAdminService.recordInvitationFollowUp;
  static resendCentreInvitation = UserAdminService.resendCentreInvitation;
  static completeAccountActivation = UserAdminService.completeAccountActivation;
  static verifyInvitationToken = UserAdminService.verifyInvitationToken;
  static getAllowedDomains = UserAdminService.getAllowedDomains;
  static addAllowedDomain = UserAdminService.addAllowedDomain;

  // ── 3. Client Administration Domain ────────────────────────────────────────
  static getClientsSummary = ClientAdminService.getClientsSummary;
  static listClients = ClientAdminService.listClients;
  static getClientById = ClientAdminService.getClientById;
  static createClient = ClientAdminService.createClient;
  static updateClient = ClientAdminService.updateClient;
  static updateClientStatus = ClientAdminService.updateClientStatus;

  // ── 4. Project Administration Domain ───────────────────────────────────────
  static getNextProjectCode = ProjectAdminService.getNextProjectCode;
  static getProjectSummary = ProjectAdminService.getProjectSummary;
  static listProjects = ProjectAdminService.listProjects;
  static createProject = ProjectAdminService.createProject;
  static getProjectById = ProjectAdminService.getProjectById;
  static updateProject = ProjectAdminService.updateProject;
  static updateProjectStatus = ProjectAdminService.updateProjectStatus;

  // ── 5. Centre Master & Compliance Domain ────────────────────────────────────
  static listCentres = CentreAdminService.listCentres;
  static createCentre = CentreAdminService.createCentre;
  static getCentreById = CentreAdminService.getCentreById;
  static updateCentre = CentreAdminService.updateCentre;
  static updateCentreStatus = CentreAdminService.updateCentreStatus;
  static getCentresSummary = CentreAdminService.getCentresSummary;
  static getCentreProfile = CentreAdminService.getCentreProfile;
  static verifyDocument = CentreAdminService.verifyDocument;
  static verifyBank = CentreAdminService.verifyBank;
  static approveApplication = CentreAdminService.approveApplication;
  static rejectApplication = CentreAdminService.rejectApplication;
  static assignAuditor = CentreAdminService.assignAuditor;
  static blacklistCentre = CentreAdminService.blacklistCentre;
  static overrideEligibility = CentreAdminService.overrideEligibility;

  // ── 6. System Administration & Audits Domain ───────────────────────────────
  static getAuditLogs = SystemAdminService.getAuditLogs;
  static getSystemConfigs = SystemAdminService.getSystemConfigs;
  static updateSystemConfig = SystemAdminService.updateSystemConfig;

  // ── 7. Exam Administration & Universal Excel Engine Domain ─────────────────
  static listExamTypes = ExamAdminService.listExamTypes;
  static getExamTypeById = ExamAdminService.getExamTypeById;
  static createExamType = ExamAdminService.createExamType;
  static updateExamType = ExamAdminService.updateExamType;
  static updateExamTypeStatus = ExamAdminService.updateExamTypeStatus;
  static deleteExamType = ExamAdminService.deleteExamType;
  static getExamsSummary = ExamAdminService.getExamsSummary;
  static listExams = ExamAdminService.listExams;
  static getExamById = ExamAdminService.getExamById;
  static syncCalendarForExam = ExamAdminService.syncCalendarForExam;
  static createExam = ExamAdminService.createExam;
  static updateExam = ExamAdminService.updateExam;
  static deleteExam = ExamAdminService.deleteExam;
  static listExamDates = ExamAdminService.listExamDates;
  static createExamDate = ExamAdminService.createExamDate;
  static deleteExamDate = ExamAdminService.deleteExamDate;
  static listExamShifts = ExamAdminService.listExamShifts;
  static createExamShift = ExamAdminService.createExamShift;
  static deleteExamShift = ExamAdminService.deleteExamShift;
  static importRequirementSheet = ExamAdminService.importRequirementSheet;
  static getExamRequirementSheet = ExamAdminService.getExamRequirementSheet;
  static getExamSummary = ExamAdminService.getExamSummary;
  static syncExamSummary = ExamAdminService.syncExamSummary;
  static downloadExamRequirementSheet = ExamAdminService.downloadExamRequirementSheet;

  // ── Helper & Utility Methods ───────────────────────────────────────────────
  static extractCandidateTarget = ProjectAdminService.extractCandidateTarget;
  static extractFinancialYear = ProjectAdminService.extractFinancialYear;
}

export default AdminService;
