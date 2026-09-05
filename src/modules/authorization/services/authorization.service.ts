import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName },
      include: { rolePermissions: { include: { role: { include: { userRoles: true } } } } },
    });
    return permission?.rolePermissions.some((assignment) =>
      assignment.role.userRoles.some((userRole) => userRole.userId === userId),
    ) ?? false;
  }
}