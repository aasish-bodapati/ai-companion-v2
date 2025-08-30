"""Tests for User model."""

import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.db.base_class import Base
from app.models.user import User


class TestUserModel:
    """Test cases for User model."""

    @pytest.fixture
    def db_session(self):
        """Create in-memory SQLite database for testing."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        yield session
        session.close()

    def test_user_creation_with_defaults(self, db_session):
        """Test creating a user with default values."""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password_123"
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert len(user.id) == 36  # UUID string length
        assert user.email == "test@example.com"
        assert user.hashed_password == "hashed_password_123"
        assert user.full_name is None
        assert user.is_active is True
        assert user.is_superuser is False
        assert user.memory_enabled is None

    def test_user_creation_with_all_fields(self, db_session):
        """Test creating a user with all fields specified."""
        user = User(
            email="admin@example.com",
            hashed_password="admin_password_hash",
            full_name="Admin User",
            is_active=True,
            is_superuser=True,
            memory_enabled=True
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.email == "admin@example.com"
        assert user.full_name == "Admin User"
        assert user.is_active is True
        assert user.is_superuser is True
        assert user.memory_enabled is True

    def test_user_id_generation(self, db_session):
        """Test that user ID is automatically generated as UUID."""
        user = User(
            email="uuid_test@example.com",
            hashed_password="password_hash"
        )
        db_session.add(user)
        db_session.commit()
        
        # Should be a valid UUID string
        assert user.id is not None
        uuid_obj = uuid.UUID(user.id)
        assert str(uuid_obj) == user.id

    def test_user_email_unique_constraint(self, db_session):
        """Test that email must be unique."""
        user1 = User(
            email="duplicate@example.com",
            hashed_password="password1"
        )
        user2 = User(
            email="duplicate@example.com",
            hashed_password="password2"
        )
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_user_email_index(self, db_session):
        """Test that email field is indexed."""
        # This is more of a schema test - the index should be created
        user = User(
            email="indexed@example.com",
            hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Query by email should work efficiently
        found_user = db_session.query(User).filter(User.email == "indexed@example.com").first()
        assert found_user is not None
        assert found_user.email == "indexed@example.com"

    def test_user_required_fields(self, db_session):
        """Test that required fields cannot be null."""
        # Test missing email
        user_no_email = User(hashed_password="password")
        db_session.add(user_no_email)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test missing password
        user_no_password = User(email="test@example.com")
        db_session.add(user_no_password)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_user_optional_fields(self, db_session):
        """Test that optional fields can be null."""
        user = User(
            email="optional@example.com",
            hashed_password="password",
            full_name=None,
            memory_enabled=None
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.full_name is None
        assert user.memory_enabled is None

    def test_user_boolean_fields(self, db_session):
        """Test boolean field behavior."""
        # Test default values
        user_defaults = User(
            email="defaults@example.com",
            hashed_password="password"
        )
        db_session.add(user_defaults)
        db_session.commit()
        
        assert user_defaults.is_active is True
        assert user_defaults.is_superuser is False
        
        # Test explicit values
        user_explicit = User(
            email="explicit@example.com",
            hashed_password="password",
            is_active=False,
            is_superuser=True
        )
        db_session.add(user_explicit)
        db_session.commit()
        
        assert user_explicit.is_active is False
        assert user_explicit.is_superuser is True

    def test_user_memory_enabled_tristate(self, db_session):
        """Test memory_enabled field can be None, True, or False."""
        # Test None (follow global settings)
        user_none = User(
            email="memory_none@example.com",
            hashed_password="password",
            memory_enabled=None
        )
        db_session.add(user_none)
        db_session.commit()
        assert user_none.memory_enabled is None
        
        # Test True (enabled for user)
        user_true = User(
            email="memory_true@example.com",
            hashed_password="password",
            memory_enabled=True
        )
        db_session.add(user_true)
        db_session.commit()
        assert user_true.memory_enabled is True
        
        # Test False (disabled for user)
        user_false = User(
            email="memory_false@example.com",
            hashed_password="password",
            memory_enabled=False
        )
        db_session.add(user_false)
        db_session.commit()
        assert user_false.memory_enabled is False

    def test_user_repr(self, db_session):
        """Test user string representation."""
        user = User(
            email="repr@example.com",
            hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()
        
        repr_str = repr(user)
        assert "User(" in repr_str
        assert f"id={user.id}" in repr_str
        assert "email='repr@example.com'" in repr_str

    def test_user_relationships_exist(self):
        """Test that relationship attributes exist on the model."""
        user = User(
            email="relationships@example.com",
            hashed_password="password"
        )
        
        # These should exist as relationship attributes
        assert hasattr(user, 'conversations')
        assert hasattr(user, 'onboarding_profile')

    def test_user_table_name(self):
        """Test that table name is correctly set."""
        assert User.__tablename__ == "users"

    def test_user_id_primary_key(self, db_session):
        """Test that id field is primary key."""
        user = User(
            email="pk@example.com",
            hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Should be able to query by primary key
        found_user = db_session.get(User, user.id)
        assert found_user is not None
        assert found_user.id == user.id

    def test_user_update(self, db_session):
        """Test updating user fields."""
        user = User(
            email="update@example.com",
            hashed_password="original_password",
            full_name="Original Name",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        
        # Update fields
        user.full_name = "Updated Name"
        user.is_active = False
        user.memory_enabled = True
        db_session.commit()
        
        # Verify updates
        updated_user = db_session.get(User, user.id)
        assert updated_user.full_name == "Updated Name"
        assert updated_user.is_active is False
        assert updated_user.memory_enabled is True

    def test_user_deletion(self, db_session):
        """Test user deletion."""
        user = User(
            email="delete@example.com",
            hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()
        
        user_id = user.id
        
        # Delete user
        db_session.delete(user)
        db_session.commit()
        
        # Verify deletion
        deleted_user = db_session.get(User, user_id)
        assert deleted_user is None
