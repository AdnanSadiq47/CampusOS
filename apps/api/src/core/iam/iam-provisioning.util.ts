import {
  identityUsers,
  organizationMemberships,
  membershipNodeAssignments,
  assignmentRoles,
  roles,
  eq,
  and,
} from '@campus-os/database';
import { ProvisionAccountDto, LinkedAccountSummaryDto } from '@campus-os/types';
import { AuditService } from '../audit/audit.service.js';
import * as argon2 from 'argon2';

export async function provisionOrLinkAccountTx(
  tx: any,
  tenantId: string,
  hierarchyNodeId: string,
  account: ProvisionAccountDto | undefined,
  actorId: string | undefined,
  entityType: 'HEAD_OFFICE' | 'REGION' | 'SCHOOL' | 'BRANCH',
  auditService: AuditService
): Promise<LinkedAccountSummaryDto | null> {
  if (!account || !account.email) return null;
  const cleanEmail = account.email.trim().toLowerCase();
  if (!cleanEmail) return null;

  // 1. Find or create identity_users
  const [existingUser] = await tx
    .select()
    .from(identityUsers)
    .where(eq(identityUsers.email, cleanEmail))
    .limit(1);

  let userId: string;
  let isNewUser = false;

  if (existingUser) {
    userId = existingUser.id;
    if (account.temporaryPassword && account.temporaryPassword.trim()) {
      const passwordHash = await argon2.hash(account.temporaryPassword.trim(), {
        type: argon2.argon2id,
      });
      await tx
        .update(identityUsers)
        .set({
          passwordHash,
          isActive: account.isActive !== undefined ? account.isActive : existingUser.isActive,
          firstName: account.firstName?.trim() || existingUser.firstName,
          lastName: account.lastName?.trim() || existingUser.lastName,
          updatedAt: new Date(),
        })
        .where(eq(identityUsers.id, userId));
    }
  } else {
    isNewUser = true;
    const tempPass = account.temporaryPassword?.trim() || 'CampusOS@2026!';
    const passwordHash = await argon2.hash(tempPass, {
      type: argon2.argon2id,
    });
    const [newUser] = await tx
      .insert(identityUsers)
      .values({
        email: cleanEmail,
        passwordHash,
        firstName: account.firstName?.trim() || (entityType === 'HEAD_OFFICE' ? 'Head Office' : entityType === 'REGION' ? 'Regional' : entityType === 'BRANCH' ? 'Branch' : 'School'),
        lastName: account.lastName?.trim() || 'Admin',
        isActive: account.isActive !== undefined ? account.isActive : true,
      })
      .returning();
    userId = newUser!.id;

    await auditService.logEvent(
      {
        organizationId: tenantId,
        hierarchyNodeId,
        actorId: actorId || null,
        actorEmail: 'system@campus-os.local',
        module: 'IAM',
        action: `${entityType}_ACCOUNT_CREATED`,
        entityType: 'identity_user',
        entityId: userId,
        afterState: { email: cleanEmail, firstName: account.firstName, lastName: account.lastName },
      },
      tx
    );
  }

  // 2. Find or create organization_memberships
  const [existingMembership] = await tx
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, tenantId),
        eq(organizationMemberships.identityUserId, userId)
      )
    )
    .limit(1);

  let membershipId: string;
  if (existingMembership) {
    membershipId = existingMembership.id;
  } else {
    const [newMembership] = await tx
      .insert(organizationMemberships)
      .values({
        organizationId: tenantId,
        identityUserId: userId,
        membershipType: 'STAFF',
        status: 'ACTIVE',
      })
      .returning();
    membershipId = newMembership!.id;
  }

  // 3. Find or create membership_node_assignments
  const [existingAssignment] = await tx
    .select()
    .from(membershipNodeAssignments)
    .where(
      and(
        eq(membershipNodeAssignments.organizationId, tenantId),
        eq(membershipNodeAssignments.membershipId, membershipId),
        eq(membershipNodeAssignments.hierarchyNodeId, hierarchyNodeId)
      )
    )
    .limit(1);

  let assignmentId: string;
  if (existingAssignment) {
    assignmentId = existingAssignment.id;
    if (account.isActive !== undefined) {
      await tx
        .update(membershipNodeAssignments)
        .set({
          status: account.isActive ? 'ACTIVE' : 'SUSPENDED',
          updatedAt: new Date(),
        })
        .where(eq(membershipNodeAssignments.id, assignmentId));
    }
  } else {
    const [newAssignment] = await tx
      .insert(membershipNodeAssignments)
      .values({
        organizationId: tenantId,
        membershipId,
        hierarchyNodeId,
        isPrimary: true,
        status: account.isActive === false ? 'SUSPENDED' : 'ACTIVE',
        assignedBy: actorId || null,
      })
      .returning();
    assignmentId = newAssignment!.id;

    await auditService.logEvent(
      {
        organizationId: tenantId,
        hierarchyNodeId,
        actorId: actorId || null,
        actorEmail: 'system@campus-os.local',
        module: 'IAM',
        action: 'HIERARCHY_SCOPE_ASSIGNED',
        entityType: 'membership_node_assignment',
        entityId: assignmentId,
        afterState: { hierarchyNodeId, membershipId },
      },
      tx
    );

    if (!isNewUser) {
      await auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId,
          actorId: actorId || null,
          actorEmail: 'system@campus-os.local',
          module: 'IAM',
          action: `${entityType}_ACCOUNT_LINKED`,
          entityType: 'identity_user',
          entityId: userId,
          afterState: { email: cleanEmail, membershipId, assignmentId },
        },
        tx
      );
    }
  }

  // 4. Resolve & assign Role
  let targetRoleCode = account.roleCode;
  if (!targetRoleCode) {
    if (entityType === 'HEAD_OFFICE') targetRoleCode = 'HO_ADMIN';
    else if (entityType === 'REGION') targetRoleCode = 'REGION_ADMIN';
    else if (entityType === 'BRANCH') targetRoleCode = 'BRANCH_ADMIN';
    else targetRoleCode = 'SCHOOL_ADMIN';
  }

  let roleId = account.roleId;
  if (!roleId) {
    const [matchedRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.organizationId, tenantId),
          eq(roles.code, targetRoleCode)
        )
      )
      .limit(1);

    if (matchedRole) {
      roleId = matchedRole.id;
    } else {
      const [createdRole] = await tx
        .insert(roles)
        .values({
          organizationId: tenantId,
          code: targetRoleCode,
          name: targetRoleCode.replace(/_/g, ' '),
          description: `Automatic provisioned role for ${entityType}`,
          isSystem: true,
          isActive: true,
        })
        .returning();
      roleId = createdRole!.id;
    }
  }

  if (roleId) {
    const [existingRoleLink] = await tx
      .select()
      .from(assignmentRoles)
      .where(
        and(
          eq(assignmentRoles.organizationId, tenantId),
          eq(assignmentRoles.assignmentId, assignmentId),
          eq(assignmentRoles.roleId, roleId)
        )
      )
      .limit(1);

    if (!existingRoleLink) {
      await tx.insert(assignmentRoles).values({
        organizationId: tenantId,
        assignmentId,
        roleId,
      });

      await auditService.logEvent(
        {
          organizationId: tenantId,
          hierarchyNodeId,
          actorId: actorId || null,
          actorEmail: 'system@campus-os.local',
          module: 'IAM',
          action: 'ROLE_ASSIGNED',
          entityType: 'assignment_role',
          entityId: assignmentId,
          afterState: { roleId, roleCode: targetRoleCode },
        },
        tx
      );
    }
  }

  return {
    identityUserId: userId,
    email: cleanEmail,
    firstName: account.firstName || '',
    lastName: account.lastName || '',
    membershipId,
    roleId,
    roleCode: targetRoleCode,
    roleName: targetRoleCode,
    isActive: account.isActive !== false,
    assignedAt: new Date(),
  };
}

