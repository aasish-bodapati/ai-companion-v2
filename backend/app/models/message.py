"""DEPRECATED: app.models.message

This module previously defined a SQLAlchemy `Message` model that also used the
`messages` table. The canonical `Message` model now lives in
`app/models/conversation.py` alongside `Conversation` and is the only one
referenced by the application. Keeping this file active risks duplicate table
mapping and schema drift.

Do not import from this module. It intentionally provides no SQLAlchemy models.
"""

import warnings

warnings.warn(
    "app.models.message is deprecated and unused; use app.models.conversation.Message instead",
    DeprecationWarning,
    stacklevel=2,
)

# No-op: intentionally no model definitions here.
