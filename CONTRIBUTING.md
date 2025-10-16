# Contributing to Arcane

First off, thank you for considering contributing to Arcane! It's people like you that make Arcane such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct (be respectful, professional, and collaborative).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node version, Flutter version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `develop`:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following our coding standards (see below)

3. **Write or update tests** for your changes

4. **Ensure all tests pass:**
   ```bash
   # Backend
   cd backend && npm run test

   # Mobile
   cd mobile && flutter test
   ```

5. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request** to the `develop` branch

## Development Setup

### Backend (NestJS)

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your credentials
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run
```

## Coding Standards

### TypeScript/NestJS

- Use **TypeScript strict mode**
- Follow **NestJS best practices**
- Use **DTOs** for all request/response objects
- Implement **proper error handling**
- Add **JSDoc comments** for complex functions
- Write **unit tests** for services
- Write **E2E tests** for critical endpoints

Example:
```typescript
/**
 * Creates a new player profile
 * @param createPlayerDto - Player creation data
 * @returns Created player with user details
 * @throws ConflictException if player already exists
 */
async createPlayer(createPlayerDto: CreatePlayerDto): Promise<PlayerResponse> {
  // Implementation
}
```

### Dart/Flutter

- Follow **Dart style guide**
- Use **Clean Architecture** (feature-first structure)
- Implement **proper state management** (Riverpod)
- Use **freezed** for immutable models
- Add **widget tests** for UI components
- Write **unit tests** for business logic

Example:
```dart
/// Represents a player entity in the domain layer
@freezed
class Player with _$Player {
  const factory Player({
    required String id,
    required String firstName,
    required String lastName,
    required PlayerPosition position,
    @Default(PlayerStatus.active) PlayerStatus status,
  }) = _Player;

  factory Player.fromJson(Map<String, dynamic> json) => _$PlayerFromJson(json);
}
```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting, missing semicolons, etc.
- `refactor:` code restructuring
- `test:` adding or updating tests
- `chore:` maintenance tasks

Examples:
```bash
feat(auth): add OAuth Google authentication
fix(players): resolve pagination issue
docs(readme): update installation instructions
test(scouting): add unit tests for report service
```

### Branch Naming

- `feature/` - new features
- `fix/` - bug fixes
- `docs/` - documentation
- `refactor/` - code refactoring
- `test/` - test additions/updates

Examples:
```bash
feature/oauth-integration
fix/player-search-bug
docs/api-endpoints
refactor/auth-module
test/match-service
```

## Testing

### Backend Tests

```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Mobile Tests

```bash
cd mobile

# Unit & widget tests
flutter test

# Integration tests
flutter test integration_test/

# Coverage
flutter test --coverage
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc/DartDoc comments for public APIs
- Update API documentation (Swagger) if you add/modify endpoints
- Include screenshots for UI changes

## Code Review Process

1. At least **one approval** required from maintainers
2. All **CI checks must pass** (lint, test, build)
3. **No merge conflicts** with target branch
4. **Code coverage** should not decrease

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Arcane! 🙏
