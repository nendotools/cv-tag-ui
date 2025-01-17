#!/bin/bash

# Path to the parent directory
PARENT_DIR=$(dirname "$(pwd)")

# Check if the virtual environment exists
if [ ! -d "$PARENT_DIR/venv" ]; then
  echo "Virtual environment not found. Please run 'yarn setup' first."
  exit 1
fi

# Activate the virtual environment
source "$PARENT_DIR/venv/bin/activate"
which python
which pip

# Start the Nuxt development server
nuxt dev "$@"
