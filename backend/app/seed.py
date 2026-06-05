"""Seed database with initial dummy data"""
from sqlalchemy.orm import Session
from app.models import Product, Customer, Order, OrderItem
from decimal import Decimal
import random
from datetime import datetime, timedelta


def seed_products(db: Session):
    """Seed dummy products"""
    products_data = [
        ("Wireless Mouse", "WM-001", Decimal("29.99"), 45),
        ("USB-C Cable", "UC-001", Decimal("12.99"), 120),
        ("Mechanical Keyboard", "MK-001", Decimal("89.99"), 23),
        ("4K Monitor", "MON-001", Decimal("299.99"), 8),
        ("Laptop Stand", "LS-001", Decimal("49.99"), 35),
        ("Webcam 1080P", "WC-001", Decimal("59.99"), 15),
        ("Desk Lamp LED", "DL-001", Decimal("39.99"), 42),
        ("USB Hub 7-Port", "UH-001", Decimal("34.99"), 5),
        ("Ergonomic Chair Pad", "ECP-001", Decimal("24.99"), 67),
        ("Wireless Headphones", "WH-001", Decimal("79.99"), 18),
        ("Phone Stand", "PS-001", Decimal("14.99"), 156),
        ("HDMI Cable 2m", "HD-001", Decimal("8.99"), 200),
        ("Portable SSD 1TB", "SSD-001", Decimal("129.99"), 12),
        ("Desk Organizer", "DO-001", Decimal("19.99"), 89),
        ("Cooling Pad", "CP-001", Decimal("44.99"), 3),
    ]
    
    for name, sku, price, quantity in products_data:
        existing = db.query(Product).filter(Product.sku == sku).first()
        if not existing:
            product = Product(name=name, sku=sku, price=price, quantity=quantity)
            db.add(product)
    db.commit()


def seed_customers(db: Session):
    """Seed dummy customers"""
    customers_data = [
        ("Alice Johnson", "alice.johnson@email.com", "+1-555-0101"),
        ("Bob Smith", "bob.smith@email.com", "+1-555-0102"),
        ("Carol White", "carol.white@email.com", "+1-555-0103"),
        ("David Brown", "david.brown@email.com", "+1-555-0104"),
        ("Emma Davis", "emma.davis@email.com", "+1-555-0105"),
        ("Frank Miller", "frank.miller@email.com", "+1-555-0106"),
        ("Grace Lee", "grace.lee@email.com", "+1-555-0107"),
        ("Henry Wilson", "henry.wilson@email.com", "+1-555-0108"),
        ("Iris Taylor", "iris.taylor@email.com", "+1-555-0109"),
        ("Jack Anderson", "jack.anderson@email.com", "+1-555-0110"),
        ("Karen Thomas", "karen.thomas@email.com", "+1-555-0111"),
        ("Leo Martinez", "leo.martinez@email.com", "+1-555-0112"),
        ("Maria Garcia", "maria.garcia@email.com", "+1-555-0113"),
        ("Nathan Rodriguez", "nathan.rodriguez@email.com", "+1-555-0114"),
        ("Olivia Martinez", "olivia.martinez@email.com", "+1-555-0115"),
    ]
    
    for name, email, phone in customers_data:
        existing = db.query(Customer).filter(Customer.email == email).first()
        if not existing:
            customer = Customer(full_name=name, email=email, phone=phone)
            db.add(customer)
    db.commit()


def seed_orders(db: Session):
    """Seed dummy orders"""
    customers = db.query(Customer).all()
    products = db.query(Product).all()
    
    if not customers or not products:
        return
    
    statuses = ["pending", "fulfilled", "cancelled"]
    
    for i in range(12):
        customer = random.choice(customers)
        status = random.choice(statuses)
        
        # Select 1-3 random products
        order_products = random.sample(products, min(random.randint(1, 3), len(products)))
        
        # Create order
        order = Order(
            customer_id=customer.id,
            status=status,
            total_amount=Decimal("0"),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        db.add(order)
        db.flush()
        
        total = Decimal("0")
        for product in order_products:
            qty = random.randint(1, min(5, product.quantity))
            item_total = product.price * qty
            total += item_total
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.price
            )
            db.add(order_item)
        
        order.total_amount = total
        db.add(order)
    
    db.commit()


def seed_database(db: Session):
    """Seed all data"""
    seed_products(db)
    seed_customers(db)
    seed_orders(db)
