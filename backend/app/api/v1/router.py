from fastapi import APIRouter

from app.api.v1.endpoints import admin_users, auth, partners, resumes, system, template_variables

api_router = APIRouter()
api_router.include_router(admin_users.router)
api_router.include_router(auth.router)
api_router.include_router(partners.router)
api_router.include_router(partners.admin_router)
api_router.include_router(resumes.router)
api_router.include_router(system.router)
api_router.include_router(template_variables.router)
