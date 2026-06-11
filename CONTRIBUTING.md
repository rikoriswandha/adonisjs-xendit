# Contributing to adonisjs-xendit

Thank you for your interest in contributing to adonisjs-xendit! We welcome contributions from the community.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests without coverage (faster)
npm run test:quick

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### Code Style

This project uses:
- **ESLint** for linting (with `@adonisjs/eslint-config`)
- **Prettier** for code formatting (with `@adonisjs/prettier-config`)

Please ensure your code passes linting before submitting:
```bash
npm run lint
npm run format:check
```

### Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes

Example:
```bash
git commit -m "feat: add retry logic for failed requests"
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all tests pass: `npm test`
4. Update documentation if needed
5. Submit a pull request with a clear description

## Reporting Issues

When reporting issues, please include:
- Node.js version
- AdonisJS version
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces

## Security Issues

Please do not report security issues publicly. Instead, email [rikoriswandha@gmail.com](mailto:rikoriswandha@gmail.com).

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints and experiences
