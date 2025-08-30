"""Tests for Calendar CRUD operations."""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.crud.calendar import CRUDCalendar, calendar
from app.models.calendar import CalendarEvent
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate


class TestCRUDCalendar:
    """Test cases for CRUDCalendar class."""

    @pytest.fixture
    def crud_calendar(self):
        """Create CRUDCalendar instance for testing."""
        return CRUDCalendar()

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = Mock(spec=Session)
        db.query.return_value = db
        db.filter.return_value = db
        db.order_by.return_value = db
        return db

    @pytest.fixture
    def sample_events(self):
        """Create sample calendar events for testing."""
        return [
            CalendarEvent(
                id="event-1",
                user_id="user-123",
                title="Meeting 1",
                start=datetime(2024, 1, 15, 10, 0, tzinfo=timezone.utc),
                end=datetime(2024, 1, 15, 11, 0, tzinfo=timezone.utc)
            ),
            CalendarEvent(
                id="event-2",
                user_id="user-123",
                title="Meeting 2",
                start=datetime(2024, 1, 16, 14, 0, tzinfo=timezone.utc),
                end=datetime(2024, 1, 16, 15, 0, tzinfo=timezone.utc)
            )
        ]

    def test_init(self, crud_calendar):
        """Test CRUDCalendar initialization."""
        assert crud_calendar.model == CalendarEvent

    def test_get_user_events_all(self, crud_calendar, mock_db, sample_events):
        """Test getting all user events without date filters."""
        mock_db.all.return_value = sample_events
        
        result = crud_calendar.get_user_events(mock_db, user_id="user-123")
        
        assert result == sample_events
        mock_db.query.assert_called_once_with(CalendarEvent)
        mock_db.order_by.assert_called_once()

    def test_get_user_events_with_start_filter(self, crud_calendar, mock_db, sample_events):
        """Test getting user events with start date filter."""
        start_date = datetime(2024, 1, 15, tzinfo=timezone.utc)
        mock_db.all.return_value = sample_events
        
        result = crud_calendar.get_user_events(mock_db, user_id="user-123", start=start_date)
        
        assert result == sample_events
        assert mock_db.filter.call_count == 2  # user_id and start filters

    def test_get_user_events_with_end_filter(self, crud_calendar, mock_db, sample_events):
        """Test getting user events with end date filter."""
        end_date = datetime(2024, 1, 20, tzinfo=timezone.utc)
        mock_db.all.return_value = sample_events
        
        result = crud_calendar.get_user_events(mock_db, user_id="user-123", end=end_date)
        
        assert result == sample_events
        assert mock_db.filter.call_count == 2  # user_id and end filters

    def test_get_user_events_with_both_filters(self, crud_calendar, mock_db, sample_events):
        """Test getting user events with both start and end filters."""
        start_date = datetime(2024, 1, 15, tzinfo=timezone.utc)
        end_date = datetime(2024, 1, 20, tzinfo=timezone.utc)
        mock_db.all.return_value = sample_events
        
        result = crud_calendar.get_user_events(
            mock_db, user_id="user-123", start=start_date, end=end_date
        )
        
        assert result == sample_events
        assert mock_db.filter.call_count == 3  # user_id, start, and end filters

    def test_get_user_events_operational_error(self, crud_calendar, mock_db):
        """Test handling OperationalError (missing table)."""
        mock_db.all.side_effect = OperationalError("table missing", None, None)
        
        with pytest.raises(OperationalError):
            crud_calendar.get_user_events(mock_db, user_id="user-123")

    def test_create_for_user_with_naive_datetime(self, crud_calendar, mock_db):
        """Test creating event with naive datetime."""
        event_create = CalendarEventCreate(
            title="Test Event",
            start=datetime(2024, 1, 15, 10, 0),  # naive datetime
            end=datetime(2024, 1, 15, 11, 0)     # naive datetime
        )
        
        with patch.object(crud_calendar.model, '__init__', return_value=None) as mock_init:
            mock_event = Mock()
            crud_calendar.model = Mock(return_value=mock_event)
            
            result = crud_calendar.create_for_user(mock_db, user_id="user-123", obj_in=event_create)
            
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    def test_create_for_user_with_aware_datetime(self, crud_calendar, mock_db):
        """Test creating event with timezone-aware datetime."""
        event_create = CalendarEventCreate(
            title="Test Event",
            start=datetime(2024, 1, 15, 10, 0, tzinfo=timezone.utc),
            end=datetime(2024, 1, 15, 11, 0, tzinfo=timezone.utc)
        )
        
        with patch.object(crud_calendar.model, '__init__', return_value=None):
            mock_event = Mock()
            crud_calendar.model = Mock(return_value=mock_event)
            
            result = crud_calendar.create_for_user(mock_db, user_id="user-123", obj_in=event_create)
            
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

    def test_create_for_user_with_none_dates(self, crud_calendar, mock_db):
        """Test creating event with None start/end dates."""
        event_create = CalendarEventCreate(
            title="Test Event",
            start=None,
            end=None
        )
        
        with patch.object(crud_calendar.model, '__init__', return_value=None):
            mock_event = Mock()
            crud_calendar.model = Mock(return_value=mock_event)
            
            result = crud_calendar.create_for_user(mock_db, user_id="user-123", obj_in=event_create)
            
            mock_db.add.assert_called_once()

    def test_update_for_user_success(self, crud_calendar, mock_db):
        """Test successful event update."""
        mock_event = Mock()
        mock_event.id = "event-123"
        mock_event.user_id = "user-123"
        mock_db.first.return_value = mock_event
        
        event_update = CalendarEventUpdate(title="Updated Event")
        
        result = crud_calendar.update_for_user(
            mock_db, user_id="user-123", event_id="event-123", obj_in=event_update
        )
        
        assert result == mock_event
        assert mock_event.title == "Updated Event"
        mock_db.add.assert_called_once_with(mock_event)
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_event)

    def test_update_for_user_not_found(self, crud_calendar, mock_db):
        """Test event update when event not found."""
        mock_db.first.return_value = None
        
        event_update = CalendarEventUpdate(title="Updated Event")
        
        result = crud_calendar.update_for_user(
            mock_db, user_id="user-123", event_id="nonexistent", obj_in=event_update
        )
        
        assert result is None
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()

    def test_delete_for_user_success(self, crud_calendar, mock_db):
        """Test successful event deletion."""
        mock_query = Mock()
        mock_query.delete.return_value = 1  # 1 row affected
        mock_db.query.return_value.filter.return_value = mock_query
        
        result = crud_calendar.delete_for_user(mock_db, user_id="user-123", event_id="event-123")
        
        assert result is True
        mock_query.delete.assert_called_once_with(synchronize_session=False)
        mock_db.commit.assert_called_once()

    def test_delete_for_user_not_found(self, crud_calendar, mock_db):
        """Test event deletion when event not found."""
        mock_query = Mock()
        mock_query.delete.return_value = 0  # 0 rows affected
        mock_db.query.return_value.filter.return_value = mock_query
        
        result = crud_calendar.delete_for_user(mock_db, user_id="user-123", event_id="nonexistent")
        
        assert result is False
        mock_db.commit.assert_called_once()

    def test_delete_for_user_exception(self, crud_calendar, mock_db):
        """Test event deletion with database exception."""
        mock_query = Mock()
        mock_query.delete.side_effect = Exception("Database error")
        mock_db.query.return_value.filter.return_value = mock_query
        
        result = crud_calendar.delete_for_user(mock_db, user_id="user-123", event_id="event-123")
        
        assert result is False
        mock_db.rollback.assert_called_once()

    @patch('app.core.config.settings')
    def test_delete_for_user_with_debug(self, mock_settings, crud_calendar, mock_db):
        """Test event deletion with debug logging enabled."""
        mock_settings.CALENDAR_DEBUG_ENABLED = True
        mock_query = Mock()
        mock_query.delete.return_value = 1
        mock_db.query.return_value.filter.return_value = mock_query
        
        with patch('logging.getLogger') as mock_logger:
            mock_log = Mock()
            mock_logger.return_value = mock_log
            
            result = crud_calendar.delete_for_user(mock_db, user_id="user-123", event_id="event-123")
            
            assert result is True
            assert mock_log.info.call_count >= 1

    def test_calendar_instance(self):
        """Test that the calendar instance is properly configured."""
        assert isinstance(calendar, CRUDCalendar)
        assert calendar.model == CalendarEvent
