from typing import List
import threading

from app.core.config import settings
import threading as _t
import time as _time

_model = None
_lock = threading.Lock()


# Best-effort background warmup so first request isn't penalized
def _background_warmup():
    try:
        model_name = getattr(settings, "EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
        # Small sleep to avoid competing with startup logging
        _time.sleep(0.2)
        _lazy_load(model_name)
    except Exception:
        pass


try:
    _t.Thread(target=_background_warmup, daemon=True).start()
except Exception:
    pass


def _lazy_load(model_name: str):
    global _model
    if _model is not None:
        return _model
    with _lock:
        if _model is not None:
            return _model
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore

            _model = SentenceTransformer(model_name)
        except Exception:
            _model = None
    return _model


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed a batch of texts using the configured model. Returns normalized vectors.
    If the model cannot be loaded, returns a deterministic small vector fallback
    to keep unit tests and non-ML environments functional.
    """
    model_name = getattr(settings, "EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    model = _lazy_load(model_name)
    if model is None:
        # Fallback: deterministic vectors matching FAISS dim (384)
        # Use a simple hash-based PRNG to generate stable values per text
        import random as _rand

        dim = 384
        vecs: List[List[float]] = []
        for t in texts:
            seed = hash(t) & 0xFFFFFFFF
            rng = _rand.Random(seed)
            v = [rng.random() for _ in range(dim)]
            # L2 normalize to roughly match SentenceTransformer normalize_embeddings=True
            import math as _math

            norm = _math.sqrt(sum(x * x for x in v)) or 1.0
            vecs.append([x / norm for x in v])
        return vecs
    vectors = model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
    return vectors.tolist()


def get_embedding(text: str) -> List[float]:
    """
    Compatibility helper: return a single embedding for a text.
    Unit tests patch this symbol directly.
    """
    vecs = embed_texts([text])
    return vecs[0] if vecs else []


def get_embedding_dimension() -> int:
    """Compatibility helper returning the embedding dimension (default 384)."""
    try:
        # If model is loaded, infer from a tiny probe
        model_name = getattr(settings, "EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
        model = _lazy_load(model_name)
        if model is None:
            return 384
        v = model.encode(["probe"], normalize_embeddings=True)
        return int(v.shape[1]) if hasattr(v, "shape") and len(getattr(v, "shape", [])) == 2 else 384
    except Exception:
        return 384
