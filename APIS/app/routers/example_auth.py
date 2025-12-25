"""
Example endpoints demonstrating role-based access control with Cognito JWT claims.
This file shows various ways to protect endpoints based on user attributes from JWT.
"""
from fastapi import APIRouter, Depends
from app.auth import (
    get_current_user,
    require_admin,
    require_role,
    require_group,
    require_permission,
    require_department
)

router = APIRouter(prefix="/api/examples", tags=["Auth Examples"])


# Example 1: Get current user info (any authenticated user)
@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's profile from JWT claims.
    Any authenticated user can access this.
    """
    return {
        "user_id": current_user.get("user_id"),
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "role": current_user.get("role"),
        "department": current_user.get("department"),
        "groups": current_user.get("groups"),
        "permissions": current_user.get("permissions")
    }


# Example 2: Admin-only endpoint
@router.get("/admin-dashboard")
async def admin_dashboard(current_user: dict = Depends(require_admin)):
    """
    Only users in 'Admins' group or with 'admin' role can access.
    Returns 403 Forbidden for non-admins.
    """
    return {
        "message": f"Welcome Admin {current_user['username']}!",
        "admin_data": "Sensitive admin information here"
    }


# Example 3: Specific role required
@router.get("/manager-reports")
async def manager_reports(current_user: dict = Depends(require_role("manager"))):
    """
    Only users with role='manager' can access.
    """
    return {
        "message": f"Manager reports for {current_user['username']}",
        "reports": ["Report 1", "Report 2"]
    }


# Example 4: Specific Cognito group required
@router.get("/teachers-only")
async def teachers_area(current_user: dict = Depends(require_group("Teachers"))):
    """
    Only users in the 'Teachers' Cognito group can access.
    """
    return {
        "message": f"Welcome Teacher {current_user['name']}!",
        "classes": ["Art 101", "Drawing 201"]
    }


# Example 5: Specific permission required
@router.delete("/delete-resource/{resource_id}")
async def delete_resource(
    resource_id: str,
    current_user: dict = Depends(require_permission("delete"))
):
    """
    Only users with 'delete' permission can access.
    Permissions can be comma-separated in JWT: "read,write,delete"
    """
    return {
        "message": f"Resource {resource_id} deleted by {current_user['username']}",
        "permissions": current_user.get("permissions")
    }


# Example 6: Department-specific endpoint
@router.get("/department-files")
async def department_files(current_user: dict = Depends(require_department("Management"))):
    """
    Only users from 'Management' department can access.
    """
    return {
        "message": f"Files for {current_user['department']} department",
        "files": ["budget.pdf", "report.xlsx"]
    }


# Example 7: Multiple checks (manual)
@router.post("/critical-action")
async def critical_action(current_user: dict = Depends(get_current_user)):
    """
    Custom validation: Must be admin AND have delete permission.
    """
    # Check if admin
    is_admin = "Admins" in current_user.get("groups", []) or current_user.get("role") == "admin"
    
    # Check if has delete permission
    has_delete = "delete" in current_user.get("permissions", [])
    
    if not (is_admin and has_delete):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail="Requires admin role AND delete permission"
        )
    
    return {
        "message": "Critical action executed",
        "executed_by": current_user['username']
    }


# Example 8: Read user attributes in logic
@router.get("/personalized-content")
async def personalized_content(current_user: dict = Depends(get_current_user)):
    """
    Different content based on user's role and department.
    """
    role = current_user.get("role")
    department = current_user.get("department")
    groups = current_user.get("groups", [])
    
    content = {
        "welcome_message": f"Hello {current_user.get('name', 'User')}!",
        "role_specific_content": None,
        "department_resources": None
    }
    
    # Customize based on role
    if "Admins" in groups:
        content["role_specific_content"] = "Admin panel access"
    elif role == "teacher":
        content["role_specific_content"] = "Teaching materials and student list"
    elif role == "student":
        content["role_specific_content"] = "Your classes and assignments"
    
    # Customize based on department
    if department == "Management":
        content["department_resources"] = ["Strategic plans", "Budget reports"]
    elif department == "Teaching":
        content["department_resources"] = ["Curriculum", "Teaching guides"]
    
    return content


# Example 9: Optional authentication
@router.get("/public-with-bonus")
async def public_with_bonus(current_user: dict = Depends(get_current_user) if False else None):
    """
    Public endpoint, but authenticated users get bonus content.
    Note: This is a simplified example. For real optional auth, use a different pattern.
    """
    if current_user:
        return {
            "public_content": "Available to everyone",
            "bonus_content": f"Extra content for {current_user['username']}"
        }
    else:
        return {"public_content": "Available to everyone"}
