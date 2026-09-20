#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"
source ../.venv/bin/activate
export PYTHONPATH="$DIR"
echo "Starting Pratikar FastAPI Backend on http://0.0.0.0:8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
