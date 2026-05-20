from fastapi import APIRouter

from app.api.v1.endpoints import admin_users, auth, system

api_router = APIRouter()
api_router.include_router(admin_users.router)
api_router.include_router(auth.router)
api_router.include_router(system.router)
