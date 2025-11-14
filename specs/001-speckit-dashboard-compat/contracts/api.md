# API Contracts: Spec-Kit Dashboard Compatibility

**Feature**: 001-speckit-dashboard-compat  
**API Style**: REST + JSON-RPC (MCP tools)  
**Created**: 2025-11-12

## REST API Endpoints

### GET /api/projects

Get list of all registered projects (both spec-kit and spec-workflow-mcp).

**Query Parameters**:
- `type?: 'spec-kit' | 'spec-workflow-mcp'` - Filter by project type
- `includeStats?: boolean` - Include spec/agent counts (default: false)

**Response**: 200 OK
```json
{
  "projects": [
    {
      "projectId": "a1b2c3d4e5f6g7h8",
      "projectName": "PharmacyHub",
      "projectPath": "/home/user/code/PharmacyHub",
      "projectType": "spec-kit",
      "agentCount": 4,
      "specCount": 3,
      "hasConstitution": true,
      "lastScanned": "2025-11-12T10:30:00Z"
    }
  ],
  "rootDirectory": "/home/user/code",
  "totalCount": 1
}
```

**Error Responses**:
- `500`: Root directory not configured or scan failed

---

### GET /api/projects/:projectId

Get detailed information about a specific project.

**Path Parameters**:
- `projectId: string` - Project identifier

**Response**: 200 OK (Spec-Kit Project)
```json
{
  "projectId": "a1b2c3d4e5f6g7h8",
  "projectName": "PharmacyHub",
  "projectPath": "/home/user/code/PharmacyHub",
  "projectType": "spec-kit",
  "rootDirectory": "/home/user/code",
  "hasConstitution": true,
  "createdAt": "2025-11-12T10:00:00Z",
  "lastScanned": "2025-11-12T10:30:00Z",
  "agents": [
    {
      "agentId": "a1b2c3d4e5f6g7h8-claude",
      "agentName": "claude",
      "folderPath": "/home/user/code/PharmacyHub/.claude",
      "subdirectoryType": "commands",
      "commandCount": 8,
      "commands": [
        {
          "commandName": "analyze",
          "slashCommand": "/speckit.analyze",
          "filePath": "/home/user/code/PharmacyHub/.claude/commands/speckit.analyze.md",
          "lastModified": "2025-11-04T00:39:00Z"
        }
      ]
    }
  ],
  "specs": [
    {
      "specId": "a1b2c3d4e5f6g7h8-001",
      "featureNumber": "001",
      "featureName": "architecture-refactor",
      "directoryName": "001-architecture-refactor",
      "hasSpec": true,
      "hasPlan": true,
      "hasTasks": true,
      "subdirectories": ["checklists", "contracts", "backups"],
      "lastModified": "2025-11-09T03:15:00Z"
    }
  ],
  "templates": [
    {
      "templateName": "spec-template",
      "templateType": "spec",
      "fileName": "spec-template.md"
    }
  ]
}
```

**Error Responses**:
- `404`: Project not found
- `403`: Project directory not accessible

---

### GET /api/projects/:projectId/constitution

Get project constitution document.

**Path Parameters**:
- `projectId: string` - Project identifier

**Response**: 200 OK
```json
{
  "projectId": "a1b2c3d4e5f6g7h8",
  "filePath": "/home/user/code/PharmacyHub/.specify/memory/constitution.md",
  "content": "# Constitution\n\n...",
  "version": "1.0.0",
  "lastModified": "2025-11-05T18:12:00Z",
  "principleCount": 5
}
```

**Error Responses**:
- `404`: Project not found or constitution doesn't exist
- `403`: Constitution file not accessible

---

### GET /api/projects/:projectId/specs/:specId

Get detailed spec directory information.

**Path Parameters**:
- `projectId: string` - Project identifier
- `specId: string` - Spec identifier (e.g., "001")

**Response**: 200 OK
```json
{
  "specId": "a1b2c3d4e5f6g7h8-001",
  "projectId": "a1b2c3d4e5f6g7h8",
  "featureNumber": "001",
  "featureName": "architecture-refactor",
  "directoryPath": "/home/user/code/PharmacyHub/specs/001-architecture-refactor",
  "files": [
    {
      "name": "spec.md",
      "type": "spec",
      "size": 61405,
      "lastModified": "2025-11-08T00:38:00Z"
    },
    {
      "name": "plan.md",
      "type": "plan",
      "size": 30027,
      "lastModified": "2025-11-08T00:38:00Z"
    },
    {
      "name": "tasks.md",
      "type": "tasks",
      "size": 13862,
      "lastModified": "2025-11-09T03:15:00Z"
    }
  ],
  "subdirectories": [
    {
      "name": "checklists",
      "fileCount": 5
    },
    {
      "name": "contracts",
      "fileCount": 3
    }
  ],
  "taskFiles": [
    "tasks-phase1-infrastructure.md",
    "tasks-phase2.1-assessment-refactor.md"
  ]
}
```

