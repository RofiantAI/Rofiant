import logging

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()

# Newer Supabase projects sign JWTs with an asymmetric key (ES256) and
# publish the public half here; older projects still use a shared HS256
# secret with no JWKS entry. Try JWKS first, fall back to the shared secret.
_jwks_client = PyJWKClient(
    f"{settings.supabase_url}/auth/v1/.well-known/jwks.json", cache_keys=True
)


class AuthContext(BaseModel):
    user_id: str
    email: str | None
    access_token: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AuthContext:
    """Verify the Supabase JWT and derive the authenticated user.

    Never trust a user_id sent by the client — it always comes from the
    verified token's `sub` claim.
    """
    return verify_jwt(credentials.credentials)


def verify_jwt(token: str) -> AuthContext:
    """Shared by the bearer-header path above and WebSocket routes, which
    can't set an Authorization header on the handshake and so pass the JWT
    as a query param instead."""
    try:
        try:
            signing_key = _jwks_client.get_signing_key_from_jwt(token).key
            payload = jwt.decode(
                token, signing_key, algorithms=["ES256", "RS256"], audience="authenticated"
            )
        except jwt.PyJWKClientError:
            # No matching JWKS entry — legacy project, shared HS256 secret.
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
    except jwt.PyJWTError as exc:
        logger.warning("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    return AuthContext(user_id=user_id, email=payload.get("email"), access_token=token)
