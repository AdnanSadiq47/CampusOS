import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  /**
   * Hashes a password using Argon2id with cryptographically secure work factors
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: Number(process.env['ARGON2_MEMORY_COST'] || 65536),
      timeCost: Number(process.env['ARGON2_TIME_COST'] || 3),
      parallelism: Number(process.env['ARGON2_PARALLELISM'] || 4),
    });
  }

  /**
   * Verifies a candidate password against an Argon2 hash
   */
  async verify(hash: string, candidate: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, candidate);
    } catch {
      return false;
    }
  }
}
