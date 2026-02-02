import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Archive, RefreshCw, Save } from 'lucide-react';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwvi0OZXNzKNXrfN4HHwsR1kzwwZeq5HvTnyic2GKzXN9_Fx2O_AFCuj6izIAIhdg5t/exec';

const defaultBookings = [
  { id: 1, name: "Korrie Peterson & Seann Wedding", type: "Wedding", date: "11/7/2026", client1: "Korrie Peterson", client2: "Katie Klouda" },
  { id: 2, name: "Abigail Cooper Wedding Inquiry", type: "Wedding", date: "5/29/2026", client1: "Abigail", client2: "Kimberly Cooper" },
  { id: 3, name: "Alisha Stolze & Ryan Fazzi Wedding", type: "Wedding", date: "10/22/2027", client1: "Alisha Stolze", client2: "Ryan Fazzi" },
  { id: 4, name: "Ronald A. Zinke", type: "Wedding", date: "2/22/2026", client1: "Ronald A. Zinke", client2: "" },
  { id: 5, name: "Cherylynn Allen Wedding", type: "Wedding", date: "4/18/2026", client1: "Cherylynn Allen", client2: "" },
  { id: 6, name: "Emma Shilin & Ruben Nikolaychuk Wedding", type: "Wedding", date: "4/25/2026", client1: "Ruben N", client2: "Emma Shilin" },
  { id: 7, name: "Camille Hoff & Max Wiley Wedding", type: "Wedding", date: "5/2/2026", client1: "Camille Hoff", client2: "Max Wiley" },
  { id: 8, name: "Carson Burand & Jessica Gonzales Wedding", type: "Wedding", date: "5/8/2026", client1: "Carson Burand", client2: "Jessica Gonzales" },
  { id: 9, name: "Jade Hackbarth & Page Whittle Wedding", type: "Wedding", date: "5/24/2026", client1: "Jade Hackbarth", client2: "Page Whittle" },
  { id: 10, name: "Lainee Noya & Samuel Howard Wedding", type: "Wedding", date: "5/30/2026", client1: "Lainee Noya", client2: "Samuel Howard" },
  { id: 11, name: "Daisy Cantrell & Layne Harding Wedding", type: "Wedding", date: "5/31/2026", client1: "", client2: "" },
  { id: 12, name: "Nikki Kapakly & Aleksey Yepikhin Wedding", type: "Wedding", date: "6/5/2026", client1: "Nikki Kapakly", client2: "Aleksey Yepikhin" },
  { id: 13, name: "Davia Pratschner & Sunderland Morrow Wedding", type: "Wedding", date: "6/20/2026", client1: "Davia Pratschner", client2: "Sunderland Morrow" },
  { id: 14, name: "Hannah Chilson & Matthew Bolino Wedding", type: "Wedding", date: "6/21/2026", client1: "Hannah Chilson", client2: "Matthew Bolino" },
  { id: 15, name: "Evonna Lintz & Seth VanDam Wedding", type: "Wedding", date: "9/5/2026", client1: "Evonna Lintz", client2: "Seth van Dam" },
  { id: 16, name: "Grace Van Winkle's Project", type: "Wedding", date: "9/19/2026", client1: "Grace Van Winkle", client2: "" },
  { id: 17, name: "Taylor Gallagher & John Riess Wedding", type: "Wedding", date: "9/19/2026", client1: "Taylor Gallagher", client2: "John Riess" },
  { id: 18, name: "Darlene Hall & Jacob Abel Wedding", type: "Wedding", date: "10/3/2026", client1: "Darlene Hall", client2: "Jacob Abel" },
  { id: 19, name: "Danielle Bellavance & Derek Nguyen Wedding", type: "Wedding", date: "10/4/2026", client1: "Derek Nguyen", client2: "Danielle Bellavance" },
  { id: 20, name: "Holly Harrison & Dylan McGraw Wedding", type: "Wedding", date: "6/5/2027", client1: "Holly Harrison", client2: "Dylan Latham McGraw" },
  { id: 21, name: "Madison Dirks & Joshua Provins Wedding", type: "Wedding", date: "6/11/2027", client1: "Madison Dirks", client2: "Joshua Provins" },
  { id: 22, name: "Catherine (Katie) Sherer & Chandler Withaus Wedding", type: "Wedding", date: "1/13/2028", client1: "Catherine Sherer", client2: "Chandler Witthaus" },
  { id: 23, name: "Marah Caravalho Private Party", type: "Private Party", date: "6/14/2026", client1: "Marah Caravalho", client2: "" },
  { id: 24, name: "Amelia Workman Private Party", type: "Private Party", date: "2/7/2026", client1: "Amelia Workman", client2: "" },
  { id: 25, name: "Emily Malsam Baby Shower", type: "Private Party", date: "1/4/2026", client1: "Emily Malsam", client2: "" },
  { id: 26, name: "Jeffrey Adams - Bat Mitzvah", type: "Private Party", date: "4/11/2026", client1: "", client2: "" },
  { id: 27, name: "Shealei Sandobal's Project", type: "Private Party", date: "6/7/2026", client1: "Shealei", client2: "Michael Hinrichs" },
  { id: 28, name: "David Montagne 100th Birthday", type: "Private Party", date: "7/18/2026", client1: "David Montagne", client2: "" },
  { id: 29, name: "Sierra Nevada Family Medicine Residency", type: "Non-Profit", date: "6/26/2026", client1: "Erin Kolb", client2: "" }
].map(b => ({
  ...b,
  id: String(b.id),
  brickWordingReceived: false,
  wording: "",
  orderStatus: "",
  insuranceReceived: false,
  questionnaireReceived: false,
  photoPermission: false,
  photographerLink: "",
  projectLink: "",
  posted: false,
  completed: false
}));

