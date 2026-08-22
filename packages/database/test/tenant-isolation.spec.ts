import { describe, it, expect, vi } from 'vitest';
import { TenantTransactionManager } from '../src/tenant-transaction-manager.js';
import pg from 'pg';

describe('TenantTransactionManager Security & Isolation (Negative Tests)', () => {
  it('fails closed when tenantId is missing or empty', async () => {
    const mockPool = {} as pg.Pool;
    const manager = new TenantTransactionManager(mockPool);

    await expect(
      manager.runInTenantContext('', async () => {
        return 'data';
      })
    ).rejects.toThrow(/SECURITY_ERROR: Missing or invalid tenantId/);

    await expect(
      manager.runInTenantContext(null as any, async () => {
        return 'data';
      })
    ).rejects.toThrow(/SECURITY_ERROR: Missing or invalid tenantId/);
  });

  it('guarantees SET LOCAL is executed on the connection and cleans up on transaction completion', async () => {
    const mockClient = {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql === 'BEGIN') return Promise.resolve();
        if (sql.startsWith('SET LOCAL app.current_tenant_id')) return Promise.resolve();
        if (sql === 'COMMIT') return Promise.resolve();
        if (sql === 'ROLLBACK') return Promise.resolve();
        return Promise.resolve({ rows: [] });
      }),
      release: vi.fn(),
    };

    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    } as unknown as pg.Pool;

    const manager = new TenantTransactionManager(mockPool);
    const testTenantId = '11111111-1111-1111-1111-111111111111';

    const result = await manager.runInTenantContext(testTenantId, async () => {
      return 'tenant_a_secure_payload';
    });

    expect(result).toBe('tenant_a_secure_payload');
    expect(mockPool.connect).toHaveBeenCalledTimes(1);

    // Verify BEGIN -> SET LOCAL -> COMMIT sequence
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(2, 'SET LOCAL app.current_tenant_id = $1', [testTenantId]);
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back and releases connection safely on transaction error without leaking state', async () => {
    const mockClient = {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql === 'BEGIN') return Promise.resolve();
        if (sql.startsWith('SET LOCAL app.current_tenant_id')) return Promise.resolve();
        if (sql === 'ROLLBACK') return Promise.resolve();
        return Promise.resolve();
      }),
      release: vi.fn(),
    };

    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    } as unknown as pg.Pool;

    const manager = new TenantTransactionManager(mockPool);
    const testTenantId = '22222222-2222-2222-2222-222222222222';

    await expect(
      manager.runInTenantContext(testTenantId, async () => {
        throw new Error('Database operation failed');
      })
    ).rejects.toThrow('Database operation failed');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
