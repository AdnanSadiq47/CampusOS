import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantTransactionManager, navigationMenus, navigationItems, eq, and, asc } from '@campus-os/database';
import {
  CreateNavigationMenuDto,
  CreateNavigationItemDto,
  NavigationItem,
} from '@campus-os/types';

@Injectable()
export class NavigationService {
  constructor(private readonly txManager: TenantTransactionManager) {}

  /**
   * Create navigation menu
   */
  async createMenu(tenantId: string, dto: CreateNavigationMenuDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(navigationMenus)
        .where(and(eq(navigationMenus.organizationId, tenantId), eq(navigationMenus.code, dto.code)))
        .limit(1);

      if (existing) {
        throw new ConflictException(`Menu with code '${dto.code}' already exists`);
      }

      const [menu] = await tx
        .insert(navigationMenus)
        .values({
          organizationId: tenantId,
          code: dto.code,
          name: dto.name,
          isActive: true,
        })
        .returning();

      return menu;
    });
  }

  /**
   * Add item to menu
   */
  async addItem(tenantId: string, menuId: string, dto: CreateNavigationItemDto) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [menu] = await tx
        .select()
        .from(navigationMenus)
        .where(and(eq(navigationMenus.organizationId, tenantId), eq(navigationMenus.id, menuId)))
        .limit(1);

      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      const [item] = await tx
        .insert(navigationItems)
        .values({
          organizationId: tenantId,
          menuId,
          parentId: dto.parentId,
          label: dto.label,
          icon: dto.icon,
          routePath: dto.routePath,
          requiredModule: dto.requiredModule,
          requiredPermissions: (dto.requiredPermissions ?? []) as unknown as Record<string, unknown>,
          sortOrder: dto.sortOrder ?? 0,
          isActive: true,
        })
        .returning();

      return item;
    });
  }

  /**
   * Get active menu tree filtered by user permissions
   */
  async getActiveTree(tenantId: string, menuCode = 'main_sidebar', userPermissions: string[] = []) {
    return this.txManager.withTenant(tenantId, async (tx) => {
      const [menu] = await tx
        .select()
        .from(navigationMenus)
        .where(and(eq(navigationMenus.organizationId, tenantId), eq(navigationMenus.code, menuCode), eq(navigationMenus.isActive, true)))
        .limit(1);

      if (!menu) {
        return [];
      }

      const items = await tx
        .select()
        .from(navigationItems)
        .where(and(eq(navigationItems.organizationId, tenantId), eq(navigationItems.menuId, menu.id), eq(navigationItems.isActive, true)))
        .orderBy(asc(navigationItems.sortOrder));

      // Filter items based on user permissions
      const permittedItems = items.filter((item) => {
        const required = (item.requiredPermissions as unknown as string[]) ?? [];
        if (required.length === 0) return true;
        return required.some((perm) => userPermissions.includes(perm) || userPermissions.includes('*'));
      });

      // Build hierarchical tree
      return this.buildTree(permittedItems);
    });
  }

  private buildTree(items: any[]): NavigationItem[] {
    const itemMap = new Map<string, NavigationItem>();
    const roots: NavigationItem[] = [];

    for (const item of items) {
      itemMap.set(item.id, {
        id: item.id,
        organizationId: item.organizationId,
        menuId: item.menuId,
        parentId: item.parentId,
        label: item.label,
        icon: item.icon,
        routePath: item.routePath,
        requiredModule: item.requiredModule,
        requiredPermissions: item.requiredPermissions ?? [],
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        children: [],
        createdAt: item.createdAt,
      });
    }

    for (const item of itemMap.values()) {
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId)!.children!.push(item);
      } else {
        roots.push(item);
      }
    }

    return roots;
  }
}
