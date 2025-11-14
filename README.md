# Spec Workflow MCP

[![npm version](https://img.shields.io/npm/v/@pimzino/spec-workflow-mcp)](https://www.npmjs.com/package/@pimzino/spec-workflow-mcp)
[![VSCode Extension](https://badgen.net/vs-marketplace/v/Pimzino.spec-workflow-mcp)](https://marketplace.visualstudio.com/items?itemName=Pimzino.spec-workflow-mcp)

A Model Context Protocol (MCP) server for structured spec-driven development with real-time dashboard and VSCode extension.

## ☕ Support This Project

<a href="https://buymeacoffee.com/Pimzino" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## 📺 Showcase

### 🔄 Approval System in Action
<a href="https://www.youtube.com/watch?v=C-uEa3mfxd0" target="_blank">
  <img src="https://img.youtube.com/vi/C-uEa3mfxd0/maxresdefault.jpg" alt="Approval System Demo" width="600">
</a>

*See how the approval system works: create documents, request approval through the dashboard, provide feedback, and track revisions.*

### 📊 Dashboard & Spec Management
<a href="https://www.youtube.com/watch?v=g9qfvjLUWf8" target="_blank">
  <img src="https://img.youtube.com/vi/g9qfvjLUWf8/maxresdefault.jpg" alt="Dashboard Demo" width="600">
</a>

*Explore the real-time dashboard: view specs, track progress, navigate documents, and monitor your development workflow.*

## ✨ Key Features

- **Structured Development Workflow** - Sequential spec creation (Requirements → Design → Tasks)
- **Real-Time Web Dashboard** - Monitor specs, tasks, and progress with live updates
- **VSCode Extension** - Integrated sidebar dashboard for VSCode users
- **Spec-Kit Compatibility** - Full support for spec-kit projects with unified dashboard
- **Approval Workflow** - Complete approval process with revisions
- **Task Progress Tracking** - Visual progress bars and detailed status
- **Implementation Logs** - Searchable logs of all task implementations with code statistics
- **Performance Optimization** - Caching, concurrency control, and performance metrics
- **Multi-Language Support** - Available in 11 languages

## 🌍 Supported Languages

🇺🇸 English • 🇯🇵 日本語 • 🇨🇳 中文 • 🇪🇸 Español • 🇧🇷 Português • 🇩🇪 Deutsch • 🇫🇷 Français • 🇷🇺 Русский • 🇮🇹 Italiano • 🇰🇷 한국어 • 🇸🇦 العربية

## 🚀 Quick Start

**📖 See [QUICK-START.md](QUICK-START.md) for a complete step-by-step guide!**

### Step 1: Install Dependencies

Clone this repository and install dependencies:

```bash
git clone <repository-url>
cd speckit-cc
npm install
```

### Step 2: Build the Project

```bash
npm run build
```

### Step 3: Add to your AI tool

Add to your MCP configuration (see client-specific setup below):

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/project"]
    }
  }
}
```

**Note:** Replace `/path/to/your/project` with the actual path to your project directory.

### Step 4: Configure Spec-Kit Project Scanning

Set the root directory for automatic spec-kit project detection:

```bash
# Add to your ~/.bashrc or ~/.zshrc
export SPECKIT_ROOT_DIR="/home/syedu/code"

# Or set temporarily for the current session
export SPECKIT_ROOT_DIR="/home/syedu/code"
```

### Step 5: Start the Dashboard

Start the dashboard from the project root (runs on port 5000 by default):

```bash
# Development mode
npm run dev -- --dashboard

# Production mode
npm start -- --dashboard
```

The dashboard will automatically scan `/home/syedu/code` for all spec-kit projects (projects with `.specify/` directories) and display them.

The dashboard will be accessible at: http://localhost:5000

> **Note:** Only one dashboard instance is needed. All your projects will connect to the same dashboard.

## 📝 How to Use

Simply mention spec-workflow in your conversation:

- **"Create a spec for user authentication"** - Creates complete spec workflow
- **"List my specs"** - Shows all specs and their status
- **"Execute task 1.2 in spec user-auth"** - Runs a specific task

[See more examples →](docs/PROMPTING-GUIDE.md)

## 🔧 MCP Client Setup

**Important:** Replace `/path/to/your/project` with your actual project directory path.

<details>
<summary><strong>Augment Code</strong></summary>

Configure in your Augment settings:
```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/project"]
    }
  }
}
```
</details>

<details>
<summary><strong>Claude Code CLI</strong></summary>

Add to your MCP configuration:
```bash
claude mcp add spec-workflow node /home/syedu/code/speckit-cc/dist/index.js -- /path/to/your/project
```

**Important Notes:**
- The `--` separator ensures the path is passed to the script correctly
- Replace `/path/to/your/project` with your actual project directory path
</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/project"]
    }
  }
}
```

> **Important:** Run the dashboard separately with `npm run dev -- --dashboard` before starting the MCP server.

</details>

<details>
<summary><strong>Cline/Claude Dev</strong></summary>

Add to your MCP server configuration:
```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/project"]
    }
  }
}
```
</details>

<details>
<summary><strong>Continue IDE Extension</strong></summary>

Add to your Continue configuration:
```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/project"]
    }
  }
}
```
</details>

<details>
<summary><strong>Cursor IDE</strong></summary>

Add to your Cursor settings (`settings.json`):
```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/project"]
    }
  }
}
```
</details>

<details>
<summary><strong>OpenCode</strong></summary>

Add to your `opencode.json` configuration file:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "spec-workflow": {
      "type": "local",
      "command": ["node", "/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/project"],
      "enabled": true
    }
  }
}
```
</details>

## 🐳 Docker Deployment

Run the dashboard in a Docker container for isolated deployment:

```bash
# Using Docker Compose (recommended)
cd containers
docker-compose up --build

# Or using Docker CLI
docker build -f containers/Dockerfile -t spec-workflow-mcp .
docker run -p 5000:5000 -v "./workspace/.spec-workflow:/workspace/.spec-workflow:rw" spec-workflow-mcp
```

The dashboard will be available at: http://localhost:5000

[See Docker setup guide →](containers/README.md)

## 📚 Documentation

- [Spec-Kit Compatibility Guide](docs/SPEC-KIT-COMPATIBILITY.md) - Using Spec Workflow MCP with spec-kit projects
- [Configuration Guide](docs/CONFIGURATION.md) - Command-line options, config files
- [User Guide](docs/USER-GUIDE.md) - Comprehensive usage examples
- [Workflow Process](docs/WORKFLOW.md) - Development workflow and best practices
- [Interfaces Guide](docs/INTERFACES.md) - Dashboard and VSCode extension details
- [Prompting Guide](docs/PROMPTING-GUIDE.md) - Advanced prompting examples
- [Tools Reference](docs/TOOLS-REFERENCE.md) - Complete tools documentation
- [Development](docs/DEVELOPMENT.md) - Contributing and development setup
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 📁 Project Structure

```
your-project/
  .spec-workflow/
    approvals/
    archive/
    specs/
    steering/
    templates/
    user-templates/
    config.example.toml
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

[See development guide →](docs/DEVELOPMENT.md)

## 📄 License

GPL-3.0

## ⭐ Star History

<a href="https://www.star-history.com/#Pimzino/spec-workflow-mcp&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Pimzino/spec-workflow-mcp&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Pimzino/spec-workflow-mcp&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Pimzino/spec-workflow-mcp&type=Date" />
 </picture>
</a>