const BookingsLog = () => {
  const [bookings, setBookings] = useState(defaultBookings);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const saveTimeoutRef = useRef(null);

  const normalizeBookings = (list) =>
    list.map((b) => {
      const projectLink = b.projectLink || b.ProjectLink || b['Project Link'] || '';
      const name = b.name || b['Project Name'] || '';
      return {
        ...b,
        name,
        projectLink,
        // Use name as the stable key for save/restore.
        id: String(b.id || name || ''),
      };
    });

  const mapBookingForSave = (b) => ({
    ...b,
    projectLink: b.projectLink || b.ProjectLink || b['Project Link'] || '',
    ProjectLink: b.projectLink || b.ProjectLink || b['Project Link'] || '',
    'Project Link': b.projectLink || b.ProjectLink || b['Project Link'] || '',
    id: String(b.name || b.id || ''),
  });

  // Load bookings from Google Sheets
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setSyncStatus('Loading...');
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getBookings`);
      const data = await response.json();
      if (data.success && data.bookings && data.bookings.length > 0) {
        setBookings(normalizeBookings(data.bookings));
        setSyncStatus('Synced');
      } else if (data.success && (!data.bookings || data.bookings.length === 0)) {
        // No data in sheet yet, seed it with defaults
        setBookings(defaultBookings);
        setSyncStatus('Initialized with defaults');
        await saveAllToSheet(defaultBookings);
      } else {
        setSyncStatus('Load failed');
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setSyncStatus('Offline');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Save all bookings to sheet
  const saveAllToSheet = async (bookingsToSave) => {
    setSaving(true);
    setSyncStatus('Saving...');
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveAllBookings',
          bookings: bookingsToSave.map(mapBookingForSave),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSyncStatus('Saved');
      } else {
        setSyncStatus('Save failed');
      }
    } catch (err) {
      console.error('Failed to save bookings:', err);
      setSyncStatus('Save failed');
    }
    setSaving(false);
  };

  // Auto-save with debounce
  const debouncedSave = useCallback((updatedBookings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveAllToSheet(updatedBookings);
    }, 2000);
  }, []);

  const updateBookings = (updatedBookings) => {
    setBookings(updatedBookings);
    debouncedSave(updatedBookings);
  };

  const toggleCheckbox = (id, field) => {
    const updated = bookings.map(b =>
      b.id === id ? { ...b, [field]: !b[field] } : b
    );
    updateBookings(updated);
  };

  const updateField = (id, field, value) => {
    const updated = bookings.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    );
    updateBookings(updated);
  };

  const toggleCompleted = (id) => {
    const updated = bookings.map(b =>
      b.id === id ? { ...b, completed: !b.completed } : b
    );
    updateBookings(updated);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date('');
    // Handle ISO strings from Sheets (e.g., 2026-11-07T08:00:00.000Z)
    if (dateStr.includes('T')) {
      const iso = new Date(dateStr);
      return iso;
    }
    const [month, day, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      const iso = new Date(dateStr);
      if (Number.isNaN(iso.getTime())) return '';
      const mm = String(iso.getMonth() + 1).padStart(2, '0');
      const dd = String(iso.getDate()).padStart(2, '0');
      const yyyy = String(iso.getFullYear()).padStart(4, '0');
      return `${mm}-${dd}-${yyyy}`;
    }
    const [month, day, year] = dateStr.split('/');
    const mm = String(month || '').padStart(2, '0');
    const dd = String(day || '').padStart(2, '0');
    const yyyy = String(year || '').padStart(4, '0');
    return `${mm}-${dd}-${yyyy}`;
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'active' && b.completed) return false;
    if (filter === 'archived' && !b.completed) return false;

    const eventDate = parseDate(b.date);
    const today = new Date();
    const threeMonthsOut = new Date(today);
    threeMonthsOut.setMonth(today.getMonth() + 3);
    const oneMonthOut = new Date(today);
    oneMonthOut.setMonth(today.getMonth() + 1);

    if (filter === 'upcoming') {
      return eventDate >= today && !b.completed;
    }
    if (filter === 'needs-attention') {
      const isWithinThreeMonths = eventDate <= threeMonthsOut && eventDate >= today;
      return isWithinThreeMonths && !b.completed;
    }
    if (filter === 'button-this-up') {
      const isWithinOneMonth = eventDate <= oneMonthOut && eventDate >= today;
      return isWithinOneMonth && !b.completed;
    }
    if (filter === 'finalized') {
      const allComplete = b.insuranceReceived &&
             b.questionnaireReceived && b.photoPermission &&
             (b.type !== 'Wedding' || b.brickWordingReceived);
      return allComplete && !b.completed;
    }
    if (filter === 'Wedding' || filter === 'Private Party' || filter === 'Non-Profit') {
      return b.type === filter && !b.completed;
    }
    return true;
  }).sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const getTypeColor = (type) => {
    switch(type) {
      case 'Wedding': return 'bg-amber-50';
      case 'Private Party': return 'bg-blue-50';
      case 'Non-Profit': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getTypeBorderColor = () => '#886c44';

  const activeCount = bookings.filter(b => !b.completed).length;
  const archivedCount = bookings.filter(b => b.completed).length;
  const weddingsCount = bookings.filter(b => b.type === 'Wedding' && !b.completed).length;
  const privatePartiesCount = bookings.filter(b => b.type === 'Private Party' && !b.completed).length;
  const nonProfitCount = bookings.filter(b => b.type === 'Non-Profit' && !b.completed).length;

  const today = new Date();
  const threeMonthsOut = new Date(today);
  threeMonthsOut.setMonth(today.getMonth() + 3);
  const oneMonthOut = new Date(today);
  oneMonthOut.setMonth(today.getMonth() + 1);

  const needsAttentionCount = bookings.filter(b => {
    const eventDate = parseDate(b.date);
    const isWithinThreeMonths = eventDate <= threeMonthsOut && eventDate >= today;
    return isWithinThreeMonths && !b.completed;
  }).length;

  const buttonThisUpCount = bookings.filter(b => {
    const eventDate = parseDate(b.date);
    const isWithinOneMonth = eventDate <= oneMonthOut && eventDate >= today;
    return isWithinOneMonth && !b.completed;
  }).length;

  const finalizedCount = bookings.filter(b => {
    const allComplete = b.insuranceReceived &&
           b.questionnaireReceived && b.photoPermission &&
           (b.type !== 'Wedding' || b.brickWordingReceived);
    return allComplete && !b.completed;
  }).length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-light mb-2 font-cardo text-[#886c44]">North Star House</h1>
            <p className="text-stone-600">Bookings Log</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${
              syncStatus === 'Saved' || syncStatus === 'Synced' ? 'bg-green-100 text-green-700' :
              syncStatus === 'Saving...' || syncStatus === 'Loading...' ? 'bg-yellow-100 text-yellow-700' :
              syncStatus === 'Offline' || syncStatus.includes('failed') ? 'bg-red-100 text-red-700' :
              'bg-stone-100 text-stone-600'
            }`}>
              {syncStatus}
            </span>
            <button
              onClick={loadBookings}
              disabled={loading}
              className="p-2 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
              title="Refresh from Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => saveAllToSheet(bookings)}
              disabled={saving}
              className="p-2 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
              title="Save to Google Sheets"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'active'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setFilter('archived')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'archived'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Archived ({archivedCount})
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'upcoming'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('needs-attention')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'needs-attention'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Needs Attention ({needsAttentionCount})
              </button>
              <button
                onClick={() => setFilter('button-this-up')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'button-this-up'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                Button This Up ({buttonThisUpCount})
              </button>
              <button
                onClick={() => setFilter('finalized')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'finalized'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                Finalized ({finalizedCount})
              </button>
            </div>
            <div className="h-6 w-px bg-stone-300"></div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('Wedding')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'Wedding'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                Weddings ({weddingsCount})
              </button>
              <button
                onClick={() => setFilter('Private Party')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'Private Party'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                }`}
              >
                Private Parties ({privatePartiesCount})
              </button>
              <button
                onClick={() => setFilter('Non-Profit')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filter === 'Non-Profit'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                Non-Profit ({nonProfitCount})
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 text-stone-500">
            Loading bookings from Google Sheets...
          </div>
        )}

        {/* Bookings Grid */}
        {!loading && (
          <div className="grid gap-6">
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                className={`bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md ${getTypeColor(booking.type)} ${booking.completed ? 'opacity-60' : ''}`}
                style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: getTypeBorderColor(booking.type) }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-stone-200">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium text-stone-800">{booking.name}</h3>
                      {booking.projectLink && (
                        <a
                          href={booking.projectLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-medium text-stone-700 underline decoration-stone-400 underline-offset-2 hover:text-stone-900"
                        >
                          Project Link
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 mt-1">{formatDate(booking.date)}</p>
                    {booking.client1 && (
                      <p className="text-xs text-stone-500 mt-1">{booking.client1}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-stone-700 border border-stone-300">
                      {booking.type}
                    </span>
                    <button
                      onClick={() => toggleCompleted(booking.id)}
                      className={`p-2 rounded-md transition-colors ${
                        booking.completed
                          ? 'bg-stone-600 text-white hover:bg-stone-700'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                      title={booking.completed ? 'Unarchive' : 'Mark as Complete'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Checkboxes Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {booking.type === 'Wedding' && (
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div
                        onClick={() => toggleCheckbox(booking.id, 'brickWordingReceived')}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          booking.brickWordingReceived
                            ? 'bg-stone-800 border-stone-800'
                            : 'border-stone-300 group-hover:border-stone-400'
                        }`}
                      >
                        {booking.brickWordingReceived && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-stone-700">Brick Wording Received</span>
                    </label>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => toggleCheckbox(booking.id, 'insuranceReceived')}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        booking.insuranceReceived
                          ? 'bg-stone-800 border-stone-800'
                          : 'border-stone-300 group-hover:border-stone-400'
                      }`}
                    >
                      {booking.insuranceReceived && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-stone-700">Insurance Received</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => toggleCheckbox(booking.id, 'questionnaireReceived')}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        booking.questionnaireReceived
                          ? 'bg-stone-800 border-stone-800'
                          : 'border-stone-300 group-hover:border-stone-400'
                      }`}
                    >
                      {booking.questionnaireReceived && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-stone-700">Questionnaire Received</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => toggleCheckbox(booking.id, 'photoPermission')}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        booking.photoPermission
                          ? 'bg-stone-800 border-stone-800'
                          : 'border-stone-300 group-hover:border-stone-400'
                      }`}
                    >
                      {booking.photoPermission && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-stone-700">Photo Permission</span>
                  </label>

                </div>

                {/* Text Fields */}
                <div className="grid md:grid-cols-2 gap-3">
                  {booking.type === 'Wedding' && (
                    <>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Wording</label>
                        <textarea
                          value={booking.wording}
                          onChange={(e) => updateField(booking.id, 'wording', e.target.value)}
                          placeholder="Max 3 lines, 20 chars each"
                          rows="3"
                          maxLength={60}
                          className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                        />
                        <p className="mt-1 text-[11px] text-stone-500">
                          {60 - (booking.wording?.length || 0)} characters left
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Order Status</label>
                        <select
                          value={booking.orderStatus}
                          onChange={(e) => updateField(booking.id, 'orderStatus', e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                        >
                          <option value="">Select status...</option>
                          <option value="Ordered">Ordered</option>
                          <option value="Received">Received</option>
                          <option value="Set in the ground">Set in the ground</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Photographer Link</label>
                        <input
                          type="text"
                          value={booking.photographerLink}
                          onChange={(e) => updateField(booking.id, 'photographerLink', e.target.value)}
                          placeholder="Enter link..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                          onClick={() => toggleCheckbox(booking.id, 'posted')}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            booking.posted
                              ? 'bg-stone-800 border-stone-800'
                              : 'border-stone-300 group-hover:border-stone-400'
                          }`}
                        >
                          {booking.posted && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-stone-700">Posted</span>
                      </label>
                    </>
                  )}
                  {booking.type !== 'Wedding' && (
                    <>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Photographer Link</label>
                        <input
                          type="text"
                          value={booking.photographerLink}
                          onChange={(e) => updateField(booking.id, 'photographerLink', e.target.value)}
                          placeholder="Enter link..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer group md:items-start md:pt-5">
                        <div
                          onClick={() => toggleCheckbox(booking.id, 'posted')}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            booking.posted
                              ? 'bg-stone-800 border-stone-800'
                              : 'border-stone-300 group-hover:border-stone-400'
                          }`}
                        >
                          {booking.posted && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-stone-700">Posted</span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            No bookings match your current filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsLog;
