import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AppConfig } from '../config/configuration';

const HEADER = 'x-organizer-key';

/**
 * Protege acciones de organizador (sortear / limpiar). Si ORGANIZER_KEY no está
 * configurada, opera en "modo abierto" (útil en dev) y avisa una vez.
 */
@Injectable()
export class OrganizerGuard implements CanActivate {
  private readonly logger = new Logger(OrganizerGuard.name);
  private warned = false;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(ctx: ExecutionContext): boolean {
    const expected = this.config.get('organizerKey', { infer: true });
    if (!expected) {
      if (!this.warned) {
        this.logger.warn('ORGANIZER_KEY no configurada: acciones de organizador abiertas.');
        this.warned = true;
      }
      return true;
    }
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.headers[HEADER] !== expected) {
      throw new UnauthorizedException('Clave de organizador inválida');
    }
    return true;
  }
}
