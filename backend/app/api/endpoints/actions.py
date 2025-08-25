from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from app.api import deps
from app.models.user import User
from app.actions.registry import registry, ExecuteActionRequest
from app.core.config import settings
from app.actions.router import router as action_router

router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("")
async def list_actions(
    current_user: User = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """
    Discovery endpoint returning available actions and their JSON Schemas.
    """
    items = [a.model_dump() for a in registry.list()]
    return {"actions": items}


@router.post("/execute")
async def execute_action(
    payload: Dict[str, Any],
    current_user: User = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """
    Execute a registered action via the centralized `ActionRouter`.
    Returns standardized success/error shape.
    """
    # Normalize payload and ensure action exists
    action_name = (payload or {}).get("action")
    params = (payload or {}).get("params") or {}
    client_action_id = (payload or {}).get("client_action_id")
    desc = registry.get(action_name)
    if not desc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown action")

    # Check action permissions based on scopes
    if desc.scopes:
        # For now, implement basic scope checking - can be extended with role-based access
        required_scopes = set(desc.scopes)
        # All authenticated users have basic scopes for MVP
        user_scopes = {'fitness:write', 'nutrition:write', 'journal:write', 'goals:write', 'calendar:write'}
        
        if not required_scopes.issubset(user_scopes):
            missing_scopes = required_scopes - user_scopes
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Insufficient permissions. Missing scopes: {', '.join(missing_scopes)}"
            )

    # Construct internal request with authenticated user context
    req = ExecuteActionRequest(
        action=action_name,
        params=params,
        user_id=str(current_user.id),
        conversation_id=None,
        client_action_id=client_action_id,
    )
    res = action_router.execute(req)
    if not res.ok:
        # Map standardized codes to HTTP status while still returning shape
        code = (res.code or "internal_error")
        status_map = {
            "not_found": status.HTTP_404_NOT_FOUND,
            "validation_error": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "forbidden": status.HTTP_403_FORBIDDEN,
            "internal_error": status.HTTP_500_INTERNAL_SERVER_ERROR,
        }
        http_status = status_map.get(code, status.HTTP_400_BAD_REQUEST)
        # Return consistent body with appropriate HTTP code
        raise HTTPException(status_code=http_status, detail={
            "ok": False,
            "action": res.action,
            "error": res.error or "Action failed",
            "code": code,
        })

    return {"ok": True, "action": res.action, "result": res.result}


@router.post("/undo")
async def undo_action(
    payload: Dict[str, Any],
    current_user: User = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """
    Undo a previous action using an `undo_token` issued by an action result.
    Returns standardized success/error shape.
    """
    undo_token = (payload or {}).get("undo_token")
    if not isinstance(undo_token, str) or not undo_token:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={
            "ok": False,
            "action": "undo",
            "error": "undo_token is required",
            "code": "validation_error",
        })

    res = action_router.undo(undo_token)
    if not res.ok:
        code = (res.code or "internal_error")
        status_map = {
            "not_found": status.HTTP_404_NOT_FOUND,
            "validation_error": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "forbidden": status.HTTP_403_FORBIDDEN,
            "internal_error": status.HTTP_500_INTERNAL_SERVER_ERROR,
        }
        http_status = status_map.get(code, status.HTTP_400_BAD_REQUEST)
        raise HTTPException(status_code=http_status, detail={
            "ok": False,
            "action": res.action,
            "error": res.error or "Undo failed",
            "code": code,
        })
    return {"ok": True, "action": res.action, "result": res.result}
