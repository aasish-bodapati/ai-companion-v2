"""
Seed synthetic data into the FAISS vector store for a given user.

Usage:
  python -m scripts.vectordb_seed --user demo --count 1000 --clusters 5 --dim 384 --seed 42

Notes:
- Uses Gaussian clusters to create semantically coherent groups.
- No destructive operations; it only appends to the user's index.
- If FAISS is unavailable in the environment, this script will exit gracefully.
"""
from __future__ import annotations

import argparse
import sys
from typing import List

import numpy as np

# Import from backend package path
try:
    from backend.app.memory import faiss_store  # type: ignore
except Exception:  # pragma: no cover - allow running as module when PYTHONPATH differs
    # Fallback import path when run from repository root via `python scripts/vectordb_seed.py`
    try:
        from app.memory import faiss_store  # type: ignore
    except Exception as e:  # pragma: no cover
        print(f"Failed to import faiss_store: {e}")
        sys.exit(1)


def faiss_available() -> bool:
    # Access internal probe; safe for script usage
    try:
        mod = getattr(faiss_store, "_try_import_faiss", None)
        if mod is None:
            return False
        return mod() is not None
    except Exception:
        return False


def make_clusters(total: int, clusters: int, dim: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    per = max(1, total // clusters)
    remainder = total - per * clusters
    sizes = [per] * clusters
    for i in range(remainder):
        sizes[i % clusters] += 1

    # Draw random cluster centers
    centers = rng.normal(0, 1, size=(clusters, dim)).astype("float32")
    centers /= (np.linalg.norm(centers, axis=1, keepdims=True) + 1e-9)

    points: List[np.ndarray] = []
    for i, n in enumerate(sizes):
        # Tight clusters around centers
        noise = rng.normal(0, 0.1, size=(n, dim)).astype("float32")
        pts = centers[i] + noise
        # Normalize to keep vectors in similar magnitude range
        pts /= (np.linalg.norm(pts, axis=1, keepdims=True) + 1e-9)
        points.append(pts)

    all_points = np.concatenate(points, axis=0).astype("float32")
    return all_points


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed synthetic vectors into FAISS store")
    parser.add_argument("--user", required=True, help="User ID shard to write to")
    parser.add_argument("--count", type=int, default=1000, help="Total vectors to create")
    parser.add_argument("--clusters", type=int, default=5, help="Number of Gaussian clusters")
    parser.add_argument("--dim", type=int, default=384, help="Embedding dimension")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    if args.dim != 384:
        print("Warning: FAISS index is created with dim=384 by default. Non-384 dims may create a new index.")

    if not faiss_available():
        print("FAISS unavailable; skipping seed. Install faiss-cpu and numpy<2 on Windows or run in env with FAISS.")
        sys.exit(0)

    vecs = make_clusters(args.count, args.clusters, args.dim, args.seed)
    ids = [f"{args.user}_mem_{i:06d}" for i in range(args.count)]
    faiss_store.add(args.user, ids, vecs.tolist())

    # Quick sanity query near first id
    q = vecs[0].tolist()
    top = faiss_store.search(args.user, q, 5)
    print(f"Seeded {args.count} vectors for user='{args.user}'. Sample search top-5: {top}")


if __name__ == "__main__":
    main()
