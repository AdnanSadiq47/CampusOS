export interface OutboxEventDTO {
  id: string;
  organizationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  createdAt: Date;
  processedAt?: Date | null;
}

export interface TenantJobEnvelope<T = unknown> {
  tenantId: string;
  actorId?: string;
  scopeNodePath?: string;
  timestamp: string;
  payload: T;
}
