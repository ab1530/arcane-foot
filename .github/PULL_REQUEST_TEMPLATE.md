# Pull Request

## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test addition or update

## Related Issue(s)

<!-- Link to related issues: Fixes #123, Closes #456 -->

## Checklist

### General
- [ ] My code follows the project's code style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors

### Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

### Backend (NestJS)
- [ ] DTOs are properly validated with class-validator
- [ ] Guards/interceptors are applied where necessary
- [ ] Prisma schema updated if database changes
- [ ] API documentation (Swagger) updated
- [ ] Error handling implemented

### Mobile (Flutter)
- [ ] Code follows Clean Architecture principles
- [ ] State management properly implemented (Riverpod)
- [ ] UI is responsive across different screen sizes
- [ ] Widget tests added for new UI components
- [ ] No hard-coded strings (use localization)

### Security
- [ ] No sensitive data (passwords, keys, tokens) in code
- [ ] Input validation implemented
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention measures in place
- [ ] Authentication/authorization properly checked

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Additional Notes

<!-- Any additional information or context -->
