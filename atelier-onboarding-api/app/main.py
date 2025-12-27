from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from .config import settings
from .database import Base, engine
from .routers import registrations, teachers, admin

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Atelier Registration API",
    description="API for managing student registrations and demo class bookings",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(registrations.router, prefix="/api/registrations", tags=["Registrations"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {
        "message": "Ashish Patel Atelier - Registration API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# AWS Lambda handler
handler = Mangum(app, lifespan="off")
