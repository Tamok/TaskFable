// frontend/src/components/SortFilterBar.js
import React, { useState } from "react";

function SortFilterBar({ sortField, setSortField, sortOrder, setSortOrder, filterText, setFilterText }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="sort-filter-bar">
      <div
        className="sfb-header"
        onClick={() => setCollapsed(!collapsed)}
        title="Click to collapse or expand filter and sort options"
      >
        <span>Filter &amp; Sort</span>
        <span>{collapsed ? "▼" : "▲"}</span>
      </div>
      {!collapsed && (
        <div className="sfb-controls">
          <div className="sfb-control">
            <label title="Type here to filter tasks by any content (title, owner, description, or comments)">
              Filter:
              <input 
                type="text" 
                value={filterText} 
                onChange={(e) => setFilterText(e.target.value)} 
                placeholder="search by content"
                title="Filter tasks by content"
              />
            </label>
          </div>
          <div className="sfb-control">
            <label title="Select a field to sort tasks">
              Sort by:
              <select 
                value={sortField} 
                onChange={(e) => setSortField(e.target.value)}
                title="Sort tasks by selected field"
              >
                <option value="">Manual Order</option>
                <option value="title">Title</option>
                <option value="owner">Owner</option>
                <option value="created_at">Date Created</option>
                <option value="last_modified">Last Modified</option>
              </select>
            </label>
          </div>
          <div className="sfb-control">
            <label title="Select ascending or descending order">
              Order:
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                title="Choose sort order"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default SortFilterBar;
