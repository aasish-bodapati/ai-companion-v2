"""Compatibility shim for message CRUD.

This module re-exports the `message` CRUD instance from `app.crud.conversation`.
It exists to preserve backward-compat imports like `from app.crud.message import message`.
"""
from app.crud.conversation import message as message  # noqa: F401

__all__ = ["message"]
