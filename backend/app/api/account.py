from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth import AuthContext, get_current_user
from app.config import settings
from app.services.supabase import get_admin_client

router = APIRouter(prefix="/api/account", tags=["account"])

# Gotrue has no "deactivated" flag — a long ban is the standard way to lock
# an account out (blocks sign-in and token refresh) without deleting it.
DEACTIVATE_BAN_DURATION = "87600h"  # 10 years


def _admin_client():
    if not settings.supabase_service_role_key:
        raise HTTPException(status_code=500, detail="Service role key not configured")
    return get_admin_client()


@router.post("/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_account(auth: AuthContext = Depends(get_current_user)):
    client = _admin_client()
    client.auth.admin.update_user_by_id(
        auth.user_id, {"ban_duration": DEACTIVATE_BAN_DURATION}
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(auth: AuthContext = Depends(get_current_user)):
    client = _admin_client()
    client.auth.admin.delete_user(auth.user_id)
