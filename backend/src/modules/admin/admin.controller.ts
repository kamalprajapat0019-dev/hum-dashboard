import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { AdminService } from './admin.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AdminController {
  // ── Executive Analytics ──────────────────────────────────────────────────
  static async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId, projectId, examTypeId, examId } = req.query as {
        clientId?: string;
        projectId?: string;
        examTypeId?: string;
        examId?: string;
      };
      const data = await AdminService.getExecutiveAnalytics({
        clientId,
        projectId,
        examTypeId,
        examId,
      });
      sendSuccess(res, data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'Client not found') {
          sendError(res, 404, 'CLIENT_NOT_FOUND', 'Selected client does not exist in the database');
          return;
        }
        if (err.message.includes('not found')) {
          sendError(res, 404, 'NOT_FOUND', err.message);
          return;
        }
        if (err.message.includes('does not belong to')) {
          sendError(res, 400, 'INVALID_HIERARCHY', err.message);
          return;
        }
      }
      const msg = err instanceof Error ? err.message : 'Failed to retrieve analytics';
      sendError(res, 500, 'ANALYTICS_ERROR', msg);
    }
  }

  // ── Users ────────────────────────────────────────────────────────────────
  static async getUserSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const summary = await AdminService.getUserSummary(
        req.user?.role as any,
        req.user?.userId
      );
      sendSuccess(res, summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve user summary';
      sendError(res, 500, 'USER_SUMMARY_ERROR', msg);
    }
  }

  static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, role, status, sortBy, sortOrder } = req.query as any;
      const result = await AdminService.listUsers({
        page: page || 1,
        limit: limit || 10,
        search,
        role,
        status,
        sortBy,
        sortOrder,
        callerRole: req.user?.role as any,
        callerUserId: req.user?.userId,
      });
      sendSuccess(res, result.users, 200, result.meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list users';
      sendError(res, 500, 'USER_LIST_ERROR', msg);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await AdminService.createUser(
        req.body,
        req.user!.userId,
        req.user!.email,
        req.user?.role as any
      );
      sendSuccess(res, user, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      const code = (msg.toLowerCase().includes('domain') || msg.toLowerCase().includes('approved organisation'))
        ? 'DOMAIN_NOT_ALLOWED'
        : 'USER_CREATION_FAILED';
      sendError(res, 400, code, msg);
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.params.id === 'summary') {
        return AdminController.getUserSummary(req, res);
      }
      const user = await AdminService.getUserById(req.params.id as string);
      sendSuccess(res, user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User not found';
      sendError(res, 404, 'USER_NOT_FOUND', msg);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateUser(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.email,
        req.user?.role as any
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      sendError(res, 400, 'USER_UPDATE_FAILED', msg);
    }
  }

  static async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.activateUser(
        req.params.id as string,
        req.user!.userId,
        req.user!.email,
        req.user?.role as any
      );
      sendSuccess(res, result, 200, { message: 'User activated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to activate user';
      sendError(res, 400, 'USER_ACTIVATION_FAILED', msg);
    }
  }

  static async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.deactivateUser(
        req.params.id as string,
        req.user!.userId,
        req.user!.email,
        req.user?.role as any
      );
      sendSuccess(res, result, 200, { message: 'User deactivated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate user';
      sendError(res, 400, 'USER_DEACTIVATION_FAILED', msg);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await AdminService.deleteUser(
        req.params.id as string,
        req.user!.userId,
        req.user!.email,
        req.user?.role as any
      );
      sendSuccess(res, { message: 'User deactivated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate user';
      sendError(res, 400, 'USER_DELETION_FAILED', msg);
    }
  }

  static async initiatePasswordReset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.initiatePasswordReset(
        req.params.id as string,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate password reset';
      sendError(res, 400, 'PASSWORD_RESET_FAILED', msg);
    }
  }

  static async inviteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await AdminService.inviteCentreUser(
        req.body,
        req.user!.userId,
        req.user!.email,
        req.user?.role as any
      );
      sendSuccess(res, result, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation';
      sendError(res, 400, 'INVITATION_FAILED', msg);
    }
  }

  static async getAllowedDomains(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const domains = await AdminService.getAllowedDomains();
      sendSuccess(res, domains);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch allowed domains';
      sendError(res, 500, 'DOMAINS_FETCH_ERROR', msg);
    }
  }

  static async addAllowedDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        sendError(res, 400, 'INVALID_DOMAIN', 'Domain is required');
        return;
      }
      const created = await AdminService.addAllowedDomain(domain, req.user!.userId);
      sendSuccess(res, created, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add allowed domain';
      sendError(res, 400, 'DOMAIN_CREATION_FAILED', msg);
    }
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  static async listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, status, stage, clientId, projectId, examTypeId } = req.query as any;
      const result = await AdminService.listProjects({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        status,
        stage,
        clientId,
        projectId,
        examTypeId,
      });
      sendSuccess(res, result.projects, 200, result.meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list projects';
      sendError(res, 500, 'PROJECT_LIST_ERROR', msg);
    }
  }

  static async createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const project = await AdminService.createProject(
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, project, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      sendError(res, 400, 'PROJECT_CREATION_FAILED', msg);
    }
  }

  static async getProjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const project = await AdminService.getProjectById(req.params.id as string);
      sendSuccess(res, project);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Project not found';
      sendError(res, 404, 'PROJECT_NOT_FOUND', msg);
    }
  }

  static async updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateProject(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update project';
      sendError(res, 400, 'PROJECT_UPDATE_FAILED', msg);
    }
  }

  static async updateProjectStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateProjectStatus(
        req.params.id as string,
        req.body.status,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update project status';
      sendError(res, 400, 'PROJECT_STATUS_UPDATE_FAILED', msg);
    }
  }

  // ── Calendar Synchronization ─────────────────────────────────────────────
  static async getCalendarExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { year, month, clientId, agency, date } = req.query as any;
      const result = await AdminService.getCalendarExams({
        year: year ? parseInt(year, 10) : undefined,
        month: month ? parseInt(month, 10) : undefined,
        clientId: clientId || undefined,
        agency: agency || undefined,
        date: date || undefined,
      });
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch calendar examinations';
      sendError(res, 400, 'CALENDAR_FETCH_FAILED', msg);
    }
  }

  // ── Centres ──────────────────────────────────────────────────────────────
  static async getCentresSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.query as { clientId?: string };
      const summary = await AdminService.getCentresSummary(clientId);
      sendSuccess(res, summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve centre summary';
      sendError(res, 500, 'CENTRE_SUMMARY_ERROR', msg);
    }
  }

  static async listCentres(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, regionId, stateId, cityId, status, eligibilityStatus } = req.query as any;
      const result = await AdminService.listCentres({
        page: page || 1,
        limit: limit || 20,
        search,
        regionId,
        stateId,
        cityId,
        status,
        eligibilityStatus,
      });
      sendSuccess(res, result.centres, 200, result.meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list centres';
      sendError(res, 500, 'CENTRE_LIST_ERROR', msg);
    }
  }

  static async createCentre(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const centre = await AdminService.createCentre(
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, centre, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create centre';
      sendError(res, 400, 'CENTRE_CREATION_FAILED', msg);
    }
  }

  static async getCentreById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const centre = await AdminService.getCentreById(req.params.id as string);
      sendSuccess(res, centre);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Centre not found';
      sendError(res, 404, 'CENTRE_NOT_FOUND', msg);
    }
  }

  static async updateCentre(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateCentre(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update centre';
      sendError(res, 400, 'CENTRE_UPDATE_FAILED', msg);
    }
  }

  static async updateCentreStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateCentreStatus(
        req.params.id as string,
        req.body.status,
        req.body.reason,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update centre status';
      sendError(res, 400, 'STATUS_UPDATE_FAILED', msg);
    }
  }

  static async getCentreProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const profile = await AdminService.getCentreProfile(
        req.params.id as string,
        req.user!.role,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve centre profile';
      sendError(res, 404, 'CENTRE_PROFILE_NOT_FOUND', msg);
    }
  }

  static async verifyDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId, status, remarks, rejectionReason } = req.body;
      const result = await AdminService.verifyDocument(
        req.params.id as string,
        documentId,
        status,
        remarks,
        rejectionReason,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify document';
      sendError(res, 400, 'DOCUMENT_VERIFY_ERROR', msg);
    }
  }

  static async verifyBank(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, remarks, rejectionReason } = req.body;
      const result = await AdminService.verifyBank(
        req.params.id as string,
        status,
        remarks,
        rejectionReason,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify bank account';
      sendError(res, 400, 'BANK_VERIFY_ERROR', msg);
    }
  }

  static async approveApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { remarks } = req.body;
      const result = await AdminService.approveApplication(
        req.params.id as string,
        remarks,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve centre application';
      sendError(res, 400, 'APPROVE_FAILED', msg);
    }
  }

  static async rejectApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      const result = await AdminService.rejectApplication(
        req.params.id as string,
        reason,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject centre application';
      sendError(res, 400, 'REJECT_FAILED', msg);
    }
  }

  static async assignAuditor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { auditorId, auditDate, remarks } = req.body;
      const result = await AdminService.assignAuditor(
        req.params.id as string,
        auditorId,
        auditDate,
        remarks,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign auditor';
      sendError(res, 400, 'ASSIGN_AUDITOR_FAILED', msg);
    }
  }

  // ── Eligibility & Blacklist ──────────────────────────────────────────────
  static async blacklistCentre(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const record = await AdminService.blacklistCentre(
        req.body.centreId,
        req.body.reason,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, record, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to blacklist centre';
      sendError(res, 400, 'BLACKLIST_FAILED', msg);
    }
  }

  static async overrideEligibility(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.overrideEligibility(
        req.body.centreId,
        req.body.eligibilityStatus,
        req.body.overrideReason,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to override eligibility';
      sendError(res, 400, 'OVERRIDE_FAILED', msg);
    }
  }

  // ── Audit Logs & System Config ───────────────────────────────────────────
  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, action, entity } = req.query as any;
      const result = await AdminService.getAuditLogs({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 25,
        action,
        entity,
      });
      sendSuccess(res, result.logs, 200, result.meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve audit logs';
      sendError(res, 500, 'AUDIT_LOG_ERROR', msg);
    }
  }

  static async getSystemConfigs(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const configs = await AdminService.getSystemConfigs();
      sendSuccess(res, configs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve configs';
      sendError(res, 500, 'CONFIG_ERROR', msg);
    }
  }

  static async updateSystemConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await AdminService.updateSystemConfig(
        req.params.key as string,
        req.body.value,
        req.body.category,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update config';
      sendError(res, 400, 'CONFIG_UPDATE_FAILED', msg);
    }
  }

  // ── Client Management ───────────────────────────────────────────────────
  static async listClients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, status } = req.query as any;
      const result = await AdminService.listClients({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        status,
      });
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list clients';
      sendError(res, 500, 'CLIENTS_FETCH_ERROR', msg);
    }
  }

  static async getClientById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const client = await AdminService.getClientById(req.params.id as string);
      sendSuccess(res, client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Client not found';
      sendError(res, 404, 'CLIENT_NOT_FOUND', msg);
    }
  }

  static async createClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const client = await AdminService.createClient(
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, client, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create client';
      sendError(res, 400, 'CLIENT_CREATION_FAILED', msg);
    }
  }

  static async updateClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const client = await AdminService.updateClient(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update client';
      sendError(res, 400, 'CLIENT_UPDATE_FAILED', msg);
    }
  }

  static async updateClientStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const client = await AdminService.updateClientStatus(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update client status';
      sendError(res, 400, 'CLIENT_STATUS_UPDATE_FAILED', msg);
    }
  }

  // ── Exam Types Management ────────────────────────────────────────────────
  static async listExamTypes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, projectId, clientId, isActive } = req.query as any;
      const result = await AdminService.listExamTypes({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        projectId,
        clientId,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : undefined,
      });
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list exam types';
      sendError(res, 500, 'EXAM_TYPES_FETCH_ERROR', msg);
    }
  }

  static async getExamTypeById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examType = await AdminService.getExamTypeById(req.params.id as string);
      sendSuccess(res, examType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Exam type not found';
      sendError(res, 404, 'EXAM_TYPE_NOT_FOUND', msg);
    }
  }

  static async createExamType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examType = await AdminService.createExamType(
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, examType, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create exam type';
      sendError(res, 400, 'EXAM_TYPE_CREATION_FAILED', msg);
    }
  }

  static async updateExamType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examType = await AdminService.updateExamType(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, examType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update exam type';
      sendError(res, 400, 'EXAM_TYPE_UPDATE_FAILED', msg);
    }
  }

  static async updateExamTypeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examType = await AdminService.updateExamTypeStatus(
        req.params.id as string,
        req.body.isActive,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, examType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update exam type status';
      sendError(res, 400, 'EXAM_TYPE_STATUS_UPDATE_FAILED', msg);
    }
  }

  static async deleteExamType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await AdminService.deleteExamType(
        req.params.id as string,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, { message: 'Exam type deleted successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete exam type';
      sendError(res, 400, 'EXAM_TYPE_DELETION_FAILED', msg);
    }
  }

  // ── Exam Instances Management ────────────────────────────────────────────
  static async listExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, examTypeId, projectId, clientId, status } = req.query as any;
      const result = await AdminService.listExams({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        examTypeId,
        projectId,
        clientId,
        status,
      });
      sendSuccess(res, result.data, 200, result.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list exams';
      sendError(res, 500, 'EXAMS_FETCH_ERROR', msg);
    }
  }

  static async getExamById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const exam = await AdminService.getExamById(req.params.id as string);
      sendSuccess(res, exam);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Exam not found';
      sendError(res, 404, 'EXAM_NOT_FOUND', msg);
    }
  }

  static async createExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const exam = await AdminService.createExam(
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, exam, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create exam';
      sendError(res, 400, 'EXAM_CREATION_FAILED', msg);
    }
  }

  static async updateExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const exam = await AdminService.updateExam(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, exam);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update exam';
      sendError(res, 400, 'EXAM_UPDATE_FAILED', msg);
    }
  }

  static async deleteExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await AdminService.deleteExam(
        req.params.id as string,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, { message: 'Exam deleted successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete exam';
      sendError(res, 400, 'EXAM_DELETION_FAILED', msg);
    }
  }

  // ── Exam Dates Management ────────────────────────────────────────────────
  static async listExamDates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dates = await AdminService.listExamDates(req.params.examId as string);
      sendSuccess(res, dates);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list exam dates';
      sendError(res, 500, 'EXAM_DATES_FETCH_ERROR', msg);
    }
  }

  static async createExamDate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const date = await AdminService.createExamDate(
        req.params.examId as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, date, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create exam date';
      sendError(res, 400, 'EXAM_DATE_CREATION_FAILED', msg);
    }
  }

  static async deleteExamDate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await AdminService.deleteExamDate(
        req.params.dateId as string,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, { message: 'Exam date deleted successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete exam date';
      sendError(res, 400, 'EXAM_DATE_DELETION_FAILED', msg);
    }
  }

  // ── Exam Shifts Management ───────────────────────────────────────────────
  static async listExamShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const shifts = await AdminService.listExamShifts(req.params.dateId as string);
      sendSuccess(res, shifts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list exam shifts';
      sendError(res, 500, 'EXAM_SHIFTS_FETCH_ERROR', msg);
    }
  }

  static async createExamShift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const shift = await AdminService.createExamShift(
        req.params.dateId as string,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, shift, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create exam shift';
      sendError(res, 400, 'EXAM_SHIFT_CREATION_FAILED', msg);
    }
  }

  static async deleteExamShift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await AdminService.deleteExamShift(
        req.params.shiftId as string,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, { message: 'Exam shift deleted successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete exam shift';
      sendError(res, 400, 'EXAM_SHIFT_DELETION_FAILED', msg);
    }
  }
}
