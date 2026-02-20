# [1.1.0](https://github.com/hoangtaiki/playwright-smart-logger/compare/v1.0.0...v1.1.0) (2026-02-18)

## 1.2.0

### Minor Changes

- [`83a49cf`](https://github.com/hoangtaiki/playwright-smart-logger/commit/83a49cf7862b4456ebc98007feaa6a434ad9bf25) Thanks [@hoangtaiki](https://github.com/hoangtaiki)! - Bug Fixes

### Bug Fixes

- increase timeout for Playwright browser installation and simplify release commit message format ([afd1bd4](https://github.com/hoangtaiki/playwright-smart-logger/commit/afd1bd40024cf0a280c719adf76cd568c13fe7cb))

### Features

- bump for v1.1.0 ([0377392](https://github.com/hoangtaiki/playwright-smart-logger/commit/0377392ddc23ec321b1dfb3f01ca52d29be876b1))

# 1.0.0 (2026-02-11)

### Features

- Add attachToReport option to SmartLogger and implement related tests ([d758e28](https://github.com/hoangtaiki/playwright-smart-logger/commit/d758e28a328da0d3e99c81ce14d480e7cbdddaff))
- Enhance Playwright Smart Logger with global access and improved documentation ([4823803](https://github.com/hoangtaiki/playwright-smart-logger/commit/4823803d0726c59b1c1cb3372b975960c89eb0a0))
- Initial release of Playwright Smart Logger v1.0.0 ([7744005](https://github.com/hoangtaiki/playwright-smart-logger/commit/7744005eca6bab4724196fec8e0b40d65c87478b))
- Refactor smart logger structure and enhance documentation for custom fixtures ([9a43ff1](https://github.com/hoangtaiki/playwright-smart-logger/commit/9a43ff1c415b16d3568a5fdc010cdd6229cbad3f))
- **tests:** add comprehensive examples and integration tests for SmartLog ([f2d6740](https://github.com/hoangtaiki/playwright-smart-logger/commit/f2d6740eda7549e866a9cc6e26616fca8eaf0593))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/0.0.1/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-02-11

### Added

- 🎉 Initial release of Playwright Smart Logger
- ✅ Automatic console method override (log, warn, error, info, debug)
- 🎯 Smart flushing - only show logs on test failure/timeout/retry by default
- 📊 Advanced console features: groups, tables, timing, object formatting
- 🌐 Optional browser console capture via page.on('console')
- 🎨 Colored output using chalk for better readability
- 🔧 Configurable log levels (silent, error, warn, info, verbose)
- 💾 Memory-safe buffer management with configurable limits
- 🏗️ TypeScript-first architecture with full type safety
- 📖 Comprehensive documentation and examples
- 🧪 Extensive test suite with 135+ test scenarios
- 🎪 Custom fixture extension capabilities
- ⚡ Zero-configuration setup - works out of the box
- 🔄 Graceful error handling and cleanup
- 📱 Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- 🚀 Performance optimizations for large test suites

### Features

- **Console Override**: Automatically captures all console methods
- **Smart Flushing**: Reduces console noise by 90% on passing tests
- **Advanced Logging**: Support for console.group, console.table, console.time
- **Browser Integration**: Optional capture of browser-side console logs
- **Memory Management**: Configurable buffer limits prevent memory leaks
- **TypeScript Support**: Full type definitions and strict mode compliance
- **Extensibility**: Easy to extend with custom fixture patterns

### Documentation

- Complete README with installation and usage examples
- Advanced examples document with 70+ real-world scenarios
- Contributing guidelines and development setup
- TypeScript API documentation
- Performance benchmarks and best practices

[Unreleased]: https://github.com/username/playwright-smart-logger/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/username/playwright-smart-logger/releases/tag/v0.0.1
