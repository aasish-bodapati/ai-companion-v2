# Ensures tests can import `app.*` by adding the real backend source dir to sys.path
# Python's site module auto-imports `sitecustomize` if present on sys.path.
import os
import sys

ROOT = os.path.dirname(__file__)
BACKEND_SRC = os.path.join(ROOT, "backend")
if BACKEND_SRC not in sys.path:
    sys.path.insert(0, BACKEND_SRC)
