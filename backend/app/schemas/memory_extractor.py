from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ExtractedMemories(BaseModel):
    """Strict schema for LLM-based memory extraction results.

    Expected payload shape from the extractor LLM:
    {
      "memories": ["short fact", "another preference"],
      "version": "v1",
      "source": "llm-extractor"
    }
    - memories: list of non-empty strings, each <= 200 chars
    - version/source: optional tags for tracing
    """

    model_config = ConfigDict(extra="ignore", frozen=False)

    memories: List[str] = Field(
        default_factory=list,
        description="List of concise memory candidates",
    )
    version: Optional[str] = Field(default=None, max_length=20)
    source: Optional[str] = Field(default=None, max_length=40)

    @field_validator("memories", mode="after")
    @classmethod
    def _validate_memories(cls, v: List[str]) -> List[str]:
        out: List[str] = []
        if not v:
            return out
        for item in v:
            if not isinstance(item, str):
                continue
            s = item.strip()
            if not s:
                continue
            if len(s) > 200:
                s = s[:200]
            out.append(s)
        return out
