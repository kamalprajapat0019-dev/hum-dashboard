import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { verifyPassword, hashPassword } from '../../utils/hasher.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../../utils/jwt.js';
import { LoginInput, RegisterFromInviteInput } from './auth.schemas.js';
import { Role } from '@prisma/client';
import { CentreService } from '../centre/centre.service.js';
import { NotificationService } from '../../services/notification.service.js';

export class AuthService {
  static async login(input: LoginInput, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        scope: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return { success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    if (user.status !== 'Active') {
      return {
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: `Account is ${user.status.toLowerCase()}. Please contact administrator.`,
      };
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      return { success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    // Execute lastLogin timestamp update and audit log recording in parallel
    const now = new Date();
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: now },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: user.id,
          details: { role: user.role, userAgent: 'Browser' },
          ipAddress,
        },
      }),
    ]);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || (user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'),
      status: user.status,
      scope: user.scope || { clients: ['all'], projects: ['all'], centres: ['all'] },
      lastLogin: user.lastLogin,
    };

    return { success: true, token, refreshToken, user: safeUser };
  }

  static async refreshToken(refreshTokenString: string) {
    if (!refreshTokenString || typeof refreshTokenString !== 'string') {
      return { success: false, code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is required' };
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(refreshTokenString);
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        return { success: false, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token has expired' };
      }
      return { success: false, code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or malformed' };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return { success: false, code: 'UNAUTHORIZED', message: 'User account not found' };
    }

    if (user.status !== 'Active') {
      return {
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: `Account is ${user.status.toLowerCase()}. Please contact administrator.`,
      };
    }

    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const newAccessToken = generateToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    return {
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        scope: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      avatar: user.avatar || (user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'),
    };
  }

  /**
   * Validates a 72-hour sign-up invite token
   */
  static async validateSignUpInvite(token: string) {
    const inv = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!inv) {
      return {
        valid: false,
        message: 'Invalid invitation token.',
      };
    }

    if (inv.status !== 'Pending' || inv.usedAt !== null) {
      return {
        valid: false,
        message: 'This invitation link has already been used or revoked.',
      };
    }

    if (inv.expiresAt < new Date()) {
      return {
        valid: false,
        isExpired: true,
        message: 'This invitation link has expired. Please request a fresh invitation link from the administrator.',
      };
    }

    return {
      valid: true,
      invitation: {
        id: inv.id,
        email: inv.email,
        name: inv.name,
        role: inv.role,
        whatsappNumber: inv.whatsappNumber || inv.phone,
        expiresAt: inv.expiresAt,
        inviter: inv.inviter,
      },
    };
  }

  /**
   * Registers a Centre User account from a valid invitation link
   */
  static async registerFromInvite(input: RegisterFromInviteInput) {
    const val = await this.validateSignUpInvite(input.token);
    if (!val.valid || !val.invitation) {
      throw new Error(val.message || 'Invitation token is not valid.');
    }

    const cleanEmail = input.email.toLowerCase().trim();
    if (val.invitation.email.toLowerCase().trim() !== cleanEmail) {
      throw new Error('Registration email must match the invited official email address.');
    }

    const cleanMobile = (input.mobile || (input as any).mobileNumber || (input as any).phone || '').trim();
    const cleanName = input.name ? input.name.trim() : input.centreName.trim();

    // 1. Resolve existing user outside transaction to minimize lock hold time
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, centreId: true, status: true },
    });

    if (existingUser && existingUser.status === 'Active') {
      throw new Error('An active account already exists for this email address. Please log in directly.');
    }

    // 2. Resolve existing centre outside transaction
    let existingCentre: { id: string; centreCode: string } | null = null;
    if (existingUser?.centreId) {
      existingCentre = await prisma.centre.findUnique({
        where: { id: existingUser.centreId },
        select: { id: true, centreCode: true },
      });
    }
    if (!existingCentre) {
      existingCentre = await prisma.centre.findFirst({
        where: { officialEmail: cleanEmail },
        select: { id: true, centreCode: true },
      });
    }

    // 3. Compute bcrypt password hash outside transaction
    const passwordHash = await hashPassword(input.password);

    // 4. Run minimal DB mutation inside transaction with extended timeouts (maxWait: 15s, timeout: 30s)
    let attempts = 0;
    while (attempts < 5) {
      try {
        return await prisma.$transaction(
          async (tx) => {
            let centreId: string;
            let centreCode: string;

            if (existingCentre) {
              const updatedCentre = await tx.centre.update({
                where: { id: existingCentre.id },
                data: {
                  centreName: input.centreName.trim(),
                  officialMobile: cleanMobile,
                },
                select: { id: true, centreCode: true },
              });
              centreId = updatedCentre.id;
              centreCode = updatedCentre.centreCode;
            } else {
              centreCode = await CentreService.generateCentreCode(tx);
              const createdCentre = await tx.centre.create({
                data: {
                  centreCode,
                  centreName: input.centreName.trim(),
                  officialEmail: cleanEmail,
                  officialMobile: cleanMobile,
                  centreStatus: 'Draft',
                  centreAddress: '',
                  pincode: '',
                },
                select: { id: true, centreCode: true },
              });
              centreId = createdCentre.id;
            }

            // Create or update User in Inactive status pending OTP verification
            let userId: string;
            if (existingUser) {
              const updatedUser = await tx.user.update({
                where: { id: existingUser.id },
                data: {
                  name: cleanName,
                  phoneNumber: cleanMobile,
                  passwordHash,
                  status: 'Inactive',
                  centreId,
                },
                select: { id: true },
              });
              userId = updatedUser.id;
            } else {
              const createdUser = await tx.user.create({
                data: {
                  email: cleanEmail,
                  name: cleanName,
                  phoneNumber: cleanMobile,
                  passwordHash,
                  role: Role.CENTRE,
                  status: 'Inactive',
                  centreId,
                },
                select: { id: true },
              });
              userId = createdUser.id;
            }

            // Link Centre -> userId
            await tx.centre.update({
              where: { id: centreId },
              data: { userId },
            });

            // Mark Invitation used
            await tx.userInvitation.update({
              where: { id: val.invitation!.id },
              data: {
                usedAt: new Date(),
                status: 'Accepted',
                centreId,
              },
            });

            // Audit Log
            await tx.auditLog.create({
              data: {
                userId,
                userEmail: cleanEmail,
                action: 'CENTRE_USER_REGISTERED_FROM_INVITE',
                entity: 'User',
                entityId: userId,
                details: {
                  centreId,
                  centreCode,
                  centreName: input.centreName.trim(),
                },
              },
            });

            return {
              success: true,
              message: 'Account registered successfully. Please verify your email and WhatsApp mobile number.',
              userId,
              centreId,
              centreCode,
              requiresOtp: true,
              token: input.token,
            };
          },
          {
            maxWait: 15000,
            timeout: 30000,
          }
        );
      } catch (err: any) {
        if (err?.code === 'P2002' && attempts < 4) {
          attempts++;
          await new Promise((r) => setTimeout(r, 60 * attempts + Math.floor(Math.random() * 40)));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Registration failed. Please try again.');
  }

  /**
   * Verifies Email or Mobile OTP and activates account
   */
  static async verifyInviteOtp(token: string, otpType: 'EMAIL' | 'MOBILE', otpCode: string) {
    const inv = await prisma.userInvitation.findUnique({
      where: { token },
    });

    if (!inv) {
      throw new Error('Invitation record not found.');
    }

    if (!otpCode || otpCode.trim().length < 4) {
      throw new Error('Invalid OTP code. Please enter a valid 6-digit verification code.');
    }

    const now = new Date();

    return prisma.$transaction(
      async (tx) => {
        const updateData: any = {};
        if (otpType === 'EMAIL') {
          updateData.emailVerifiedAt = now;
        } else {
          updateData.mobileVerifiedAt = now;
        }

        await tx.userInvitation.update({
          where: { id: inv.id },
          data: updateData,
        });

        const user = await tx.user.findUnique({
          where: { email: inv.email },
        });

        if (user && user.status === 'Inactive') {
          await tx.user.update({
            where: { id: user.id },
            data: { status: 'Active' },
          });

          await tx.auditLog.create({
            data: {
              userId: user.id,
              userEmail: user.email,
              action: 'USER_ACTIVATED_VIA_OTP',
              entity: 'User',
              entityId: user.id,
              details: { otpType, verifiedAt: now },
            },
          });
        }

        return {
          success: true,
          verified: true,
          isFullyActivated: true,
          message: `${otpType === 'EMAIL' ? 'Email' : 'WhatsApp Mobile'} verified successfully. Account is now active.`,
        };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );
  }

  /**
   * Resends verification OTP or requests fresh invitation
   */
  static async resendInviteOtp(token: string, otpType: 'EMAIL' | 'MOBILE') {
    const inv = await prisma.userInvitation.findUnique({
      where: { token },
    });

    if (!inv) {
      throw new Error('Invitation record not found.');
    }

    if (inv.expiresAt < new Date()) {
      return {
        success: false,
        isExpired: true,
        message: 'This sign-up link has expired (72-hour window elapsed). Please request a fresh invitation link.',
      };
    }

    await prisma.userInvitation.update({
      where: { id: inv.id },
      data: { resendCount: inv.resendCount + 1 },
    });

    return {
      success: true,
      message: `A new verification code has been dispatched to your ${otpType.toLowerCase()}.`,
      resendCount: inv.resendCount + 1,
    };
  }

  /**
   * Allows requesting a new sign-up link if 72-hour window has expired (FRD Sec. 4.1)
   */
  static async requestNewSignUpLink(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const inv = await prisma.userInvitation.findFirst({
      where: { email: cleanEmail, role: Role.CENTRE },
      orderBy: { createdAt: 'desc' },
    });

    if (!inv) {
      return {
        success: false,
        message: 'No previous invitation found for this email address. Please contact Operations to request a sign-up link.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await prisma.userInvitation.update({
      where: { id: inv.id },
      data: {
        token,
        expiresAt,
        status: 'Pending',
        usedAt: null,
        resendCount: inv.resendCount + 1,
      },
    });

    const registrationUrl = `/invite/register?token=${token}`;

    // Actively dispatch renewed 72-hour sign-up link to Email and WhatsApp
    let dispatchResult: any;
    try {
      dispatchResult = await NotificationService.dispatchSignUpLink({
        centreName: inv.name,
        email: inv.email,
        whatsappNumber: inv.whatsappNumber || inv.phone || '',
        token,
        registrationUrl,
        expiresAt,
      });

      await prisma.userInvitation.update({
        where: { id: inv.id },
        data: {
          emailDispatched: dispatchResult.email.sent,
          whatsappDispatched: dispatchResult.whatsapp.sent,
          lastDispatchedAt: new Date(),
          dispatchStatus: dispatchResult as any,
        } as any,
      });
    } catch (dispatchErr) {
      console.error('[REQUEST_NEW_INVITE:DISPATCH:ERROR]', dispatchErr);
    }

    return {
      success: true,
      message: 'A fresh 72-hour sign-up link has been generated and dispatched to your email and WhatsApp mobile number.',
      registrationUrl,
      fullRegistrationUrl: NotificationService.getFullRegistrationUrl(registrationUrl),
      expiresAt,
      dispatch: dispatchResult,
    };
  }
}
