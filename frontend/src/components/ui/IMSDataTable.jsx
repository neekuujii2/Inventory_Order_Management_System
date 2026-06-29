import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Eye, EyeOff, Search } from 'lucide-react';
import Button from './Button';
import './IMSDataTable.css';

export default function IMSDataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "No records found.",
  bulkActions = [],
  onRowClick,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState(() => 
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 1. Filtering
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return data;

    return data.filter((row) => 
      columns.some((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Parse numbers if applicable
      if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Reset pagination if search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = new Set(paginatedData.map(row => row.id));
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportCSV = () => {
    const activeCols = columns.filter(col => visibleColumns[col.key]);
    const headers = activeCols.map(col => `"${col.label}"`).join(',');
    const rows = sortedData.map(row => 
      activeCols.map(col => {
        const val = row[col.key];
        return `"${val !== null && val !== undefined ? String(val).replace(/"/g, '""') : ''}"`;
      }).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ims_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedRowsList = useMemo(() => {
    return data.filter(row => selectedIds.has(row.id));
  }, [data, selectedIds]);

  return (
    <div className="datatable-card">
      <div className="datatable-toolbar">
        {/* Search */}
        <div className="datatable-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Global quick search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="datatable-actions-group">
          {selectedIds.size > 0 && bulkActions.length > 0 && (
            <div className="bulk-toolbar animate-fade-in">
              <span className="glass-pill">{selectedIds.size} selected</span>
              {bulkActions.map((act) => (
                <Button 
                  key={act.label} 
                  variant={act.variant || 'ghost'} 
                  size="small"
                  onClick={() => {
                    act.onClick(selectedRowsList);
                    setSelectedIds(new Set());
                  }}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          )}

          {/* Visibility menu toggle */}
          <div className="columns-visibility-wrapper">
            <button 
              type="button" 
              className="filter-chip"
              onClick={() => setShowColMenu(!showColMenu)}
            >
              <Eye size={16} /> Columns
            </button>
            {showColMenu && (
              <div className="columns-visibility-menu surface-card">
                <h4>Toggle Visibility</h4>
                {columns.map((col) => (
                  <label key={col.key} className="checkbox-row">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns[col.key]} 
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export to CSV */}
          <button type="button" className="filter-chip" onClick={handleExportCSV}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="table-wrapper">
        <table className="ims-table sticky-table">
          <thead>
            <tr>
              <th className="select-cell-header" style={{ width: '50px' }}>
                <input 
                  type="checkbox" 
                  checked={paginatedData.length > 0 && paginatedData.every(row => selectedIds.has(row.id))}
                  onChange={handleSelectAll}
                />
              </th>
              {columns.map((col) => {
                if (!visibleColumns[col.key]) return null;
                const isSort = col.sortable !== false;
                const isPinned = col.isPinned;
                const pinClass = isPinned ? `pinned-${isPinned}` : '';

                return (
                  <th 
                    key={col.key} 
                    className={`${pinClass} ${isSort ? 'sort-header' : ''}`}
                    onClick={() => isSort && handleSort(col.key)}
                  >
                    <div className="header-cell-content">
                      {col.label}
                      {isSort && (
                        sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronsUpDown size={14} className="opacity-40" />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td className="select-cell-header"><div className="skeleton-line" style={{ width: '16px' }} /></td>
                  {columns.map((col) => {
                    if (!visibleColumns[col.key]) return null;
                    return (
                      <td key={col.key}>
                        <div className="skeleton-line" style={{ width: `${Math.random() * 40 + 50}%` }} />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="empty-state">
                    <h3>{emptyMessage}</h3>
                    <p className="text-secondary">Try searching different fields or adjust your active page constraints.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr 
                  key={row.id} 
                  className={onRowClick ? 'clickable-row' : ''} 
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  <td className="select-cell-header" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e)}
                    />
                  </td>
                  {columns.map((col) => {
                    if (!visibleColumns[col.key]) return null;
                    const value = row[col.key];
                    const isPinned = col.isPinned;
                    const pinClass = isPinned ? `pinned-${isPinned}` : '';

                    return (
                      <td key={col.key} className={pinClass}>
                        {col.render ? col.render(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="datatable-footer">
        <div className="page-size-selector">
          <span>Rows per page:</span>
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <span className="page-range-display text-secondary">
          Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
        </span>

        <div className="datatable-pagination-btns">
          <Button 
            variant="ghost" 
            size="small" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <span className="current-page-label">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="ghost" 
            size="small" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
