"""Seed database with initial dummy data"""
import random
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models import (
    AuditLog,
    Category,
    Customer,
    Notification,
    Order,
    OrderItem,
    Product,
    PurchaseOrder,
    PurchaseOrderItem,
    Return,
    Settings,
    StockTransfer,
    Supplier,
    User,
    Warehouse,
    WarehouseStock,
)
from app.models.purchase_order import PurchaseOrderStatus
from app.models.returns import ReturnStatus, ReturnType
from app.models.stock_transfer import TransferStatus
from app.models.user import UserRole


def hash_password(password: str) -> str:
    import hashlib

    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"pbkdf2_sha256$100000${salt.hex()}${digest.hex()}"


def seed_users(db: Session):
    """Seed dummy user credentials for all 8 roles"""
    roles_data = [
        ("Super Admin User", "super_admin@ims.com", UserRole.super_admin),
        ("Admin User", "admin@ims.com", UserRole.admin),
        ("Manager User", "manager@ims.com", UserRole.manager),
        ("Warehouse Manager User", "warehouse_manager@ims.com", UserRole.warehouse_manager),
        ("Sales Manager User", "sales_manager@ims.com", UserRole.sales_manager),
        ("Purchase Manager User", "purchase_manager@ims.com", UserRole.purchase_manager),
        ("Staff User", "staff@ims.com", UserRole.staff),
        ("Viewer User", "viewer@ims.com", UserRole.viewer),
    ]

    for full_name, email, role in roles_data:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            user = User(
                full_name=full_name,
                email=email,
                password_hash=hash_password("password123"),
                role=role,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
    db.commit()


def seed_categories(db: Session):
    """Seed categories"""
    categories = ["Accessories", "Cables", "Peripherals", "Furniture", "Storage"]
    for name in categories:
        existing = db.query(Category).filter(Category.name == name).first()
        if not existing:
            cat = Category(name=name, description=f"Catalog category for {name.lower()}")
            db.add(cat)
    db.commit()


def seed_products(db: Session):
    """Seed products and link to categories"""
    categories = db.query(Category).all()
    cat_map = {c.name: c.id for c in categories}

    products_data = [
        ("Wireless Mouse", "WM-001", Decimal("29.99"), 45, "Peripherals"),
        ("USB-C Cable", "UC-001", Decimal("12.99"), 120, "Cables"),
        ("Mechanical Keyboard", "MK-001", Decimal("89.99"), 23, "Peripherals"),
        ("4K Monitor", "MON-001", Decimal("299.99"), 8, "Peripherals"),
        ("Laptop Stand", "LS-001", Decimal("49.99"), 35, "Accessories"),
        ("Webcam 1080P", "WC-001", Decimal("59.99"), 15, "Peripherals"),
        ("Desk Lamp LED", "DL-001", Decimal("39.99"), 42, "Furniture"),
        ("USB Hub 7-Port", "UH-001", Decimal("34.99"), 5, "Accessories"),
        ("Ergonomic Chair Pad", "ECP-001", Decimal("24.99"), 67, "Furniture"),
        ("Wireless Headphones", "WH-001", Decimal("79.99"), 18, "Peripherals"),
        ("Phone Stand", "PS-001", Decimal("14.99"), 156, "Accessories"),
        ("HDMI Cable 2m", "HD-001", Decimal("8.99"), 200, "Cables"),
        ("Portable SSD 1TB", "SSD-001", Decimal("129.99"), 12, "Storage"),
        ("Desk Organizer", "DO-001", Decimal("19.99"), 89, "Furniture"),
        ("Cooling Pad", "CP-001", Decimal("44.99"), 3, "Accessories"),
    ]

    for name, sku, price, quantity, cat_name in products_data:
        existing = db.query(Product).filter(Product.sku == sku).first()
        if not existing:
            cat_id = cat_map.get(cat_name)
            product = Product(
                name=name,
                sku=sku,
                price=price,
                quantity=quantity,
                category_id=cat_id,
                barcode=f"123456789{random.randint(10, 99)}",
                qr_code=f"QR-{sku}",
                reorder_point=10,
            )
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

    for _ in range(15):
        customer = random.choice(customers)
        status = random.choice(statuses)
        order_products = random.sample(products, min(random.randint(1, 3), len(products)))

        order = Order(
            customer_id=customer.id,
            status=status,
            total_amount=Decimal("0"),
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)),
        )
        db.add(order)
        db.flush()

        total = Decimal("0")
        for product in order_products:
            qty = random.randint(1, min(5, max(1, product.quantity)))
            item_total = product.price * qty
            total += item_total

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
            )
            db.add(order_item)

        order.total_amount = total
        db.add(order)
    db.commit()


