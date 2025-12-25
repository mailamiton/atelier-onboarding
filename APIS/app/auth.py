from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, jwk
from .config import settings
import requests

security = HTTPBearer()


def get_cognito_public_keys():
    """Fetch Cognito public keys for JWT verification"""
    keys_url = f'https://cognito-idp.{settings.AWS_COGNITO_REGION}.amazonaws.com/{settings.AWS_COGNITO_USER_POOL_ID}/.well-known/jwks.json'
    response = requests.get(keys_url)
    return response.json()['keys']


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates Cognito JWT token and returns user information.
    
    Validation steps:
    1. Extract token from Authorization header
    2. Decode JWT header to get key ID (kid)
    3. Fetch Cognito public keys
    4. Find matching public key
    5. Verify JWT signature using public key
    6. Validate token claims (expiration, issuer)
    7. Extract and return user information
    """
    token = credentials.credentials
    
    # For development: Skip validation
    if settings.ENVIRONMENT == "development" and settings.DEBUG:
        try:
            # Just decode without verification for local testing
            payload = jwt.decode(token, options={"verify_signature": False})
            username = payload.get("cognito:username") or payload.get("sub") or "dev_user"
            return {"username": username, "user_id": payload.get("sub", "dev-123")}
        except:
            # Allow any token in dev mode
            return {"username": "dev_admin", "user_id": "dev-123"}
    
    # Production: Full signature verification
    try:
        # Step 1: Decode header without verification to get key ID
        headers = jwt.get_unverified_headers(token)
        kid = headers.get('kid')
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing key ID"
            )
        
        # Step 2: Get Cognito public keys
        public_keys = get_cognito_public_keys()
        
        # Step 3: Find the matching public key
        key = None
        for k in public_keys:
            if k['kid'] == kid:
                key = k
                break
        
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Public key not found"
            )
        
        # Step 4: Construct the public key for verification
        public_key = jwk.construct(key)
        
        # Step 5: Decode and verify the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            options={"verify_signature": True, "verify_exp": True}
        )
        
        # Step 6: Validate issuer
        expected_issuer = f'https://cognito-idp.{settings.AWS_COGNITO_REGION}.amazonaws.com/{settings.AWS_COGNITO_USER_POOL_ID}'
        if payload.get('iss') != expected_issuer:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer"
            )
        
        # Step 7: Validate token use
        if payload.get('token_use') not in ['access', 'id']:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token use"
            )
        
        # Step 8: Extract user information
        username = payload.get("cognito:username") or payload.get("username") or payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Extract user roles and permissions from JWT claims
        user_info = {
            "username": username,
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            # Cognito Groups (recommended for roles)
            "groups": payload.get("cognito:groups", []),
            # Custom attributes
            "role": payload.get("custom:role"),
            "department": payload.get("custom:department"),
            "permissions": payload.get("custom:permissions", "").split(",") if payload.get("custom:permissions") else []
        }
        
        return user_info
    
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )


def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency to require admin role.
    Checks if user is in 'Admins' group OR has 'admin' role.
    """
    # Check Cognito Groups (recommended approach)
    if "Admins" in current_user.get("groups", []):
        return current_user
    
    # Check custom role attribute (alternative approach)
    if current_user.get("role") == "admin":
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required"
    )


def require_role(required_role: str):
    """
    Dependency factory to require specific role.
    Usage: @router.get("/endpoint", dependencies=[Depends(require_role("manager"))])
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return current_user
    return role_checker


def require_group(required_group: str):
    """
    Dependency factory to require Cognito group membership.
    Usage: @router.get("/endpoint", dependencies=[Depends(require_group("Admins"))])
    """
    def group_checker(current_user: dict = Depends(get_current_user)):
        if required_group not in current_user.get("groups", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Group '{required_group}' membership required"
            )
        return current_user
    return group_checker


def require_permission(required_permission: str):
    """
    Dependency factory to check specific permission.
    Usage: @router.delete("/endpoint", dependencies=[Depends(require_permission("delete"))])
    """
    def permission_checker(current_user: dict = Depends(get_current_user)):
        user_permissions = current_user.get("permissions", [])
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{required_permission}' required"
            )
        return current_user
    return permission_checker


def require_department(required_department: str):
    """
    Dependency factory to require specific department.
    Usage: @router.get("/endpoint", dependencies=[Depends(require_department("Management"))])
    """
    def department_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("department") != required_department:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Department '{required_department}' access required"
            )
        return current_user
    return department_checker
