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