def seed_warehouses(db: Session):
    """Seed warehouses and stock distributions"""
    warehouses_data = [
        ("Chicago Main Hub", "CHI-01", "100 Logistics Blvd, Chicago IL", 50000),
        ("Austin Transit Depot", "AUS-02", "54 Interstate Hwy, Austin TX", 25000),
        ("Boston Port Warehouse", "BOS-03", "8 Waterfront Way, Boston MA", 35000),
    ]

    for name, code, location, cap in warehouses_data:
        existing = db.query(Warehouse).filter(Warehouse.code == code).first()
        if not existing:
            w = Warehouse(
                name=name,
                code=code,
                location=location,
                capacity_sqft=cap,
                current_utilization_pct=15.5,
            )
            db.add(w)
    db.commit()


def seed_suppliers(db: Session):
    """Seed suppliers"""
    suppliers_data = [
        ("Global Tech Parts", "John Carter", "orders@globaltech.com", "+1-800-555-2244", 4.8, 98.2, 4500.0),
        ("Logistics Solutions Inc", "Sarah Jenkins", "sales@logistics-sol.com", "+1-800-555-8899", 4.2, 91.5, 0.0),
        ("Elite Office Supplies", "David Kim", "support@elitesupplies.com", "+1-800-555-1122", 4.5, 96.0, 1250.0),
    ]

    for name, c_name, email, phone, rating, performance, outstanding in suppliers_data:
        existing = db.query(Supplier).filter(Supplier.name == name).first()
        if not existing:
            sup = Supplier(
                name=name,
                contact_name=c_name,
                email=email,
                phone=phone,
                rating=rating,
                delivery_performance=performance,
                outstanding_payments=outstanding,
            )
            db.add(sup)
    db.commit()


def seed_warehouse_stocks(db: Session):
    """Distribute items in warehouse stocks"""
    warehouses = db.query(Warehouse).all()
    products = db.query(Product).all()

    if not warehouses or not products:
        return

    for product in products:
        # put in 1 to 2 random warehouses
        assigned = random.sample(warehouses, random.randint(1, 2))
        for w in assigned:
            existing = (
                db.query(WarehouseStock)
                .filter(WarehouseStock.warehouse_id == w.id, WarehouseStock.product_id == product.id)
                .first()
            )
            if not existing:
                stock = WarehouseStock(
                    warehouse_id=w.id,
                    product_id=product.id,
                    quantity=random.randint(10, 50),
                    batch_number=f"LOT-{random.randint(1000, 9999)}",
                    serial_number=f"SN-{product.sku}-{random.randint(100, 999)}",
                    expiry_date=datetime.now(timezone.utc) + timedelta(days=random.randint(180, 720)),
                    location_code=f"AISLE-{random.randint(1, 10)}-SHELF-{random.choice(['A', 'B', 'C'])}",
                )
                db.add(stock)
    db.commit()


def seed_purchase_orders(db: Session):
    """Seed purchase orders"""
    suppliers = db.query(Supplier).all()
    products = db.query(Product).all()

    if not suppliers or not products:
        return

    for i in range(5):
        supplier = random.choice(suppliers)
        po = PurchaseOrder(
            supplier_id=supplier.id,
            status=random.choice([PurchaseOrderStatus.requested, PurchaseOrderStatus.approved, PurchaseOrderStatus.received]),
            total_amount=Decimal("0.00"),
        )
        db.add(po)
        db.flush()

        # pick 1-2 items
        total = Decimal("0.00")
        items = random.sample(products, 2)
        for prod in items:
            qty = random.randint(10, 30)
            cost = prod.price * Decimal("0.7")  # cost is 70% of price
            po_item = PurchaseOrderItem(
                purchase_order_id=po.id,
                product_id=prod.id,
                quantity=qty,
                unit_price=cost,
            )
            db.add(po_item)
            total += Decimal(qty) * cost

        po.total_amount = total
    db.commit()


