import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EncryptedSecretPayload {
  encryptedValue: string;
  iv: string;
  authTag: string;
  algorithm: 'aes-256-gcm';
  keyVersion: string;
  maskedPreview: string;
}

@Injectable()
export class ChicleVaultService {
  private readonly logger = new Logger(ChicleVaultService.name);
  private readonly key: Buffer;
  private readonly keyVersion = 'local-v1';

  constructor(private readonly config: ConfigService) {
    this.key = this.loadOrCreateMasterKey();
  }

  encrypt(value: string): EncryptedSecretPayload {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedValue: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: 'aes-256-gcm',
      keyVersion: this.keyVersion,
      maskedPreview: this.mask(value)
    };
  }

  decrypt(payload: Pick<EncryptedSecretPayload, 'encryptedValue' | 'iv' | 'authTag'>): string {
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(payload.encryptedValue, 'base64')),
      decipher.final()
    ]).toString('utf8');
  }

  status() {
    return {
      provider: 'self_managed',
      keyVersion: this.keyVersion,
      vaultPath: this.vaultPath(),
      healthy: true
    };
  }

  private loadOrCreateMasterKey(): Buffer {
    const configured = this.config.get<string>('CHICLE_SECRET_MASTER_KEY');
    if (configured) {
      return this.normalizeKey(configured);
    }

    const path = this.vaultPath();
    mkdirSync(path, { recursive: true });
    const keyPath = join(path, 'master.key');
    if (existsSync(keyPath)) {
      return this.normalizeKey(readFileSync(keyPath, 'utf8').trim());
    }

    const generated = randomBytes(32).toString('base64');
    writeFileSync(keyPath, `${generated}\n`, { encoding: 'utf8', flag: 'wx' });
    try {
      chmodSync(keyPath, 0o600);
    } catch {
      this.logger.warn(`Could not chmod Chicle Vault key at ${keyPath}`);
    }
    this.logger.warn(`Generated local Chicle Vault key at ${keyPath}. Back it up before using this environment.`);
    return Buffer.from(generated, 'base64');
  }

  private vaultPath() {
    return this.config.get<string>('CHICLE_VAULT_PATH') ?? '.chicle/vault';
  }

  private normalizeKey(raw: string): Buffer {
    const trimmed = raw.trim();
    const base64 = Buffer.from(trimmed, 'base64');
    if (base64.length === 32) {
      return base64;
    }

    if (/^[a-f0-9]{64}$/i.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }

    return createHash('sha256').update(trimmed).digest();
  }

  private mask(value: string) {
    if (!value) {
      return 'configured';
    }
    const suffix = value.slice(-4);
    return `configured · ends with ${suffix}`;
  }
}
