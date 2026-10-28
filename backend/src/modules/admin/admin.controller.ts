import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { AdminService } from './admin.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AdminController {
  // ── Executive Analytics ──────────────────────────────────────────────────
  static async getAnalytics(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await AdminService.getExecutiveAnalytics();
      sendSuccess(res, data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve analytics';
      sendError(res, 500, 'ANALYTICS_ERROR', msg);
    }
  }

  // ── Users ────────────────────────────────────────────────────────────────
  static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, role, status } = req.query as any;
      const result = await AdminService.listUsers({
        page: page || 1,
        limit: limit || 20,
        search,
        role,
        status,
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
        req.user!.email
      );
      sendSuccess(res, user, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      sendError(res, 400, 'USER_CREATION_FAILED', msg);
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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
        req.user!.email
      );
      sendSuccess(res, updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      sendError(res, 400, 'USER_UPDATE_FAILED', msg);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await AdminService.deleteUser(
        req.params.id as string,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, { message: 'User deactivated successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate user';
      sendError(res, 400, 'USER_DELETION_FAILED', msg);
    }
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  static async listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, search, status, stage, clientId } = req.query as any;
      const result = await AdminService.listProjects({
        page: page || 1,
        limit: limit || 20,
        search,
        status,
        stage,
        clientId,
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

  // ── Centres ──────────────────────────────────────────────────────────────
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
}