def seed_stock_transfers(db: Session):
    """Seed stock transfers"""
    warehouses = db.query(Warehouse).all()
    products = db.query(Product).all()

    if len(warehouses) < 2 or not products:
        return

    for i in range(4):
        src, dest = random.sample(warehouses, 2)
        prod = random.choice(products)
        transfer = StockTransfer(
            source_warehouse_id=src.id,
            destination_warehouse_id=dest.id,
            product_id=prod.id,
            quantity=random.randint(5, 15),
            status=random.choice([TransferStatus.pending, TransferStatus.approved, TransferStatus.completed]),
        )
        db.add(transfer)
    db.commit()


def seed_returns(db: Session):
    """Seed returns"""
    products = db.query(Product).all()
    if not products:
        return

    for i in range(3):
        prod = random.choice(products)
        ret = Return(
            type=random.choice([ReturnType.customer, ReturnType.supplier]),
            status=random.choice([ReturnStatus.pending, ReturnStatus.completed]),
            product_id=prod.id,
            quantity=random.randint(1, 5),
            reason=random.choice(["Defective item", "Ordered wrong SKU", "Damaged in transit", "Incompatible fit"]),
        )
        db.add(ret)
    db.commit()


def seed_audit_logs(db: Session):
    """Seed audit logs"""
    logs_data = [
        ("super_admin@ims.com", "LOGIN_SUCCESS", "user", None, "Super admin logged in successfully"),
        ("admin@ims.com", "CREATE_PRODUCT", "product", 1, "Created product Wireless Mouse"),
        ("warehouse_manager@ims.com", "APPROVE_TRANSFER", "stock_transfer", 1, "Approved stock transfer from CHI-01 to AUS-02"),
        ("sales_manager@ims.com", "CREATE_ORDER", "order", 3, "Created order #3 for Bob Smith"),
        ("purchase_manager@ims.com", "RECEIVE_PURCHASE_ORDER", "purchase_order", 2, "Received purchase order #2 from Global Tech Parts"),
    ]

    for email, action, entity, e_id, details in logs_data:
        log = AuditLog(
            user_email=email,
            action=action,
            entity_type=entity,
            entity_id=e_id,
            details=details,
        )
        db.add(log)
    db.commit()


def seed_notifications(db: Session):
    """Seed notifications"""
    notis = [
        ("Low Stock Warning", "Product 'Wireless Hub 7-Port' is below the reorder point (5 remaining).", "low_stock"),
        ("Out of Stock Alert", "Product 'Cooling Pad' is completely out of stock.", "low_stock"),
        ("New Purchase Order", "Purchase order #12 is pending manager approval.", "system"),
        ("Stock Transfer Completed", "Transfer of 15x 'HDMI Cable 2m' from CHI-01 to BOS-03 completed.", "transfer"),
    ]

    for title, message, t in notis:
        noti = Notification(
            title=title,
            message=message,
            type=t,
            is_read=False,
        )
        db.add(noti)
    db.commit()


def seed_settings(db: Session):
    """Seed system settings"""
    settings_data = [
        ("low_stock_threshold", "10"),
        ("auto_approve_transfers", "false"),
        ("currency", "USD"),
        ("company_name", "Atlas Logistics Corp"),
    ]

    for key, value in settings_data:
        existing = db.query(Settings).filter(Settings.key == key).first()
        if not existing:
            s = Settings(key=key, value=value)
            db.add(s)
    db.commit()


def seed_database(db: Session):
    """Seed all data"""
    seed_users(db)
    seed_categories(db)
    seed_products(db)
    seed_customers(db)
    seed_orders(db)
    seed_warehouses(db)
    seed_suppliers(db)
    seed_warehouse_stocks(db)
    seed_purchase_orders(db)
    seed_stock_transfers(db)
    seed_returns(db)
    seed_audit_logs(db)
    seed_notifications(db)
    seed_settings(db)
