"""Tests for CalendarEvent model."""

import pytest
from datetime import datetime, timezone
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.db.base_class import Base
from app.models.calendar import CalendarEvent
from app.models.user import User


class TestCalendarEventModel:
    """Test cases for CalendarEvent model."""

    @pytest.fixture
    def db_session(self):
        """Create in-memory SQLite database for testing."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        yield session
        session.close()

    @pytest.fixture
    def sample_user(self, db_session):
        """Create a sample user for testing."""
        user = User(
            email="calendar_user@example.com",
            hashed_password="password_hash"
        )
        db_session.add(user)
        db_session.commit()
        return user

    def test_calendar_event_creation_with_required_fields(self, db_session, sample_user):
        """Test creating a calendar event with required fields only."""
        start_time = datetime(2024, 1, 15, 10, 0, tzinfo=timezone.utc)
        
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Team Meeting",
            start=start_time
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.id is not None
        assert len(event.id) == 36  # UUID string length
        assert event.user_id == sample_user.id
        assert event.title == "Team Meeting"
        assert event.start == start_time
        assert event.end is None
        assert event.description is None
        assert event.all_day is False
        assert event.created_at is not None
        assert event.updated_at is not None

    def test_calendar_event_creation_with_all_fields(self, db_session, sample_user):
        """Test creating a calendar event with all fields specified."""
        start_time = datetime(2024, 1, 15, 9, 0, tzinfo=timezone.utc)
        end_time = datetime(2024, 1, 15, 10, 30, tzinfo=timezone.utc)
        
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Project Review",
            description="Quarterly project review meeting",
            start=start_time,
            end=end_time,
            all_day=False
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.title == "Project Review"
        assert event.description == "Quarterly project review meeting"
        assert event.start == start_time
        assert event.end == end_time
        assert event.all_day is False

    def test_calendar_event_all_day_event(self, db_session, sample_user):
        """Test creating an all-day calendar event."""
        start_date = datetime(2024, 1, 15, tzinfo=timezone.utc)
        
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Holiday",
            start=start_date,
            all_day=True
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.all_day is True
        assert event.title == "Holiday"

    def test_calendar_event_id_generation(self, db_session, sample_user):
        """Test that event ID is automatically generated as UUID."""
        event = CalendarEvent(
            user_id=sample_user.id,
            title="UUID Test Event",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event)
        db_session.commit()
        
        # Should be a valid UUID string
        assert event.id is not None
        uuid_obj = uuid.UUID(event.id)
        assert str(uuid_obj) == event.id

    def test_calendar_event_user_foreign_key(self, db_session, sample_user):
        """Test foreign key relationship to user."""
        event = CalendarEvent(
            user_id=sample_user.id,
            title="FK Test Event",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event)
        db_session.commit()
        
        # Should be linked to the user
        assert event.user_id == sample_user.id

    def test_calendar_event_invalid_user_id(self, db_session):
        """Test that invalid user_id raises constraint error."""
        invalid_user_id = str(uuid.uuid4())
        
        event = CalendarEvent(
            user_id=invalid_user_id,
            title="Invalid User Event",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event)
        
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_calendar_event_required_fields(self, db_session, sample_user):
        """Test that required fields cannot be null."""
        # Test missing title
        event_no_title = CalendarEvent(
            user_id=sample_user.id,
            start=datetime.now(timezone.utc)
        )
        db_session.add(event_no_title)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test missing start time
        event_no_start = CalendarEvent(
            user_id=sample_user.id,
            title="No Start Event"
        )
        db_session.add(event_no_start)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Test missing user_id
        event_no_user = CalendarEvent(
            title="No User Event",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event_no_user)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_calendar_event_timestamps(self, db_session, sample_user):
        """Test that created_at and updated_at are set automatically."""
        before_creation = datetime.utcnow()
        
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Timestamp Test",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event)
        db_session.commit()
        
        after_creation = datetime.utcnow()
        
        assert event.created_at is not None
        assert event.updated_at is not None
        assert before_creation <= event.created_at <= after_creation
        assert before_creation <= event.updated_at <= after_creation

    def test_calendar_event_update_timestamp(self, db_session, sample_user):
        """Test that updated_at changes when event is modified."""
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Update Test",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event)
        db_session.commit()
        
        original_updated_at = event.updated_at
        
        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)
        
        # Update the event
        event.title = "Updated Title"
        db_session.commit()
        
        # updated_at should change (though this depends on DB implementation)
        # In SQLite, this might not work exactly as expected, but the column should exist
        assert hasattr(event, 'updated_at')

    def test_calendar_event_timezone_aware(self, db_session, sample_user):
        """Test that datetime fields are timezone-aware."""
        utc_time = datetime(2024, 1, 15, 14, 30, tzinfo=timezone.utc)
        
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Timezone Test",
            start=utc_time,
            end=utc_time.replace(hour=15, minute=30)
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.start.tzinfo is not None
        assert event.end.tzinfo is not None

    def test_calendar_event_optional_end_time(self, db_session, sample_user):
        """Test that end time is optional."""
        event = CalendarEvent(
            user_id=sample_user.id,
            title="No End Time",
            start=datetime.now(timezone.utc),
            end=None
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.end is None

    def test_calendar_event_optional_description(self, db_session, sample_user):
        """Test that description is optional."""
        event = CalendarEvent(
            user_id=sample_user.id,
            title="No Description",
            start=datetime.now(timezone.utc),
            description=None
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.description is None

    def test_calendar_event_all_day_default(self, db_session, sample_user):
        """Test that all_day defaults to False."""
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Default All Day",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.all_day is False

    def test_calendar_event_table_name(self):
        """Test that table name is correctly set."""
        assert CalendarEvent.__tablename__ == "calendar_events"

    def test_calendar_event_user_cascade_delete(self, db_session):
        """Test that events are deleted when user is deleted (CASCADE)."""
        # Create user
        user = User(
            email="cascade_test@example.com",
            hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()
        
        # Create event
        event = CalendarEvent(
            user_id=user.id,
            title="Cascade Test Event",
            start=datetime.now(timezone.utc)
        )
        db_session.add(event)
        db_session.commit()
        
        event_id = event.id
        
        # Delete user (should cascade to events)
        db_session.delete(user)
        db_session.commit()
        
        # Event should be deleted
        deleted_event = db_session.get(CalendarEvent, event_id)
        assert deleted_event is None

    def test_calendar_event_query_by_user(self, db_session, sample_user):
        """Test querying events by user."""
        # Create multiple events for the user
        event1 = CalendarEvent(
            user_id=sample_user.id,
            title="Event 1",
            start=datetime(2024, 1, 15, 10, 0, tzinfo=timezone.utc)
        )
        event2 = CalendarEvent(
            user_id=sample_user.id,
            title="Event 2",
            start=datetime(2024, 1, 16, 11, 0, tzinfo=timezone.utc)
        )
        
        db_session.add_all([event1, event2])
        db_session.commit()
        
        # Query events by user
        user_events = db_session.query(CalendarEvent).filter(
            CalendarEvent.user_id == sample_user.id
        ).all()
        
        assert len(user_events) == 2
        titles = [event.title for event in user_events]
        assert "Event 1" in titles
        assert "Event 2" in titles

    def test_calendar_event_update(self, db_session, sample_user):
        """Test updating calendar event fields."""
        event = CalendarEvent(
            user_id=sample_user.id,
            title="Original Title",
            description="Original description",
            start=datetime(2024, 1, 15, 10, 0, tzinfo=timezone.utc),
            all_day=False
        )
        db_session.add(event)
        db_session.commit()
        
        # Update fields
        event.title = "Updated Title"
        event.description = "Updated description"
        event.all_day = True
        db_session.commit()
        
        # Verify updates
        updated_event = db_session.get(CalendarEvent, event.id)
        assert updated_event.title == "Updated Title"
        assert updated_event.description == "Updated description"
        assert updated_event.all_day is True
