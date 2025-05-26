# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Build and run
npm run build        # Build TypeScript and webpack bundle
npm run dev          # Development mode with file watching
npm start            # Start the built application

# Individual builds
npm run build:ts     # Compile TypeScript only
npm run build:webpack # Build webpack bundle only
npm run watch:ts     # Watch TypeScript compilation
npm run watch:webpack # Watch webpack bundle

# Packaging
npm run pack         # Package for current platform (development)
npm run dist         # Build and package for distribution
```

## Architecture Overview

This is an Electron desktop application for uploading files to Azure Blob Storage, built using **Clean Architecture** principles with a functional approach.

### Core Design Principles

- **Function-based implementation**: No TypeScript classes - all logic implemented as functions
- **Effect-ts for error handling**: All repository and use case functions return `Effect<Success, Error>` types
- **Clean Architecture layers**: Domain → Application (Use Cases) → Infrastructure → Presentation

### Layer Structure

**Domain Layer** (`src/domain/`):
- Core business entities (FileInfo, UploadResult, UploadProgressInfo)
- Configuration types and domain-specific error types

**Use Cases** (`src/usecases/`):
- `uploadFileUseCase.ts` - Main file upload business logic with validation
- File history and deletion use cases

**Infrastructure** (`src/infrastructure/`):
- `azureBlobRepository.ts` - Real Azure Blob Storage implementation
- `mockRepositories.ts` - Mock implementations for testing/development
- File system operations and image processing utilities

**Main Process** (`src/main/`):
- Electron main process with IPC handlers organized by feature
- Currently most logic is in `src/main.ts` but handlers exist in `src/main/handlers/`

**Presentation** (`src/presentation/`):
- React components for file upload and settings UI

### Key Technical Details

**Configuration**:
- YAML-based configuration stored in user data directory
- Falls back to mock repository when Azure connection string not configured
- Default config auto-generated on first run

**File Processing**:
- Automatic thumbnail generation for images (320px width)
- Files organized in Azure Blob Storage as `YYYY/MM/filename`
- File naming with timestamp and duplicate handling

**Error Handling**:
- Effect-ts provides type-safe error handling throughout the stack
- Custom error types: `RepositoryError`, `UploadError`, `FileProcessingError`

**IPC Communication**:
- Progress updates sent via `event.sender.send('upload:progress')`
- Handlers modularized by feature area

### Development Notes

- The main process logic should be refactored to use the Clean Architecture handlers in `src/main/handlers/`
- Mock repositories are available for development without Azure credentials
- No linting or testing commands are configured in package.json