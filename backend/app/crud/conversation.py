from typing import Any, Dict, List, Optional, Union

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ConversationCreate, ConversationUpdate, MessageCreate


class CRUDConversation(CRUDBase[Conversation, ConversationCreate, ConversationUpdate]):
    def get_multi_by_user(
        self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Conversation]:
        """
        Get all conversations for a specific user, ordered by most recently updated.
        """
        return (
            db.query(self.model)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_owner(
        self, db: Session, *, obj_in: ConversationCreate, owner_id: str
    ) -> Conversation:
        """
        Create a new conversation with an owner.
        """
        data: Dict[str, Any] = obj_in.model_dump()
        # Ensure a non-empty title to satisfy NOT NULL constraint
        title = (data.get("title") or "").strip()
        if not title:
            data["title"] = "New Conversation"

        db_obj = Conversation(
            **data,
            user_id=owner_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDMessage(CRUDBase[Message, MessageCreate, Any]):
    def get_by_conversation(
        self, db: Session, *, conversation_id: str, skip: int = 0, limit: int = 100
    ) -> List[Message]:
        """
        Get all messages for a specific conversation, ordered by creation time.
        
        Args:
            db: Database session
            conversation_id: ID of the conversation (will be converted to string)
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of Message objects
        """
        # Convert UUID to string if needed
        if hasattr(conversation_id, 'hex'):
            conversation_id = str(conversation_id)
            
        return (
            db.query(self.model)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_conversation(
        self, db: Session, *, obj_in: MessageCreate, conversation_id: str
    ) -> Message:
        """
        Create a new message in a conversation.
        
        Args:
            db: Database session
            obj_in: Message data
            conversation_id: ID of the conversation (will be converted to string)
            
        Returns:
            The created Message object
        """
        # Convert UUID to string if needed
        if hasattr(conversation_id, 'hex'):
            conversation_id = str(conversation_id)
            
        db_obj = Message(
            **obj_in.model_dump(),
            conversation_id=conversation_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Update the conversation's updated_at timestamp
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation:
            conversation.updated_at = func.now()
            db.commit()
            db.refresh(conversation)
        
        return db_obj


conversation = CRUDConversation(Conversation)
message = CRUDMessage(Message)
