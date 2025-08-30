"""
Tests for scheduler functionality.
"""

import pytest
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime, timezone
import logging

from app.scheduler import (
    _job_log,
    _memory_maintenance_job,
    start_scheduler,
    stop_scheduler,
    _scheduler
)


class TestScheduler:
    """Test scheduler functionality."""

    def test_job_log(self, caplog):
        """Test job logging functionality."""
        with caplog.at_level(logging.INFO):
            _job_log("test_job")
        
        assert "scheduler: ran job test_job" in caplog.text
        assert "test_job" in caplog.text

    def test_job_log_with_timestamp(self, caplog):
        """Test job logging includes timestamp."""
        with caplog.at_level(logging.INFO):
            _job_log("another_job")
        
        # Check that ISO format timestamp is included
        log_entry = caplog.records[-1]
        assert "another_job" in log_entry.message
        assert "scheduler: ran job" in log_entry.message

    @patch('app.scheduler.SessionLocal')
    @patch('app.scheduler.crud')
    @patch('app.scheduler.memory_service')
    def test_memory_maintenance_job_success(self, mock_memory_service, mock_crud, mock_session_local, caplog):
        """Test successful memory maintenance job."""
        # Mock database session
        mock_db = Mock()
        mock_session_local.return_value = mock_db
        
        # Mock users
        mock_user1 = Mock()
        mock_user1.id = "user1"
        mock_user2 = Mock()
        mock_user2.id = "user2"
        mock_users = [mock_user1, mock_user2]
        
        mock_crud.user.get_multi.return_value = mock_users
        mock_memory_service._maybe_soft_forget.side_effect = ["5", "3"]
        
        with caplog.at_level(logging.INFO):
            _memory_maintenance_job()
        
        # Verify database operations
        mock_session_local.assert_called_once()
        mock_crud.user.get_multi.assert_called_once_with(mock_db, skip=0, limit=100)
        mock_memory_service._maybe_soft_forget.assert_has_calls([
            Mock(mock_db, "user1"),
            Mock(mock_db, "user2")
        ])
        mock_db.close.assert_called_once()
        
        # Check logging
        assert "memory_maintenance suppressed=8 users=2" in caplog.text

    @patch('app.scheduler.SessionLocal')
    @patch('app.scheduler.crud')
    @patch('app.scheduler.memory_service')
    def test_memory_maintenance_job_with_exception(self, mock_memory_service, mock_crud, mock_session_local, caplog):
        """Test memory maintenance job handles exceptions gracefully."""
        # Mock database session
        mock_db = Mock()
        mock_session_local.return_value = mock_db
        
        # Mock users
        mock_user1 = Mock()
        mock_user1.id = "user1"
        mock_user2 = Mock()
        mock_user2.id = "user2"
        mock_users = [mock_user1, mock_user2]
        
        mock_crud.user.get_multi.return_value = mock_users
        mock_memory_service._maybe_soft_forget.side_effect = ["5", Exception("Memory service error")]
        
        with caplog.at_level(logging.INFO):
            _memory_maintenance_job()
        
        # Should still complete successfully despite one user failing
        mock_db.close.assert_called_once()
        assert "memory_maintenance suppressed=5 users=2" in caplog.text

    @patch('app.scheduler.SessionLocal')
    def test_memory_maintenance_job_db_error(self, mock_session_local, caplog):
        """Test memory maintenance job handles database errors."""
        mock_session_local.side_effect = Exception("Database connection failed")
        
        with caplog.at_level(logging.WARNING):
            _memory_maintenance_job()
        
        assert "memory_maintenance failed" in caplog.text

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_start_scheduler_success(self, mock_cron_trigger, mock_scheduler_class, caplog):
        """Test successful scheduler start."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = True
            
            with caplog.at_level(logging.INFO):
                start_scheduler()
            
            # Verify scheduler was created and started
            mock_scheduler_class.assert_called_once_with(timezone="UTC")
            mock_scheduler.add_job.assert_called()
            mock_scheduler.start.assert_called_once()
            
            assert "APScheduler started" in caplog.text

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_start_scheduler_disabled(self, mock_cron_trigger, mock_scheduler_class, caplog):
        """Test scheduler start when disabled in config."""
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = False
            
            with caplog.at_level(logging.INFO):
                start_scheduler()
            
            # Should not create or start scheduler
            mock_scheduler_class.assert_not_called()
            assert "Scheduler disabled by config" in caplog.text

    @patch('app.scheduler.BackgroundScheduler')
    def test_start_scheduler_no_apscheduler(self, mock_scheduler_class, caplog):
        """Test scheduler start when APScheduler is not available."""
        # Mock APScheduler not being available
        with patch('app.scheduler.BackgroundScheduler', None):
            with caplog.at_level(logging.WARNING):
                start_scheduler()
            
            assert "APScheduler not installed" in caplog.text

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_start_scheduler_already_running(self, mock_cron_trigger, mock_scheduler_class, caplog):
        """Test scheduler start when already running."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        # Set global scheduler
        import app.scheduler
        app.scheduler._scheduler = Mock()
        
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = True
            
            start_scheduler()
            
            # Should not create new scheduler
            mock_scheduler_class.assert_not_called()
        
        # Clean up
        app.scheduler._scheduler = None

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_start_scheduler_with_memory_decay_enabled(self, mock_cron_trigger, mock_scheduler_class, caplog):
        """Test scheduler start with memory decay enabled."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = True
            mock_settings.MEMORY_DECAY_ENABLED = True
            
            with caplog.at_level(logging.INFO):
                start_scheduler()
            
            # Should add memory decay job
            assert mock_scheduler.add_job.call_count >= 6  # Including memory decay job

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_start_scheduler_settings_import_error(self, mock_cron_trigger, mock_scheduler_class, caplog):
        """Test scheduler start when settings import fails."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        with patch('app.scheduler.settings', side_effect=ImportError("Settings not available")):
            with caplog.at_level(logging.DEBUG):
                start_scheduler()
            
            # Should still start scheduler
            mock_scheduler.start.assert_called_once()
            assert "settings import failed" in caplog.text

    def test_stop_scheduler_success(self, caplog):
        """Test successful scheduler stop."""
        # Set up a mock scheduler
        mock_scheduler = Mock()
        import app.scheduler
        app.scheduler._scheduler = mock_scheduler
        
        with caplog.at_level(logging.INFO):
            stop_scheduler()
        
        # Verify shutdown was called
        mock_scheduler.shutdown.assert_called_once_with(wait=False)
        assert "APScheduler stopped" in caplog.text
        
        # Verify scheduler was cleared
        assert app.scheduler._scheduler is None

    def test_stop_scheduler_no_scheduler(self, caplog):
        """Test scheduler stop when no scheduler is running."""
        # Ensure no scheduler
        import app.scheduler
        app.scheduler._scheduler = None
        
        with caplog.at_level(logging.INFO):
            stop_scheduler()
        
        # Should not fail
        assert app.scheduler._scheduler is None

    def test_stop_scheduler_with_exception(self, caplog):
        """Test scheduler stop handles exceptions gracefully."""
        # Set up a mock scheduler that raises an exception
        mock_scheduler = Mock()
        mock_scheduler.shutdown.side_effect = Exception("Shutdown failed")
        
        import app.scheduler
        app.scheduler._scheduler = mock_scheduler
        
        with caplog.at_level(logging.INFO):
            stop_scheduler()
        
        # Should still clear the scheduler
        assert app.scheduler._scheduler is None

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_scheduler_job_configuration(self, mock_cron_trigger, mock_scheduler_class):
        """Test that scheduler jobs are configured correctly."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = True
            mock_settings.MEMORY_DECAY_ENABLED = False
            
            start_scheduler()
            
            # Verify jobs were added
            assert mock_scheduler.add_job.call_count >= 5  # morning_greeting, evening_reflection, weekly_recap, opportunity_scan, memory_maintenance
            
            # Check specific job configurations
            calls = mock_scheduler.add_job.call_args_list
            
            # Morning greeting at 02:30 UTC
            morning_call = next((call for call in calls if 'morning_greeting' in str(call)), None)
            assert morning_call is not None
            
            # Evening reflection at 14:30 UTC
            evening_call = next((call for call in calls if 'evening_reflection' in str(call)), None)
            assert evening_call is not None
            
            # Weekly recap on Sunday at 12:30 UTC
            weekly_call = next((call for call in calls if 'weekly_recap' in str(call)), None)
            assert weekly_call is not None
            
            # Opportunity scan every 3 hours
            opportunity_call = next((call for call in calls if 'opportunity_scan' in str(call)), None)
            assert opportunity_call is not None

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_memory_maintenance_job_setup(self, mock_cron_trigger, mock_scheduler_class):
        """Test memory maintenance job setup."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = True
            
            start_scheduler()
            
            # Verify memory maintenance job was added
            calls = mock_scheduler.add_job.call_args_list
            memory_maintenance_call = next((call for call in calls if '_memory_maintenance_job' in str(call)), None)
            assert memory_maintenance_call is not None

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_memory_decay_job_setup_when_enabled(self, mock_cron_trigger, mock_scheduler_class):
        """Test memory decay job setup when enabled."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = True
            mock_settings.MEMORY_DECAY_ENABLED = True
            
            start_scheduler()
            
            # Verify memory decay job was added
            calls = mock_scheduler.add_job.call_args_list
            decay_call = next((call for call in calls if 'memory_decay_tick' in str(call) or 'decay_tick' in str(call)), None)
            assert decay_call is not None

    @patch('app.scheduler.BackgroundScheduler')
    @patch('app.scheduler.CronTrigger')
    def test_memory_decay_job_setup_when_disabled(self, mock_cron_trigger, mock_scheduler_class):
        """Test memory decay job setup when disabled."""
        mock_scheduler = Mock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_cron_trigger.return_value = Mock()
        
        with patch('app.scheduler.settings') as mock_settings:
            mock_settings.SCHEDULER_ENABLED = True
            mock_settings.MEMORY_DECAY_ENABLED = False
            
            start_scheduler()
            
            # Verify memory decay job was NOT added
            calls = mock_scheduler.add_job.call_args_list
            decay_call = next((call for call in calls if 'memory_decay_tick' in str(call) or 'decay_tick' in str(call)), None)
            assert decay_call is None
