
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  CheckCircle,
  Circle,
  Phone,
  Mail,
  Calendar,
  User,
  Tag,
  Clipboard,
  Sparkles,
} from "lucide-react";

const STATUS_LABELS = {
  new: "New",
  "in-progress": "In Progress",
  handled: "Handled",
};

const STATUS_STYLES = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
  handled: "bg-green-100 text-green-800 border-green-200",
};

const CATEGORY_LABELS = {
  wedding: "Wedding",
  tour: "Tour",
  event: "Event",
  vendor: "Vendor",
  other: "Other",
};

const deriveCategory = (message) => {
  const lowerMessage = (message || "").toLowerCase();
  if (lowerMessage.includes("wedding") || lowerMessage.includes("bride")) return "wedding";
  if (lowerMessage.includes("tour") || lowerMessage.includes("visit")) return "tour";
  if (lowerMessage.includes("event") || lowerMessage.includes("party") || lowerMessage.includes("dinner")) {
    return "event";
  }
  if (lowerMessage.includes("vendor") || lowerMessage.includes("catering") || lowerMessage.includes("staffing")) {
    return "vendor";
  }
  return "other";
};

const normalizeStatus = (value) => {
  const lower = (value || "").toString().trim().toLowerCase();
  if (!lower) return "new";
  if (lower.includes("handled") || lower.includes("complete") || lower.includes("closed")) return "handled";
  if (lower.includes("progress") || lower.includes("working") || lower.includes("pending")) return "in-progress";
  return "new";
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "\n" && !inQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    if (char === "\r") {
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
};

const HEADER_ALIASES = {
  id: ["id", "message id", "entry id"],
  name: ["name", "client", "full name", "client name"],
  firstName: ["first name", "firstname"],
  lastName: ["last name", "lastname"],
  email: ["email", "email address"],
  phone: ["phone", "phone number", "mobile"],
  message: ["message", "inquiry", "details", "client message", "notes", "summary"],
  dateTime: ["date", "date/time", "timestamp", "created", "submitted", "time"],
  status: ["status", "state"],
  category: ["category", "type", "inquiry type"],
  source: ["source", "channel", "lead source"],
  assignedTo: ["assigned", "owner", "handled by"],
  internalNotes: ["internal notes", "staff notes", "team notes", "admin notes"],
};

const matchHeaderKey = (header) => {
  const normalized = (header || "").toString().trim().toLowerCase();
  const entries = Object.entries(HEADER_ALIASES);
  for (const [key, aliases] of entries) {
    if (aliases.some((alias) => normalized === alias)) {
      return key;
    }
  }
  return null;
};

const mapSheetRows = (rows) => {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  const headerKeys = headers.map((header) => matchHeaderKey(header));
  const items = rows.slice(1).map((row, idx) => {
    const raw = {};
    headers.forEach((header, colIdx) => {
      raw[header] = row[colIdx] || "";
    });

    const getValue = (key) => {
      const columnIndex = headerKeys.findIndex((headerKey) => headerKey === key);
      if (columnIndex >= 0) {
        return row[columnIndex] || "";
      }
      return "";
    };

    const firstName = getValue("firstName");
    const lastName = getValue("lastName");
    const name = getValue("name") || [firstName, lastName].filter(Boolean).join(" ");
    const message = getValue("message");
    const statusValue = getValue("status");
    const categoryValue = getValue("category");

    return {
      id: getValue("id") || `${idx + 1}`,
      name,
      email: getValue("email"),
      phone: getValue("phone"),
      message,
      dateTime: getValue("dateTime"),
      status: normalizeStatus(statusValue),
      statusLabel: statusValue || STATUS_LABELS[normalizeStatus(statusValue)],
      category: categoryValue ? categoryValue.toString().toLowerCase() : deriveCategory(message),
      source: getValue("source"),
      assignedTo: getValue("assignedTo"),
      notes: getValue("internalNotes") || "",
      raw,
    };
  });

  return items.filter((item) => item.message || item.name || item.email || item.phone);
};

const normalizeApiMessages = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.messages || payload?.entries || payload?.data || [];
  return items.map((item, idx) => ({
    id: item.id ?? idx + 1,
    name: item.name || "",
    email: item.email || "",
    phone: item.phone || "",
    message: item.message || item.inquiry || "",
    dateTime: item.dateTime || item.date || "",
    status: normalizeStatus(item.status),
    statusLabel: item.status || STATUS_LABELS[normalizeStatus(item.status)],
    category: (item.category || deriveCategory(item.message || "")).toString().toLowerCase(),
    source: item.source || "",
    assignedTo: item.assignedTo || "",
    notes: item.notes || "",
    raw: item,
  }));
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-white border-b border-stone-200">
        <div className="absolute inset-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#f3eadc] blur-3xl opacity-80"></div>
          <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full bg-[#f7f1e6] blur-3xl opacity-90"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-8 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-500">
            <Sparkles className="w-4 h-4 text-[#886c44]" />
            North Star House
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#886c44]" style={{ fontFamily: "Cardo, serif" }}>
                Client Message Tracker
              </h1>
              <p className="text-sm text-stone-600 mt-2 max-w-xl">
                Track inquiries, follow-up notes, and team assignments in one North Star-inspired workspace.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchMessages}
                className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-700 hover:bg-stone-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowNewForm((prev) => !prev)}
                disabled={!supportsWrite}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  supportsWrite
                    ? "bg-[#886c44] text-white hover:bg-[#755c38]"
                    : "bg-stone-200 text-stone-500 cursor-not-allowed"
                }`}
              >
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>
          </div>
          {!supportsWrite && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Editing is disabled until a CLIENT_MESSAGES_API_URL is set. Currently reading from the spreadsheet.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => handleStatFilter("total")}
            className="bg-white p-4 rounded-lg border border-stone-200 text-left hover:border-[#886c44] transition-colors"
          >
            <div className="text-2xl font-semibold text-stone-800">{stats.total}</div>
            <div className="text-xs text-stone-600 mt-1">Total Messages</div>
          </button>
          <button
            onClick={() => handleStatFilter("new")}
            className="bg-white p-4 rounded-lg border border-stone-200 text-left hover:border-[#886c44] transition-colors"
          >
            <div className="text-2xl font-semibold text-amber-600">{stats.new}</div>
            <div className="text-xs text-stone-600 mt-1">New</div>
          </button>
          <button
            onClick={() => handleStatFilter("inProgress")}
            className="bg-white p-4 rounded-lg border border-stone-200 text-left hover:border-[#886c44] transition-colors"
          >
            <div className="text-2xl font-semibold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-stone-600 mt-1">In Progress</div>
          </button>
          <button
            onClick={() => handleStatFilter("handled")}
            className="bg-white p-4 rounded-lg border border-stone-200 text-left hover:border-[#886c44] transition-colors"
          >
            <div className="text-2xl font-semibold text-green-600">{stats.handled}</div>
            <div className="text-xs text-stone-600 mt-1">Handled</div>
          </button>
          <button
            onClick={() => handleStatFilter("wedding")}
            className="bg-white p-4 rounded-lg border border-stone-200 text-left hover:border-[#886c44] transition-colors"
          >
            <div className="text-2xl font-semibold text-[#886c44]">{stats.wedding}</div>
            <div className="text-xs text-stone-600 mt-1">Wedding Leads</div>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-stone-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by client, message, phone, email, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-2 rounded-lg border ${
                    viewMode === "cards"
                      ? "bg-[#886c44] text-white border-[#886c44]"
                      : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg border ${
                    viewMode === "table"
                      ? "bg-[#886c44] text-white border-[#886c44]"
                      : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-stone-200">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="handled">Handled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                >
                  <option value="all">All Categories</option>
                  <option value="wedding">Wedding</option>
                  <option value="tour">Tour</option>
                  <option value="event">Event</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                >
                  <option value="all">All Sources</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {showNewForm && (
            <div className="mt-6 pt-6 border-t border-stone-200 grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Client name"
                  value={newEntry.name}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEntry.email}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Phone"
                  value={newEntry.phone}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                />
                <input
                  type="datetime-local"
                  value={newEntry.dateTime}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, dateTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                >
                  <option value="wedding">Wedding</option>
                  <option value="tour">Tour</option>
                  <option value="event">Event</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Source"
                  value={newEntry.source}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                />
                <input
                  type="text"
                  placeholder="Assigned to"
                  value={newEntry.assignedTo}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
                />
              </div>
              <textarea
                rows={4}
                placeholder="Message details"
                value={newEntry.message}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
              />
              <textarea
                rows={2}
                placeholder="Internal notes"
                value={newEntry.notes}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44]"
              />
              <div className="flex justify-end">
                <button
                  onClick={createMessage}
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-[#886c44] text-white rounded-lg hover:bg-[#755c38] disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {creating ? "Adding..." : "Add Message"}
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-stone-600">Loading client messages...</div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border transition-colors cursor-pointer ${
                  msg.status === "handled"
                    ? "bg-green-50 border-green-200 hover:border-green-300"
                    : "bg-white border-stone-200 hover:border-[#886c44]"
                }`}
                onClick={() => setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      {msg.status === "handled" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      ) : (
                        <Circle className="w-5 h-5 text-amber-600 mt-1" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-stone-800">
                            {msg.name || "Unnamed Lead"}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded border ${STATUS_STYLES[msg.status]}`}>
                            {STATUS_LABELS[msg.status] || "New"}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded bg-stone-100 text-stone-700">
                            {CATEGORY_LABELS[msg.category] || msg.category || "Other"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-2">
                          {msg.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {msg.email}
                            </span>
                          )}
                          {msg.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {msg.phone}
                            </span>
                          )}
                          {msg.dateTime && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(msg.dateTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {supportsWrite && msg.status !== "handled" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markHandled(msg);
                          }}
                          className="text-xs px-3 py-1 rounded-full bg-[#886c44] text-white hover:bg-[#755c38]"
                        >
                          Mark handled
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-base leading-relaxed text-stone-700 line-clamp-3">
                    {msg.message || "No message content available."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone-500">
                    {msg.source && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {msg.source}
                      </span>
                    )}
                    {msg.assignedTo && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {msg.assignedTo}
                      </span>
                    )}
                    {msg.notes && (
                      <span className="flex items-center gap-1">
                        <Clipboard className="w-3 h-3" />
                        Notes added
                      </span>
                    )}
                  </div>

                  {selectedMessage?.id === msg.id && (
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <h4 className="text-xs font-medium text-stone-700 mb-2">Full Message</h4>
                      <p className="text-base leading-relaxed text-stone-700 whitespace-pre-wrap mb-4">
                        {msg.message}
                      </p>
                      <label className="block text-xs font-medium text-stone-700 mb-2">Internal Notes</label>
                      <textarea
                        rows={3}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={!supportsWrite}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#886c44] disabled:bg-stone-50"
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        {supportsWrite && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(msg);
                            }}
                            disabled={deletingId === msg.id}
                            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === msg.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveNotes();
                          }}
                          disabled={savingNote || !supportsWrite}
                          className="flex items-center gap-2 px-3 py-2 bg-[#886c44] text-white rounded-lg hover:bg-[#755c38] disabled:opacity-60"
                        >
                          <Save className="w-4 h-4" />
                          {savingNote ? "Saving..." : "Save Notes"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredMessages.length === 0 && (
              <div className="text-center py-12 text-stone-600">
                No client messages match your current filters.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-stone-700">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-stone-700">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-stone-700">Message</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-stone-700">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-stone-700">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-stone-700">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-stone-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr
                      key={msg.id}
                      className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer"
                      onClick={() => setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)}
                    >
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded border ${STATUS_STYLES[msg.status]}`}>
                          {STATUS_LABELS[msg.status] || "New"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-stone-800">{msg.name || "Unnamed"}</div>
                        <div className="text-xs text-stone-500">{msg.email || msg.phone || "-"}</div>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-sm leading-relaxed text-stone-700 line-clamp-2">
                          {msg.message || "No message"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-stone-100 text-stone-700 text-xs rounded">
                          {CATEGORY_LABELS[msg.category] || msg.category || "Other"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">{msg.source || "-"}</td>
                      <td className="px-4 py-3 text-xs text-stone-600 whitespace-nowrap">
                        {formatDateTime(msg.dateTime)}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {msg.notes ? "Notes added" : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredMessages.length === 0 && (
              <div className="text-center py-12 text-stone-600">
                No client messages match your current filters.
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-stone-500">
          <button onClick={fetchMessages} className="text-[#886c44] hover:underline">
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};
export default ClientMessageTracker;
