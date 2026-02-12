# Intégration du Logger dans le Backend

## Installation des Dépendances

```bash
cd backend
npm install winston nest-winston
```

## Configuration dans app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from './logger/logger.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  imports: [
    LoggerModule, // Ajouter le module de logging
    // ... autres modules
  ],
  providers: [
    // Ajouter l'interceptor globalement
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // ... autres providers
  ],
})
export class AppModule {}
```

## Utilisation dans les Services

### Exemple 1: Service Basique

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class UsersService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(data: CreateUserDto) {
    this.logger.log('Creating new user', 'UsersService');

    try {
      // Logique de création
      const user = await this.prisma.user.create({ data });

      this.logger.logBusinessEvent('user-created', {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.logger.error(
        'Failed to create user',
        error.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async findAll() {
    const startTime = Date.now();

    const users = await this.prisma.user.findMany();

    const duration = Date.now() - startTime;
    this.logger.logPerformance('users-fetch', duration, {
      count: users.length,
    });

    return users;
  }
}
```

### Exemple 2: Service d'Authentification

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthService {
  constructor(private readonly logger: LoggerService) {}

  async login(email: string, password: string) {
    this.logger.debug(`Login attempt for ${email}`, 'AuthService');

    const user = await this.findUserByEmail(email);

    if (!user) {
      this.logger.logSecurity('login-failed-user-not-found', 'medium', {
        email,
        ip: 'request.ip', // À récupérer de la requête
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      this.logger.logSecurity('login-failed-invalid-password', 'medium', {
        userId: user.id,
        email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.logBusinessEvent('user-login', {
      userId: user.id,
      email: user.email,
    });

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    this.logger.logBusinessEvent('user-logout', { userId });
    // Logique de déconnexion
  }
}
```

### Exemple 3: Service avec Base de Données

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayersService {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async searchPlayers(query: string) {
    const startTime = Date.now();

    this.logger.debug(`Searching players with query: ${query}`, 'PlayersService');

    try {
      const players = await this.prisma.player.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
      });

      const duration = Date.now() - startTime;

      this.logger.logDatabaseQuery(
        `SELECT * FROM players WHERE firstName LIKE '%${query}%'`,
        duration,
        { resultCount: players.length },
      );

      if (duration > 1000) {
        this.logger.warn(
          `Slow database query detected: ${duration}ms`,
          'PlayersService',
        );
      }

      return players;
    } catch (error) {
      this.logger.error(
        'Database query failed',
        error.stack,
        'PlayersService',
      );
      throw error;
    }
  }
}
```

### Exemple 4: Controller avec Logging

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  async findAll() {
    this.logger.log('Fetching all players', 'PlayersController');
    return this.playersService.findAll();
  }

  @Post()
  async create(@Body() createPlayerDto: CreatePlayerDto) {
    this.logger.log(
      'Creating new player',
      'PlayersController',
    );

    try {
      const player = await this.playersService.create(createPlayerDto);

      this.logger.logBusinessEvent('player-created', {
        playerId: player.id,
        name: `${player.firstName} ${player.lastName}`,
      });

      return player;
    } catch (error) {
      this.logger.error(
        'Failed to create player',
        error.stack,
        'PlayersController',
      );
      throw error;
    }
  }
}
```

## Utilisation dans les Guards

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly logger: LoggerService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      this.logger.logSecurity('unauthorized-access-attempt', 'medium', {
        userId: user.id,
        requiredRoles,
        userRoles: user.roles,
        path: request.url,
      });
    }

    return hasRole;
  }
}
```

## Utilisation dans les Exceptions Filters

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    this.logger.error(
      `HTTP ${status} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
      'ExceptionFilter',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

## Configuration main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Utiliser le logger personnalisé
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Ajouter le filter d'exceptions global
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();
```

## Variables d'Environnement

Ajouter dans `.env` :

```env
# Logging
LOG_LEVEL=debug  # debug, info, warn, error
NODE_ENV=development  # development, production, test
```

## Bonnes Pratiques

### 1. Niveaux de Log Appropriés

```typescript
// DEBUG - Informations de développement
this.logger.debug('Function called with params', 'Service', { params });

// INFO - Événements normaux
this.logger.log('User created successfully', 'Service');

// WARN - Situations anormales mais gérées
this.logger.warn('Deprecated API endpoint used', 'Controller');

// ERROR - Erreurs nécessitant attention
this.logger.error('Database connection failed', error.stack, 'Service');
```

### 2. Contexte Significatif

```typescript
// ✅ BON - Contexte clair
this.logger.log('Creating user', 'UsersService');

// ❌ MAUVAIS - Contexte vague
this.logger.log('Creating user', 'App');
```

### 3. Données Structurées

```typescript
// ✅ BON - Données structurées
this.logger.logBusinessEvent('payment-processed', {
  userId: user.id,
  amount: payment.amount,
  currency: payment.currency,
  transactionId: payment.id,
});

// ❌ MAUVAIS - String non structuré
this.logger.log(`Payment of ${amount} processed for user ${userId}`);
```

### 4. Ne Jamais Logger de Données Sensibles

```typescript
// ❌ MAUVAIS - Password en clair
this.logger.debug('Login attempt', 'Auth', { email, password });

// ✅ BON - Password omis
this.logger.debug('Login attempt', 'Auth', { email });
```

### 5. Performance Tracking

```typescript
async expensiveOperation() {
  const startTime = Date.now();

  try {
    const result = await this.doSomethingExpensive();

    this.logger.logPerformance('expensive-operation', Date.now() - startTime, {
      resultSize: result.length,
    });

    return result;
  } catch (error) {
    this.logger.error('Operation failed', error.stack, 'Service');
    throw error;
  }
}
```

## Vérification

Pour vérifier que le logger fonctionne :

1. Démarrer l'application :
   ```bash
   npm run start:dev
   ```

2. Vérifier que le dossier `logs/` est créé

3. Vérifier les fichiers de log :
   ```bash
   tail -f logs/combined.log
   tail -f logs/error.log
   tail -f logs/http.log
   ```

4. Faire une requête API et voir les logs apparaître

## Tests

```typescript
import { Test } from '@nestjs/testing';
import { LoggerService } from './logger/logger.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            logBusinessEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    logger = module.get<LoggerService>(LoggerService);
  });

  it('should log when creating a user', async () => {
    await service.createUser({ email: 'test@test.com' });

    expect(logger.log).toHaveBeenCalledWith(
      'Creating new user',
      'UsersService',
    );
  });
});
```

## Résolution de Problèmes

### Les logs ne s'écrivent pas dans les fichiers

1. Vérifier les permissions du dossier `logs/`
2. Vérifier que Winston est bien installé : `npm list winston`
3. Vérifier la variable `NODE_ENV`

### Les logs de HTTP n'apparaissent pas

1. Vérifier que `LoggingInterceptor` est bien enregistré globalement
2. Vérifier le niveau de log (doit être 'http' ou moins)

### Trop de logs en production

1. Changer `LOG_LEVEL=info` dans `.env.production`
2. Les logs debug ne seront pas écrits

---

**Prochaines étapes :**
- Intégrer le logger dans tous les services existants
- Remplacer les `console.log` par `logger.log`
- Tester en développement
- Déployer et vérifier les logs en CI/CD
