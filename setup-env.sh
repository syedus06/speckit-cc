#!/bin/bash
# Setup script for Spec-Kit Dashboard
# This script configures the SPECKIT_ROOT_DIR environment variable

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPECKIT_ROOT_DIR="/home/syedu/code"

echo "=========================================="
echo "Spec-Kit Dashboard - Environment Setup"
echo "=========================================="
echo ""
echo "This script will configure the SPECKIT_ROOT_DIR environment variable."
echo "Root directory: $SPECKIT_ROOT_DIR"
echo ""

# Detect shell
if [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
else
    SHELL_RC="$HOME/.profile"
fi

echo "Detected shell config: $SHELL_RC"
echo ""

# Check if already configured
if grep -q "SPECKIT_ROOT_DIR" "$SHELL_RC" 2>/dev/null; then
    echo "⚠️  SPECKIT_ROOT_DIR is already configured in $SHELL_RC"
    echo ""
    echo "Current configuration:"
    grep "SPECKIT_ROOT_DIR" "$SHELL_RC"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    # Remove old configuration
    sed -i '/SPECKIT_ROOT_DIR/d' "$SHELL_RC"
fi

# Add configuration
echo "" >> "$SHELL_RC"
echo "# Spec-Kit Dashboard Configuration" >> "$SHELL_RC"
echo "export SPECKIT_ROOT_DIR=\"$SPECKIT_ROOT_DIR\"" >> "$SHELL_RC"

echo "✅ Configuration added to $SHELL_RC"
echo ""
echo "To apply the changes, run:"
echo "  source $SHELL_RC"
echo ""
echo "Or restart your terminal."
echo ""
echo "To start the dashboard, run:"
echo "  cd $SCRIPT_DIR"
echo "  npm run dev -- --dashboard"
echo ""
echo "The dashboard will scan $SPECKIT_ROOT_DIR for all spec-kit projects."
echo "=========================================="
