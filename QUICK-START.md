# Quick Start Guide

This guide will help you set up and run the Spec-Kit Dashboard to monitor all your spec-kit projects in `/home/syedu/code`.

## Prerequisites

- Node.js 18+ installed
- Your spec-kit projects located in `/home/syedu/code`

## Setup (One-Time)

### 1. Install Dependencies

```bash
cd /home/syedu/code/speckit-cc
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Configure Environment Variable

**Option A: Automatic Setup (Recommended)**

Run the setup script:

```bash
./setup-env.sh
```

Then apply the changes:

```bash
source ~/.bashrc  # or ~/.zshrc if using zsh
```

**Option B: Manual Setup**

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export SPECKIT_ROOT_DIR="/home/syedu/code"
```

Then reload:

```bash
source ~/.bashrc  # or ~/.zshrc
```

## Running the Dashboard

### Start the Dashboard

```bash
cd /home/syedu/code/speckit-cc
npm run dev -- --dashboard
```

The dashboard will:
- Start on http://localhost:5000
- Automatically scan `/home/syedu/code` for all subdirectories
- Detect and display all projects with `.specify/` directories
- Watch for new projects being added or removed in real-time

### Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5000
```

You should see all your spec-kit projects listed!

## What Gets Detected?

The system will find any project in `/home/syedu/code` that has:

- `.specify/` directory
- AI agent folders like `.claude/`, `.codex/`, `.gemini/`, etc.
- `specs/` directory with numbered feature folders (e.g., `001-feature-name/`)

## Example Project Structure

```
/home/syedu/code/
├── project-a/
│   ├── .specify/
│   │   ├── memory/
│   │   │   └── constitution.md
│   │   ├── templates/
│   │   └── scripts/
│   ├── .claude/
│   │   └── commands/
│   │       └── speckit.plan.md
│   └── specs/
│       └── 001-auth-feature/
│           ├── spec.md
│           ├── plan.md
│           └── tasks.md
│
├── project-b/
│   ├── .specify/
│   └── specs/
│
└── speckit-cc/  (this dashboard app)
```

## Dashboard Features

Once running, you can:

- **View All Projects**: See all detected spec-kit projects
- **Browse Specs**: Navigate through feature specifications
- **View AI Agents**: See available agents and their commands
- **Access Constitution**: Review project governance documents
- **Explore Templates**: Browse available spec templates
- **Monitor Performance**: Track scanning performance and metrics

## Troubleshooting

### No Projects Detected

1. **Check environment variable:**
   ```bash
   echo $SPECKIT_ROOT_DIR
   ```
   Should output: `/home/syedu/code`

2. **Verify project structure:**
   ```bash
   ls -la /home/syedu/code/your-project/.specify
   ```

3. **Check dashboard logs** in the terminal for any errors

### Dashboard Won't Start

1. **Check if port 5000 is available:**
   ```bash
   lsof -i :5000
   ```

2. **Use a different port:**
   ```bash
   npm run dev -- --dashboard --port 8080
   ```

### Projects Not Updating

1. **Restart the dashboard** (Ctrl+C, then start again)
2. **Clear cache** by deleting:
   ```bash
   rm -rf ~/.spec-workflow-mcp/
   ```

## Next Steps

### Configure MCP Clients

To use this with AI assistants (Claude, etc.), add to your MCP configuration:

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

Replace `/path/to/your/project` with the actual project path.

### Learn More

- [README.md](README.md) - Full documentation
- [SPEC-KIT-COMPATIBILITY.md](docs/SPEC-KIT-COMPATIBILITY.md) - Spec-kit specific features
- [CONFIGURATION.md](docs/CONFIGURATION.md) - Advanced configuration options
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Production Deployment

For production use:

```bash
npm start -- --dashboard
```

This uses the built version from `dist/` for better performance.

## Stopping the Dashboard

Press `Ctrl+C` in the terminal where the dashboard is running.

---

**That's it!** Your dashboard should now be monitoring all spec-kit projects in `/home/syedu/code`. 🎉
