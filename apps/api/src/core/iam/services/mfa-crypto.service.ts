import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class MfaCryptoService {
  private readonly algorithm = 'aes-256-gcm';

  private getMasterKey(): Buffer {
    const rawKey =
      process.env['MFA_ENCRYPTION_KEY_V1'] || 'development_mfa_encryption_key_32_bytes_long_minimum!';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  encrypt(secret: string): { encrypted: Buffer; iv: Buffer; keyVersion: number } {
    const iv = crypto.randomBytes(12);
    const key = this.getMasterKey();
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final(), cipher.getAuthTag()]);

    return {
      encrypted,
      iv,
      keyVersion: 1,
    };
  }

  decrypt(encryptedWithTag: Buffer, iv: Buffer, _keyVersion = 1): string {
    const key = this.getMasterKey();
    // In AES-256-GCM, the auth tag is 16 bytes at the end
    const tag = encryptedWithTag.subarray(encryptedWithTag.length - 16);
    const encrypted = encryptedWithTag.subarray(0, encryptedWithTag.length - 16);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