export async function resolveLinkedAccountTx(
  tx: any,
  tenantId: string,
  hierarchyNodeId: string
): Promise<LinkedAccountSummaryDto | null> {
  const [assignment] = await tx
    .select({
      assignmentId: membershipNodeAssignments.id,
      membershipId: membershipNodeAssignments.membershipId,
      hierarchyNodeId: membershipNodeAssignments.hierarchyNodeId,
      identityUserId: organizationMemberships.identityUserId,
      email: identityUsers.email,
      firstName: identityUsers.firstName,
      lastName: identityUsers.lastName,
      userIsActive: identityUsers.isActive,
      membershipStatus: organizationMemberships.status,
      roleId: roles.id,
      roleCode: roles.code,
      roleName: roles.name,
      assignedAt: membershipNodeAssignments.createdAt,
    })
    .from(membershipNodeAssignments)
    .innerJoin(organizationMemberships, eq(membershipNodeAssignments.membershipId, organizationMemberships.id))
    .innerJoin(identityUsers, eq(organizationMemberships.identityUserId, identityUsers.id))
    .leftJoin(assignmentRoles, eq(membershipNodeAssignments.id, assignmentRoles.assignmentId))
    .leftJoin(roles, eq(assignmentRoles.roleId, roles.id))
    .where(
      and(
        eq(membershipNodeAssignments.organizationId, tenantId),
        eq(membershipNodeAssignments.hierarchyNodeId, hierarchyNodeId),
        eq(membershipNodeAssignments.status, 'ACTIVE')
      )
    )
    .limit(1);

  if (!assignment) return null;

  return {
    identityUserId: assignment.identityUserId,
    email: assignment.email,
    firstName: assignment.firstName,
    lastName: assignment.lastName,
    membershipId: assignment.membershipId,
    roleId: assignment.roleId || null,
    roleCode: assignment.roleCode || null,
    roleName: assignment.roleName || null,
    isActive: assignment.userIsActive && assignment.membershipStatus === 'ACTIVE',
    assignedAt: assignment.assignedAt,
  };
}
