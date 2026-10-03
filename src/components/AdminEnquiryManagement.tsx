import { apiUrl } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { AdminEnquiry } from '../types';
import { 
  Inbox, 
  Search, 
  RefreshCw, 
  Filter, 
  Phone, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Car, 
  FileText, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  User, 
  Globe, 
  Save, 
  X, 
  AlertTriangle,
  Send,
  ExternalLink,
  Download,
  FileCheck2,
  Eye
} from 'lucide-react';
import { WhatsAppOfficialIcon } from './WhatsAppFloat';

interface AdminEnquiryManagementProps {
  token: string | null;
  showToast: (message: string, isError?: boolean) => void;
}

const STATUS_OPTIONS = ['New', 'Contacted', 'In Progress', 'Completed', 'Cancelled'] as const;

export const AdminEnquiryManagement: React.FC<AdminEnquiryManagementProps> = ({ token, showToast }) => {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Editing Note State
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Deleting State
  const [deletingEnquiry, setDeletingEnquiry] = useState<AdminEnquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdminEnquiry | null>(null);

  const fetchEnquiries = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/enquiries'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEnquiries(json.data);
      } else {
        showToast(json.error || 'Failed to fetch enquiries.', true);
      }
    } catch (err) {
      showToast('Network error while loading enquiries.', true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [token]);

  const handleStatusChange = async (enquiryId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Status updated to "${newStatus}"`);
        setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: newStatus } : e));
        if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
          setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        showToast(json.error || 'Failed to update status.', true);
      }
    } catch (err) {
      showToast('Network error while updating status.', true);
    }
  };

  const handleSaveNotes = async (enquiryId: string) => {
    if (!token) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: editingNotes })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Notes saved successfully.');
        setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, notes: editingNotes } : e));
        if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
          setSelectedEnquiry(prev => prev ? { ...prev, notes: editingNotes } : null);
        }
        setEditingEnquiryId(null);
      } else {
        showToast(json.error || 'Failed to save notes.', true);
      }
    } catch (err) {
      showToast('Network error while saving notes.', true);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteEnquiry = async () => {
    if (!token || !deletingEnquiry) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${deletingEnquiry.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        showToast('Enquiry deleted successfully.');
        setEnquiries(prev => prev.filter(e => e.id !== deletingEnquiry.id));
        if (selectedEnquiry && selectedEnquiry.id === deletingEnquiry.id) {
          setSelectedEnquiry(null);
        }
        setDeletingEnquiry(null);
      } else {
        showToast(json.error || 'Failed to delete enquiry.', true);
      }
    } catch (err) {
      showToast('Network error while deleting enquiry.', true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredEnquiries = enquiries.filter(item => {
    const type = item.enquiryType || item.type || 'visa';
    const status = item.status || 'New';

    if (filterType !== 'all' && type !== filterType) return false;
    if (filterStatus !== 'all' && status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchPhone = (item.whatsappNumber || '').toLowerCase().includes(q);
      const matchRef = (item.referenceId || item.id || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || item.internalNotes || '').toLowerCase().includes(q);
      const matchDest = (item.destination || '').toLowerCase().includes(q);
      const matchVehicle = (item.vehicleType || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchRef || matchNotes || matchDest || matchVehicle;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'visa') {
      return { label: 'Visa Application', color: 'bg-[#0B4DA2]/10 text-[#0B4DA2] border-[#0B4DA2]/20' };
    }
    if (type === 'car-rental') {
      return { label: 'Car Rental Request', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    return { label: type.toUpperCase(), color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[#0A2540] flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#0B4DA2]" />
              <span>Customer Requests & Applications</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live database records of Visa Applications and Car Rental Enquiries.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchEnquiries}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Name, Phone, Ref ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]/20 focus:border-[#0B4DA2]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]/20 focus:border-[#0B4DA2]"
          >
            <option value="all">All Request Types</option>
            <option value="visa">Visa Applications</option>
            <option value="car-rental">Car Rental Requests</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]/20 focus:border-[#0B4DA2]"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">No requests found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'No records match your selected filter criteria. Try adjusting the search or filters.'
              : 'New submissions from the Visa Application Form and Car Rental Form will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEnquiries.map((enquiry) => {
            const isEditingThisNote = editingEnquiryId === enquiry.id;
            const refId = enquiry.referenceId || enquiry.id;
            const isVisa = enquiry.enquiryType === 'visa';

            return (
              <div
                key={enquiry.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header Row: Type Badge + Ref ID + Status Selector + Delete */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeBadge(enquiry.enquiryType || enquiry.type || 'visa').color}`}>
                      {getTypeBadge(enquiry.enquiryType || enquiry.type || 'visa').label}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {refId}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(enquiry.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Dropdown */}
                    <select
                      value={enquiry.status || 'New'}
                      onChange={(e) => handleStatusChange(enquiry.id, e.target.value)}
                      className={`text-xs font-bold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadge(enquiry.status || 'New')}`}
                    >
                      {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>

                    {/* View Details Modal Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedEnquiry(enquiry)}
                      className="p-1.5 rounded-lg text-[#0B4DA2] hover:bg-[#0B4DA2]/10 transition-colors cursor-pointer"
                      title="View Full Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingEnquiry(enquiry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Client Info */}
                  <div className="space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Applicant / Customer</div>
                    <div className="font-bold text-slate-900 text-sm">{enquiry.name || 'N/A'}</div>
                    {enquiry.nationality && (
                      <div className="text-slate-600">
                        Nationality: <span className="font-semibold text-slate-800">{enquiry.nationality}</span>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Service Details */}
                  <div className="space-y-1">
                    {isVisa ? (
                      <>
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Visa & Travel Details</div>
                        <div className="text-slate-700">
                          Destination: <span className="font-semibold text-slate-900">{enquiry.destination || 'Dubai, UAE'}</span>
                        </div>
                        <div className="text-slate-500">
                          Travel Date: <span className="font-semibold text-slate-800">{enquiry.travelDate || 'Not specified'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Rental Parameters</div>
                        {enquiry.vehicleType && (
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-[#0B4DA2]" />
                            <span>{enquiry.vehicleType}</span> ({enquiry.serviceType || 'Self Drive'})
                          </div>
                        )}
                        {enquiry.pickupLocation && (
                          <div className="text-slate-500 truncate">
                            Pickup: <span className="font-medium text-slate-700">{enquiry.pickupLocation}</span>
                          </div>
                        )}
                        {enquiry.pickupDate && (
                          <div className="text-slate-500">
                            Dates: <span className="font-medium text-slate-700">{enquiry.pickupDate} → {enquiry.returnDate}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Column 3: Contact & PDF Actions */}
                  <div className="space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">WhatsApp Contact</div>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-[#0B4DA2]" />
                        <span>{enquiry.whatsappNumber}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Direct WhatsApp Chat */}
                      {enquiry.whatsappNumber && (
                        <a
                          href={`https://wa.me/${enquiry.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${enquiry.name || ''}, thank you for contacting Zone Tourism & Hotwheels regarding Ref: ${refId}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[11px] transition-colors shadow-xs"
                        >
                          <WhatsAppOfficialIcon className="w-3.5 h-3.5 fill-current" />
                          <span>Chat WhatsApp</span>
                        </a>
                      )}

                      {/* Visa PDF Direct Access Button */}
                      {isVisa && refId && (
                        <a
                          href={`/api/visa-applications/${encodeURIComponent(refId)}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] text-white font-bold text-[11px] transition-colors shadow-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Internal Notes Section */}
                <div className="bg-[#F8FAFC] rounded-xl p-3 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>Operational Notes & Document Summary:</span>
                    </span>
                    {!isEditingThisNote && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEnquiryId(enquiry.id);
                          setEditingNotes(enquiry.notes || enquiry.internalNotes || '');
                        }}
                        className="text-[#0B4DA2] hover:text-[#0A2540] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Note</span>
                      </button>
                    )}
                  </div>

                  {isEditingThisNote ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder="Add client requirements, quote details, status updates..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingEnquiryId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(enquiry.id)}
                          disabled={isSavingNotes}
                          className="px-3 py-1 rounded-lg bg-[#0B4DA2] hover:bg-[#0A2540] text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          <span>{isSavingNotes ? 'Saving...' : 'Save Note'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {enquiry.notes || enquiry.internalNotes || <span className="italic text-slate-400">No notes recorded.</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-slate-900">Delete Record</h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete record <span className="font-mono font-bold text-slate-700">{deletingEnquiry.referenceId || deletingEnquiry.id}</span> from <span className="font-semibold">{deletingEnquiry.name || 'Client'}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEnquiry(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEnquiry}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Details Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeBadge(selectedEnquiry.enquiryType || selectedEnquiry.type || 'visa').color}`}>
                  {getTypeBadge(selectedEnquiry.enquiryType || selectedEnquiry.type || 'visa').label}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {selectedEnquiry.referenceId || selectedEnquiry.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Applicant / Customer</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedEnquiry.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp Number</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">{selectedEnquiry.whatsappNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Created Date</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedEnquiry.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded font-bold mt-0.5 ${getStatusBadge(selectedEnquiry.status)}`}>
                    {selectedEnquiry.status}
                  </span>
                </div>
              </div>

              {selectedEnquiry.enquiryType === 'visa' && (
                <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Nationality</span>
                      <span className="font-semibold text-slate-800">{selectedEnquiry.nationality || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
                      <span className="font-semibold text-slate-800">{selectedEnquiry.destination || 'United Arab Emirates'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Travel Date</span>
                      <span className="font-semibold text-slate-800">{selectedEnquiry.travelDate || 'N/A'}</span>
                    </div>
                  </div>

                  {/* PDF View & Download Actions inside Modal */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={`/api/visa-applications/${encodeURIComponent(selectedEnquiry.referenceId || selectedEnquiry.id)}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Full Application PDF</span>
                    </a>
                    <a
                      href={`/api/visa-applications/${encodeURIComponent(selectedEnquiry.referenceId || selectedEnquiry.id)}/pdf?download=true${token ? `&token=${encodeURIComponent(token)}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )}

              {selectedEnquiry.enquiryType === 'car-rental' && (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle Type</span>
                    <span className="font-semibold text-slate-800">{selectedEnquiry.vehicleType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Service Type</span>
                    <span className="font-semibold text-slate-800">{selectedEnquiry.serviceType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Location</span>
                    <span className="font-semibold text-slate-800">{selectedEnquiry.pickupLocation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Dates</span>
                    <span className="font-semibold text-slate-800">{selectedEnquiry.pickupDate} → {selectedEnquiry.returnDate}</span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Notes & Details</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedEnquiry.notes || selectedEnquiry.internalNotes || 'No notes available.'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              {selectedEnquiry.whatsappNumber && (
                <a
                  href={`https://wa.me/${selectedEnquiry.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedEnquiry.name || ''}, following up regarding your enquiry Ref: ${selectedEnquiry.referenceId || selectedEnquiry.id}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <WhatsAppOfficialIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Open WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
