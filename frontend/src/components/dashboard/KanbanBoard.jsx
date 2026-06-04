import React from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import './KanbanBoard.css';

function KanbanCard({ order }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${order.id}`,
    data: { order },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const handleCardClick = (e) => {
    // If we're dragging, don't navigate
    if (transform && (Math.abs(transform.x) > 2 || Math.abs(transform.y) > 2)) {
      return;
    }
    navigate(`/orders/${order.id}`);
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="kanban-card"
      onClick={handleCardClick}
    >
      <div className="kanban-card-header">
        <span className="kanban-card-id">#{order.id}</span>
        <span className="kanban-card-date">{formattedDate}</span>
      </div>
      <div className="kanban-card-customer">{order.customer_name}</div>
      <div className="kanban-card-footer">
        <span className="kanban-card-items">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
        <span className="kanban-card-total">
          ${parseFloat(order.total_amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({ id, title, count, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'column-active' : ''}`}
      style={{
        borderColor: isOver ? 'var(--accent)' : 'var(--border)',
        boxShadow: isOver ? 'var(--shadow-glow)' : 'none',
      }}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span className={`kanban-column-indicator ${id}`}></span>
          <span>{title}</span>
        </div>
        <span className="kanban-column-count">{count}</span>
      </div>
      <div className="kanban-cards-container">{children}</div>
    </div>
  );
}

export default function KanbanBoard({ orders = [], onStatusChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // Get order info from active draggable
    const activeIdStr = active.id.replace('card-', '');
    const orderId = parseInt(activeIdStr, 10);
    const newStatus = over.id; // 'pending', 'fulfilled', or 'cancelled'
    
    const order = orders.find((o) => o.id === orderId);
    
    if (order && order.status !== newStatus) {
      onStatusChange(orderId, newStatus);
    }
  };

  const columns = [
    { id: 'pending', title: 'Pending' },
    { id: 'fulfilled', title: 'Fulfilled' },
    { id: 'cancelled', title: 'Cancelled' },
  ];

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              count={colOrders.length}
            >
              {colOrders.map((order) => (
                <KanbanCard key={order.id} order={order} />
              ))}
            </KanbanColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
