from __future__ import annotations

from typing import Optional
from datetime import datetime, timezone
import logging

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
except Exception:  # pragma: no cover - APScheduler optional in dev
    BackgroundScheduler = None  # type: ignore
    CronTrigger = None  # type: ignore

logger = logging.getLogger(__name__)

_scheduler: Optional["BackgroundScheduler"] = None


def _job_log(name: str) -> None:
    logger.info(
        "scheduler: ran job %s at %s",
        name,
        datetime.now(timezone.utc).isoformat(),
    )


def _memory_maintenance_job() -> None:
    """Daily memory maintenance: soft-forget stale items for all users.
    Uses a short-lived DB session and bounded batch size to be safe for dev.
    """
    try:
        from app.db.session import SessionLocal
        from app import crud
        from app.memory.service import memory_service

        db = SessionLocal()
        try:
            users = crud.user.get_multi(db, skip=0, limit=100)
            total_suppressed = 0
            for u in users:
                try:
                    total_suppressed += int(memory_service._maybe_soft_forget(db, str(u.id)) or 0)
                except Exception:
                    continue
            logger.info(
                "scheduler: memory_maintenance suppressed=%d users=%d",
                total_suppressed,
                len(users),
            )
        finally:
            db.close()
    except Exception:
        logger.warning("scheduler: memory_maintenance failed", exc_info=True)


def start_scheduler() -> None:
    global _scheduler
    if BackgroundScheduler is None:
        logger.warning("APScheduler not installed; skipping scheduler start")
        return
    if _scheduler:
        return
    try:
        from app.core.config import settings

        if not getattr(settings, "SCHEDULER_ENABLED", True):
            logger.info("Scheduler disabled by config; not starting")
            return
    except Exception:
        # If settings import fails, default to start in dev
        logger.debug("scheduler: settings import failed; proceeding with start", exc_info=True)
    scheduler = BackgroundScheduler(timezone="UTC")

    # Morning greeting ~08:00 local (approx using UTC 02:30 for IST dev)
    scheduler.add_job(
        lambda: _job_log("morning_greeting"),
        CronTrigger(hour=2, minute=30),
    )

    # Evening reflection ~20:00 local (approx using UTC 14:30 for IST dev)
    scheduler.add_job(
        lambda: _job_log("evening_reflection"),
        CronTrigger(hour=14, minute=30),
    )

    # Weekly recap Sunday 18:00 local (approx UTC 12:30)
    scheduler.add_job(
        lambda: _job_log("weekly_recap"),
        CronTrigger(day_of_week="sun", hour=12, minute=30),
    )

    # Opportunity scan every 3h
    scheduler.add_job(
        lambda: _job_log("opportunity_scan"),
        CronTrigger(minute=0, hour="*/3"),
    )

    # Memory decay tick (placeholder) daily at 03:15 UTC when enabled
    try:
        from app.core.config import settings

        if getattr(settings, "MEMORY_DECAY_ENABLED", False):

            def _decay_tick():
                logger.info(
                    "scheduler: memory_decay_tick | enabled=%s",
                    settings.MEMORY_DECAY_ENABLED,
                )

            scheduler.add_job(_decay_tick, CronTrigger(hour=3, minute=15))
    except Exception:
        # Do not fail scheduler initialization if settings import fails
        logger.debug("scheduler: decay tick setup skipped due to error", exc_info=True)

    # Daily memory maintenance (soft-forget), 03:20 UTC
    try:
        scheduler.add_job(_memory_maintenance_job, CronTrigger(hour=3, minute=20))
    except Exception:
        logger.debug("scheduler: memory maintenance setup failed", exc_info=True)

    scheduler.start()
    _scheduler = scheduler
    logger.info("APScheduler started")


def stop_scheduler() -> None:
    global _scheduler
    try:
        if _scheduler:
            _scheduler.shutdown(wait=False)
            logger.info("APScheduler stopped")
    finally:
        _scheduler = None
