import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { ChicleVaultService } from './chicle-vault.service';

describe('ChicleVaultService', () => {
  let vaultDir: string;

  afterEach(() => {
    if (vaultDir) {
      rmSync(vaultDir, { recursive: true, force: true });
    }
  });

  it('encrypts secrets, decrypts them with the same vault key, and only exposes a mask', () => {
    vaultDir = mkdtempSync(join(tmpdir(), 'chicle-vault-'));
    const config = new ConfigService({ CHICLE_VAULT_PATH: vaultDir });
    const vault = new ChicleVaultService(config);

    const payload = vault.encrypt('super-secret-token');

    expect(payload.algorithm).toBe('aes-256-gcm');
    expect(payload.encryptedValue).not.toContain('super-secret-token');
    expect(payload.maskedPreview).toBe('configured · ends with oken');
    expect(vault.decrypt(payload)).toBe('super-secret-token');
    expect(vault.status()).toMatchObject({
      provider: 'self_managed',
      healthy: true
    });
  });
});
