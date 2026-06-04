from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


def get_by_id(db: Session, customer_id: int) -> Customer | None:
    return db.get(Customer, customer_id)


def get_by_email(db: Session, email: str) -> Customer | None:
    statement = select(Customer).where(Customer.email == email)
    return db.execute(statement).scalar_one_or_none()


def get_all(db: Session) -> list[Customer]:
    statement = select(Customer).order_by(Customer.id)
    return list(db.execute(statement).scalars().all())


def create(db: Session, customer_in: CustomerCreate) -> Customer:
    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def delete(db: Session, customer: Customer) -> None:
    db.delete(customer)
    db.commit()
