#!/bin/bash

# Check if the virtual environment exists
if [ ! -d ".venv" ]; then
  echo "Virtual environment not found. Please run 'yarn setup' first."
  exit 1
fi

# Activate the virtual environment
source "./.venv/bin/activate"
which python
which pip

# Start the Nuxt development server
nuxt dev "$@"
