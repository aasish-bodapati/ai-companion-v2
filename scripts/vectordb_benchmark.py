"""
Simple FAISS search benchmark using the repository's vector store interface.

Usage:
  python -m scripts.vectordb_benchmark --user bench --count 20000 --queries 200 --topk 10 25 50

Notes:
- If no prior vectors exist for the user, it seeds random (normalized) vectors first.
- If FAISS is unavailable in the environment, exits gracefully with a message.
"""
from __future__ import annotations

import argparse
import statistics
import sys
import time
from typing import List

import numpy as np

try:
    from backend.app.memory import faiss_store  # type: ignore
except Exception:  # pragma: no cover
    from app.memory import faiss_store  # type: ignore


def faiss_available() -> bool:
    try:
        return getattr(faiss_store, "_try_import_faiss")() is not None
    except Exception:
        return False


def ensure_vectors(user: str, count: int, dim: int = 384, seed: int = 7) -> None:
    rng = np.random.default_rng(seed)
    vecs = rng.normal(0, 1, size=(count, dim)).astype("float32")
    vecs /= (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9)
    ids = [f"{user}_b_{i:07d}" for i in range(count)]
    faiss_store.add(user, ids, vecs.tolist())


def run_benchmark(user: str, count: int, queries: int, topks: List[int], dim: int = 384, seed: int = 11) -> None:
    rng = np.random.default_rng(seed)
    # Create query set on the sphere
    q = rng.normal(0, 1, size=(queries, dim)).astype("float32")
    q /= (np.linalg.norm(q, axis=1, keepdims=True) + 1e-9)

    print(f"Benchmark: user={user}, count~{count}, queries={queries}, topks={topks}")

    for k in topks:
        latencies: List[float] = []
        started = time.perf_counter()
        for i in range(queries):
            t0 = time.perf_counter()
            _ = faiss_store.search(user, q[i].tolist(), k)
            latencies.append((time.perf_counter() - t0) * 1000.0)
        elapsed = (time.perf_counter() - started)
        qps = queries / elapsed if elapsed > 0 else float('inf')
        print(
            f"top_k={k:>3} | p50={statistics.median(latencies):6.2f}ms "
            f"p95={np.percentile(latencies,95):6.2f}ms p99={np.percentile(latencies,99):6.2f}ms "
            f"qps={qps:6.1f}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="FAISS vector search benchmark")
    parser.add_argument("--user", default="bench", help="User shard")
    parser.add_argument("--count", type=int, default=20000, help="Target number of vectors")
    parser.add_argument("--queries", type=int, default=200, help="# of search queries to issue")
    parser.add_argument("--topk", type=int, nargs="+", default=[10, 25, 50], help="List of top_k values")
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    if not faiss_available():
        print("FAISS unavailable; skipping benchmark. Install faiss-cpu to enable.")
        sys.exit(0)

    # Best effort: always add the requested amount (idempotency not guaranteed).
    ensure_vectors(args.user, args.count, seed=args.seed)
    run_benchmark(args.user, args.count, args.queries, args.topk, seed=args.seed + 1)


if __name__ == "__main__":
    main()
