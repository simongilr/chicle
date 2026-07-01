import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { FlowOutboxEvent } from '../flows/flow-outbox-event.entity';
import { RecordEntity } from './record.entity';

export interface CreateRecordRequest {
  recordType?: string;
  formKey?: string | null;
  formVersion?: number | null;
  idempotencyKey?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(RecordEntity)
    private readonly records: Repository<RecordEntity>
  ) {}

  findAll(auth: AuthContext) {
    return this.records.find({
      where: { tenantId: auth.tenant.id },
      order: { id: 'DESC' }
    });
  }

  async findOne(auth: AuthContext, id: string) {
    const record = await this.records.findOne({
      where: { id, tenantId: auth.tenant.id }
    });
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    return record;
  }

  async create(auth: AuthContext, body: CreateRecordRequest) {
    const recordType = body.recordType?.trim().toLowerCase();
    const idempotencyKey = body.idempotencyKey?.trim();
    if (!recordType || !idempotencyKey || !body.data) {
      throw new BadRequestException('recordType, idempotencyKey and data are required');
    }
    if (!/^[a-z][a-z0-9_.-]{1,119}$/.test(recordType)) {
      throw new BadRequestException('recordType contains invalid characters');
    }
    const existing = await this.records.findOne({
      where: { tenantId: auth.tenant.id, idempotencyKey }
    });
    if (existing) {
      return existing;
    }

    try {
      return await this.records.manager.transaction(async (manager) => {
        const record = await manager.save(
          RecordEntity,
          manager.create(RecordEntity, {
            tenantId: auth.tenant.id,
            recordType,
            formKey: body.formKey?.trim() || null,
            formVersion: body.formVersion ?? null,
            idempotencyKey,
            data: body.data,
            metadata: body.metadata ?? null
          })
        );
        const payload = {
          ...body.data,
          record: {
            id: record.id,
            recordType: record.recordType,
            formKey: record.formKey,
            formVersion: record.formVersion,
            metadata: record.metadata
          }
        };
        const events = [
          { key: 'record.created', suffix: 'generic' },
          { key: `record.${record.recordType}.created`, suffix: 'typed' }
        ];
        if (record.formKey) {
          events.push({
            key: `form.${record.formKey.toLowerCase()}.submitted`,
            suffix: 'form'
          });
        }
        await manager.save(
          FlowOutboxEvent,
          events.map((event) =>
            manager.create(FlowOutboxEvent, {
              tenantId: auth.tenant.id,
              eventKey: event.key,
              aggregateType: 'record',
              aggregateId: record.id,
              idempotencyKey: `record:${auth.tenant.id}:${idempotencyKey}:${event.suffix}`,
              payload,
              headers: { source: 'records.create' },
              status: 'pending',
              attempts: 0,
              availableAt: new Date(),
              createdByUserId: auth.user.id
            })
          )
        );
        return record;
      });
    } catch (error) {
      const concurrent = await this.records.findOne({
        where: { tenantId: auth.tenant.id, idempotencyKey }
      });
      if (concurrent) {
        return concurrent;
      }
      throw error;
    }
  }
}
