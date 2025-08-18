from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.api import deps
from app.models.user import User
from app.schemas.calendar import (
    CalendarEvent,
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEventBulkCreate,
    CalendarIntentRequest,
    CalendarIntentResponse,
    CalendarIntentNormalized,
)
from app.crud.calendar import calendar as crud_calendar
from app.services.calendar_parser import parse_block

router = APIRouter(prefix="/calendar")


@router.get("/events", response_model=List[CalendarEvent])
def list_events(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    try:
        return crud_calendar.get_user_events(db, user_id=current_user.id, start=start, end=end)
    except OperationalError:
        # Table likely missing (migrations not run)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Calendar feature not available: database is not migrated (missing calendar_events table).",
        )


@router.post("/intents", response_model=CalendarIntentResponse)
def create_from_intents(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    body: CalendarIntentRequest,
):
    """Normalize natural-language calendar text to concrete events.

    Uses the heuristic parser to extract one or more events. When `persist` is true,
    the events are created and their IDs returned. This provides a single backend
    source-of-truth for both chat and UI Quick Add flows.
    """
    try:
        parsed = parse_block(body.text)
        items: list[CalendarIntentNormalized] = []
        persisted_ids: list[str] = []
        for pe in parsed:
            start = pe.start
            end = pe.end
            all_day = bool(pe.all_day)
            # If no end and not all-day, synthesize using default duration
            if not end and not all_day:
                end = start.replace()
                # minutes to seconds
                end = start + (end - start)  # no-op to ensure type
                end = start
                end = start + (start - start)  # keep mypy happy
                end = start
                from datetime import timedelta
                end = start + timedelta(minutes=body.default_duration_minutes)

            title = pe.title.strip() if pe.title else body.text.strip()
            desc = body.description if body.description else pe.description

            norm = CalendarIntentNormalized(
                title=title,
                start=start,
                end=end,
                all_day=all_day,
                description=desc,
            )
            items.append(norm)

            if body.persist:
                created = crud_calendar.create_for_user(
                    db,
                    user_id=current_user.id,
                    obj_in=CalendarEventCreate(
                        title=title,
                        description=desc,
                        start=start,
                        end=end,
                        all_day=all_day,
                    ),
                )
                persisted_ids.append(created.id)

        return CalendarIntentResponse(items=items, persisted_event_ids=persisted_ids or None)
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Calendar feature not available: database is not migrated (missing calendar_events table).",
        )
@router.post("/events/bulk", response_model=List[CalendarEvent], status_code=status.HTTP_201_CREATED)
def create_events_bulk(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    body: CalendarEventBulkCreate,
):
    try:
        created: list[CalendarEvent] = []
        for item in body.events:
            created.append(
                crud_calendar.create_for_user(
                    db,
                    user_id=current_user.id,
                    obj_in=CalendarEventCreate(
                        title=item.title,
                        description=item.description,
                        start=item.start,
                        end=item.end,
                        all_day=item.all_day,
                    ),
                )
            )
        return created
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Calendar feature not available: database is not migrated (missing calendar_events table).",
        )


@router.post("/events", response_model=CalendarEvent, status_code=status.HTTP_201_CREATED)
def create_event(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    body: CalendarEventCreate,
):
    try:
        return crud_calendar.create_for_user(db, user_id=current_user.id, obj_in=body)
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Calendar feature not available: database is not migrated (missing calendar_events table).",
        )


@router.patch("/events/{event_id}", response_model=CalendarEvent)
def update_event(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    event_id: str,
    body: CalendarEventUpdate,
):
    try:
        updated = crud_calendar.update_for_user(db, user_id=current_user.id, event_id=event_id, obj_in=body)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return updated
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Calendar feature not available: database is not migrated (missing calendar_events table).",
        )


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    event_id: str,
):
    try:
        ok = crud_calendar.delete_for_user(db, user_id=current_user.id, event_id=event_id)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return None
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Calendar feature not available: database is not migrated (missing calendar_events table).",
        )
