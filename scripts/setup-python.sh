#!/bin/bash

# Check if Python is installed
if ! command -v python3 &>/dev/null; then
  echo "Python3 is not installed. Please install Python3."
  exit 1
fi

# Check if the parent directory contains a Python project
if [ ! -f "./requirements.txt" ] && [ ! -f "./requirements_gpu.txt" ]; then
  echo "No requirements files found in the parent directory. Please ensure it is a Python project."
  exit 1
fi

# Create a virtual environment in the parent directory
if [ ! -d "./.venv" ]; then
  echo "Creating a virtual environment in the parent directory..."
  python3 -m venv "./.venv"
  echo "Virtual environment created."
else
  echo "Virtual environment already exists."
fi

# Activate the virtual environment
source "./.venv/bin/activate"
which python
which pip

# Determine which requirements file to use
if command -v nvidia-smi &>/dev/null; then
  echo "GPU detected. Installing GPU requirements."
  REQUIREMENTS_FILE="./requirements_gpu.txt"
else
  echo "No GPU detected."
  if [ -f "./requirements_gpu.txt" ]; then
    read -p "Do you want to attempt to install GPU requirements? (y/n): " choice
    if [ "$choice" = "y" ]; then
      REQUIREMENTS_FILE="./requirements_gpu.txt"
    else
      REQUIREMENTS_FILE="./requirements.txt"
    fi
  else
    REQUIREMENTS_FILE="./requirements.txt"
  fi
fi

# Install dependencies
pip install -r "$REQUIREMENTS_FILE"
echo "Python environment setup complete."

yarn
echo "Node environment setup complete."