**Error Responses**:
- `404`: Project or spec not found
- `403`: Spec directory not accessible

---

### POST /api/scan

Trigger manual scan of root directory for new projects.

**Request Body**: (optional)
```json
{
  "force": false  // Force rescan even if recently scanned
}
```

**Response**: 200 OK
```json
{
  "scanResult": {
    "rootDirectory": "/home/user/code",
    "subdirectoryCount": 10,
    "specKitProjectsFound": 2,
    "scanDuration": 1234,
    "errors": [],
    "timestamp": "2025-11-12T10:35:00Z"
  },
  "newProjects": ["a1b2c3d4e5f6g7h8"],
  "removedProjects": []
}
```

**Error Responses**:
- `500`: Scan failed
- `503`: Scan already in progress

## MCP Tool Contracts

### get_speckit_projects

List all spec-kit projects.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "includeDetails": {
      "type": "boolean",
      "description": "Include full project details (agents, specs, etc.)",
      "default": false
    }
  }
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "projectId": {"type": "string"},
          "projectName": {"type": "string"},
          "projectPath": {"type": "string"},
          "agentCount": {"type": "number"},
          "specCount": {"type": "number"}
        }
      }
    }
  }
}
```

---

### get_speckit_agents

Get AI agents for a specific project.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "projectId": {
      "type": "string",
      "description": "Project identifier"
    }
  },
  "required": ["projectId"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "agents": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "agentName": {"type": "string"},
          "commandCount": {"type": "number"},
          "commands": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "commandName": {"type": "string"},
                "slashCommand": {"type": "string"}
              }
            }
          }
        }
      }
    }
  }
}
```

---

### get_speckit_constitution

Get project constitution document.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "projectId": {
      "type": "string",
      "description": "Project identifier"
    }
  },
  "required": ["projectId"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "content": {"type": "string"},
    "version": {"type": "string"},
    "filePath": {"type": "string"}
  }
}
```

---

### scan_speckit_root

Trigger scan of root directory.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "force": {
      "type": "boolean",
      "description": "Force rescan even if recently scanned",
      "default": false
    }
  }
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "projectsFound": {"type": "number"},
    "scanDuration": {"type": "number"},
    "errors": {
      "type": "array",
      "items": {"type": "string"}
    }
  }
}
```

## WebSocket Events

### project.discovered

Emitted when new spec-kit project is found.

**Payload**:
```json
{
  "event": "project.discovered",
  "data": {
    "projectId": "a1b2c3d4e5f6g7h8",
    "projectName": "PharmacyHub",
    "projectType": "spec-kit",
    "timestamp": "2025-11-12T10:30:00Z"
  }
}
```

---

### project.removed

Emitted when spec-kit project is deleted.

**Payload**:
```json
{
  "event": "project.removed",
  "data": {
    "projectId": "a1b2c3d4e5f6g7h8",
    "projectName": "PharmacyHub",
    "timestamp": "2025-11-12T10:30:00Z"
  }
}
```

---

### project.updated

Emitted when spec-kit project content changes.

**Payload**:
```json
{
  "event": "project.updated",
  "data": {
    "projectId": "a1b2c3d4e5f6g7h8",
    "changedPaths": [".specify/memory/constitution.md"],
    "timestamp": "2025-11-12T10:30:00Z"
  }
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `ROOT_DIR_NOT_CONFIGURED` | SPECKIT_ROOT_DIR environment variable not set | 500 |
| `ROOT_DIR_INVALID` | Root directory doesn't exist or not accessible | 500 |
| `PROJECT_NOT_FOUND` | Requested project ID doesn't exist | 404 |
| `PROJECT_INACCESSIBLE` | Project directory exists but not readable | 403 |
| `SPEC_NOT_FOUND` | Requested spec directory doesn't exist | 404 |
| `CONSTITUTION_NOT_FOUND` | Constitution file doesn't exist | 404 |
| `SCAN_IN_PROGRESS` | Another scan is already running | 503 |
| `SCAN_FAILED` | Root directory scan encountered fatal error | 500 |

## Validation Rules

### Request Validation
- `projectId` must be 16-character alphanumeric string
- `specId` must be 3-digit number (000-999)
- `type` filter must be valid enum value
- Boolean parameters must be true/false (not "true"/"false" strings)

### Response Guarantees
- All timestamps in ISO 8601 format
- All file paths are absolute paths
- Arrays are never null (empty array if no results)
- Numbers are never negative
- Strings are never null (empty string or omitted if not applicable)
