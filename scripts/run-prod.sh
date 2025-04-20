#!/bin/bash

# Check if the virtual environment exists
if [ ! -d ".venv" ]; then
  echo "Virtual environment not found. Please run 'yarn setup' first."
  exit 1
fi

# if .output dir doesn't exist, run yarn build
if [ ! -d ".output" ]; then
  yarn build
fi

# Activate the virtual environment
source ".venv/bin/activate"

# Start the Nuxt development server
yarn nuxt start "$@"
