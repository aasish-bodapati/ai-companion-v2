"""Compatibility shim for message schemas.

Re-exports `MessageCreate` and `Message` from `app.schemas.conversation` to
support legacy imports like `from app.schemas.message import MessageCreate`.
"""

from app.schemas.conversation import MessageCreate, Message  # noqa: F401

__all__ = ["MessageCreate", "Message"]
