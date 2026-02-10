# Contributing to Playwright Smart Logger

First off, thank you for considering contributing to Playwright Smart Logger! 🎉

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include:

- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Environment details** (Node.js version, Playwright version, OS)
- **Code snippets** or test files that demonstrate the issue

### 🚀 Suggesting Features

Feature requests are welcome! Please provide:

- **Clear description** of the proposed feature
- **Use case** - why would this be useful?
- **Example usage** - how would it work?
- **Alternatives considered** - what other solutions did you think about?

### 🔧 Code Contributions

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Add tests** for your changes
5. **Run** the test suite: `npm test`
6. **Update** documentation if needed
7. **Commit** your changes: `git commit -m 'Add amazing feature'`
8. **Push** to your branch: `git push origin feature/amazing-feature`
9. **Open** a Pull Request

### 🧪 Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/playwright-smart-logger.git
cd playwright-smart-logger

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 📏 Code Style

- Use **TypeScript** for all code
- Follow **existing code style** and conventions
- Write **clear, descriptive commit messages**
- Add **JSDoc comments** for public APIs
- Keep **lines under 100 characters** when possible

### 🧪 Testing Guidelines

- Add **unit tests** for new features
- Add **integration tests** for complex functionality
- Ensure **all tests pass** before submitting PR
- Add **example tests** to demonstrate usage
- Test with **multiple Playwright versions** when possible

### 📖 Documentation

- Update **README.md** for user-facing changes
- Update **example.md** for new usage patterns
- Add **inline code comments** for complex logic
- Update **TypeScript types** and interfaces

## Development Process

### Branching Strategy

- `main` - stable release branch
- `feature/*` - new features
- `fix/*` - bug fixes
- `docs/*` - documentation updates

### Release Process

1. Version bump following [Semantic Versioning](https://semver.org/)
2. Update CHANGELOG.md
3. Tag release
4. Publish to NPM
5. Create GitHub release

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/0/code_of_conduct/) Code of Conduct.

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub releases
- NPM package acknowledgments

Thank you for contributing! 🙏