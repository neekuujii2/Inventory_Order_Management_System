"""Seed data router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed import seed_database

router = APIRouter()


@router.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    """Seed database with dummy data (development only)"""
    try:
        seed_database(db)
        return {
            "status": "success",
            "message": "Database seeded with dummy data",
            "details": {
                "products": 15,
                "customers": 15,
                "orders": 12
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
