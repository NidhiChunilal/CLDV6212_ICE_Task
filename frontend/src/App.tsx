import { useState, useEffect } from 'react';
import './App.css';

// ============================================================
// CLDV6212 Cloud Development — Group ICE Task Presentation
// Logistics & Fleet Delivery Tracker
// Team Members: Youvay (Leader), Nidhi (Backend), Kiasha (Frontend), Rhea (Tracking UI)
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PIPELINE_COLUMNS = ['Pending', 'Dispatched', 'In Transit', 'Delivered', 'Delayed'];

const NEXT_STAGE: { [key: string]: string } = {
  'Pending': 'Dispatched',
  'Dispatched': 'In Transit',
  'In Transit': 'Delivered',
  'Delayed': 'In Transit',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'board' | 'drivers' | 'tracking'>('board');
  const [shipments, setShipments] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);

  // Create Form state
  const [newSender, setNewSender] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newWeight, setNewWeight] = useState('2.5');
  const [newDriverId, setNewDriverId] = useState('');

  // Edit / Details state
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [assignDriverId, setAssignDriverId] = useState('');

  // Public Tracking Tab state
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const notify = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  // Helper to safely access object fields
  const getVal = (obj: any, key1: string, key2: string, fallback = '') => {
    if (!obj) return fallback;
    return obj[key1] !== undefined ? obj[key1] : obj[key2] !== undefined ? obj[key2] : fallback;
  };

  // Fetch all shipments and drivers
  const fetchData = async () => {
    try {
      setLoading(true);
      const [shipRes, drivRes] = await Promise.all([
        fetch(`${API_URL}/shipments`),
        fetch(`${API_URL}/drivers`),
      ]);

      if (!shipRes.ok || !drivRes.ok) {
        throw new Error('API communication error');
      }

      const shipData = await shipRes.json();
      const drivData = await drivRes.json();

      setShipments(shipData);
      setDrivers(drivData);
      setApiConnected(true);
    } catch (err: any) {
      console.error(err);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // One-click quick advance to next pipeline stage
  const handleAdvanceStatus = async (shipment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getVal(shipment, 'currentStatus', 'CurrentStatus', 'Pending');
    const next = NEXT_STAGE[current];
    if (!next) return;

    try {
      const id = getVal(shipment, 'id', 'Id');
      const res = await fetch(`${API_URL}/shipments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, notes: `Advanced to ${next} from Kanban` }),
      });

      if (!res.ok) throw new Error('Failed to update stage');
      notify(`Advanced #${getVal(shipment, 'trackingNumber', 'TrackingNumber')} to ${next}`);
      fetchData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Create new shipment
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSender || !newRecipient || !newAddress) {
      notify('Please fill in required fields.', true);
      return;
    }

    try {
      const payload = {
        senderName: newSender,
        recipientName: newRecipient,
        destinationAddress: newAddress,
        packageWeightKg: parseFloat(newWeight) || 1.0,
        driverId: newDriverId ? parseInt(newDriverId) : null,
      };

      const res = await fetch(`${API_URL}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create shipment');

      const created = await res.json();
      notify(`Shipment ${getVal(created, 'trackingNumber', 'TrackingNumber')} registered!`);
      
      setNewSender('');
      setNewRecipient('');
      setNewAddress('');
      setNewWeight('2.5');
      setNewDriverId('');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Open inspection modal
  const openShipmentDetails = (shipment: any) => {
    setSelectedShipment(shipment);
    setUpdateStatus(getVal(shipment, 'currentStatus', 'CurrentStatus', 'Pending'));
    setUpdateNotes('');
    setAssignDriverId(String(getVal(shipment, 'driverId', 'DriverId', '')));
  };

  // Update status from modal
  const handleModalStatusUpdate = async () => {
    if (!selectedShipment) return;
    const id = getVal(selectedShipment, 'id', 'Id');

    try {
      const res = await fetch(`${API_URL}/shipments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updateStatus, notes: updateNotes || 'Manual status update' }),
      });

      if (!res.ok) throw new Error('Status update failed');
      notify(`Status updated to ${updateStatus}`);
      setSelectedShipment(null);
      fetchData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Assign driver from modal
  const handleModalDriverAssign = async () => {
    if (!selectedShipment || !assignDriverId) return;
    const id = getVal(selectedShipment, 'id', 'Id');

    try {
      const res = await fetch(`${API_URL}/shipments/${id}/assign-driver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: parseInt(assignDriverId) }),
      });

      if (!res.ok) throw new Error('Driver assignment failed');
      notify('Driver assigned successfully');
      setSelectedShipment(null);
      fetchData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Public Tracking search
  const handlePublicTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    try {
      setTrackLoading(true);
      const res = await fetch(`${API_URL}/shipments/track/${encodeURIComponent(trackQuery.trim())}`);
      if (!res.ok) throw new Error('Tracking number not found');
      const data = await res.json();
      setTrackResult(data);
    } catch (err: any) {
      setTrackResult(null);
      notify(err.message, true);
    } finally {
      setTrackLoading(false);
    }
  };

  // Filter shipments by search query
  const filteredShipments = shipments.filter((s) => {
    const q = searchQuery.toLowerCase();
    const track = getVal(s, 'trackingNumber', 'TrackingNumber').toLowerCase();
    const recip = getVal(s, 'recipientName', 'RecipientName').toLowerCase();
    const addr = getVal(s, 'destinationAddress', 'DestinationAddress').toLowerCase();
    return track.includes(q) || recip.includes(q) || addr.includes(q);
  });

  return (
    <div className="app-container">
      {/* ─── NAVBAR ─── */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">⚡</div>
          <div>
            <h1 className="brand-title">LOGISTICS // FLEET TRACKER</h1>
            <p className="brand-subtitle">CLDV6212 • ICE Task Prototype</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
            onClick={() => setActiveTab('board')}
          >
            Pipeline Board
          </button>
          <button
            className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('drivers')}
          >
            Fleet Drivers ({drivers.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracking')}
          >
            Track Parcel
          </button>
        </nav>

        <div className="nav-actions">
          <div className={`status-badge ${apiConnected ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            {apiConnected ? 'API Live (200 OK)' : 'API Offline'}
          </div>

          <button className="btn-secondary" onClick={fetchData} title="Refresh live data">
            {loading ? '...' : '↻ Refresh'}
          </button>

          <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
            + New Parcel
          </button>
        </div>
      </header>

      {/* ─── TOAST NOTIFICATION ─── */}
      {message && (
        <div className={`toast-banner ${message.isError ? 'error' : ''}`}>
          <span>{message.text}</span>
          <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setMessage(null)}>✕</span>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="main-content">
        {/* TAB 1: KANBAN BOARD */}
        {activeTab === 'board' && (
          <div>
            <div className="board-header">
              <div className="kpi-strip">
                <div className="kpi-card">
                  <span className="kpi-label">Total Parcels</span>
                  <span className="kpi-value">{shipments.length}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">In Transit</span>
                  <span className="kpi-value" style={{ color: 'var(--status-intransit)' }}>
                    {shipments.filter(s => getVal(s, 'currentStatus', 'CurrentStatus') === 'In Transit').length}
                  </span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Delivered</span>
                  <span className="kpi-value" style={{ color: 'var(--status-delivered)' }}>
                    {shipments.filter(s => getVal(s, 'currentStatus', 'CurrentStatus') === 'Delivered').length}
                  </span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Delayed</span>
                  <span className="kpi-value" style={{ color: 'var(--status-delayed)' }}>
                    {shipments.filter(s => getVal(s, 'currentStatus', 'CurrentStatus') === 'Delayed').length}
                  </span>
                </div>
              </div>

              <input
                type="text"
                className="search-input"
                placeholder="Search tracking, recipient, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* KANBAN COLUMNS */}
            <div className="kanban-grid">
              {PIPELINE_COLUMNS.map((column) => {
                const columnShipments = filteredShipments.filter(
                  (s) => getVal(s, 'currentStatus', 'CurrentStatus') === column
                );

                return (
                  <div key={column} className="kanban-column" data-col={column}>
                    <div className="column-header">
                      <div className="column-title-group">
                        <span className="column-title">{column}</span>
                      </div>
                      <span className="column-count">{columnShipments.length}</span>
                    </div>

                    <div className="column-cards">
                      {columnShipments.length === 0 ? (
                        <div className="empty-col">No parcels in {column}</div>
                      ) : (
                        columnShipments.map((shipment) => {
                          const trackNum = getVal(shipment, 'trackingNumber', 'TrackingNumber');
                          const recipient = getVal(shipment, 'recipientName', 'RecipientName');
                          const address = getVal(shipment, 'destinationAddress', 'DestinationAddress');
                          const weight = getVal(shipment, 'packageWeightKg', 'PackageWeightKg');
                          const driver = shipment.driver || shipment.Driver;
                          const driverName = driver ? getVal(driver, 'fullName', 'FullName') : null;
                          const vehicleReg = driver ? getVal(driver, 'vehicleRegistration', 'VehicleRegistration') : null;
                          const canAdvance = NEXT_STAGE[column] !== undefined;

                          return (
                            <div
                              key={getVal(shipment, 'id', 'Id')}
                              className="parcel-card"
                              onClick={() => openShipmentDetails(shipment)}
                            >
                              <div className="card-top">
                                <span className="tracking-pill">{trackNum}</span>
                                <span className="weight-pill">{weight} kg</span>
                              </div>

                              <div className="card-recipient">{recipient}</div>
                              <div className="card-address">{address}</div>

                              <div className={`card-driver-tag ${!driverName ? 'unassigned' : ''}`}>
                                <span>{driverName ? `Driver: ${driverName}` : '⚠️ Unassigned'}</span>
                                {vehicleReg && <span>[{vehicleReg}]</span>}
                              </div>

                              <div className="card-actions">
                                <button className="btn-card-detail">Inspect ↗</button>
                                {canAdvance && (
                                  <button
                                    className="btn-card-advance"
                                    onClick={(e) => handleAdvanceStatus(shipment, e)}
                                    title={`Advance to ${NEXT_STAGE[column]}`}
                                  >
                                    Move to {NEXT_STAGE[column]} →
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FLEET DRIVERS */}
        {activeTab === 'drivers' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Registered Fleet Drivers
            </h2>
            <div className="drivers-grid">
              {drivers.map((d) => {
                const driverId = getVal(d, 'id', 'Id');
                const fullName = getVal(d, 'fullName', 'FullName');
                const reg = getVal(d, 'vehicleRegistration', 'VehicleRegistration');
                const phone = getVal(d, 'phoneNumber', 'PhoneNumber');
                const assignedCount = shipments.filter(
                  (s) => String(getVal(s, 'driverId', 'DriverId')) === String(driverId)
                ).length;

                return (
                  <div key={driverId} className="driver-card">
                    <div className="driver-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="driver-avatar">{fullName.charAt(0)}</div>
                        <div>
                          <div className="driver-name">{fullName}</div>
                          <div className="driver-phone">📞 {phone}</div>
                        </div>
                      </div>
                      <span className="status-badge online">Active</span>
                    </div>

                    <div className="driver-vehicle-badge">
                      <span>Vehicle Reg</span>
                      <strong style={{ fontFamily: 'monospace' }}>{reg}</strong>
                    </div>

                    <div className="driver-shipments-count">
                      Currently carrying: <strong>{assignedCount} package(s)</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PUBLIC TRACKING */}
        {activeTab === 'tracking' && (
          <div className="tracking-wrapper">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' }}>
              Public Delivery Tracking
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--fg-muted)', textAlign: 'center', marginTop: '0.35rem' }}>
              Enter any demo tracking number (e.g. <code>LFT-DEMO001</code> to <code>LFT-DEMO005</code>)
            </p>

            <form onSubmit={handlePublicTrack} className="tracking-search-bar">
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="e.g. LFT-DEMO001"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={trackLoading}>
                {trackLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {trackResult && (
              <div className="tracking-result-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <span className="tracking-pill" style={{ fontSize: '0.9rem' }}>
                      {getVal(trackResult, 'trackingNumber', 'TrackingNumber')}
                    </span>
                    <h3 style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
                      {getVal(trackResult, 'recipientName', 'RecipientName')}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>
                      {getVal(trackResult, 'destinationAddress', 'DestinationAddress')}
                    </p>
                  </div>
                  <div>
                    <span className="status-badge online" style={{ fontSize: '0.85rem' }}>
                      {getVal(trackResult, 'currentStatus', 'CurrentStatus')}
                    </span>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--fg-secondary)', marginTop: '1rem' }}>
                  Transit Log
                </h4>
                <div className="history-list">
                  {(trackResult.statusLogs || trackResult.StatusLogs || []).map((log: any, idx: number) => (
                    <div key={idx} className="history-item">
                      <div>
                        <strong>{getVal(log, 'status', 'Status')}</strong>: {getVal(log, 'notes', 'Notes')}
                      </div>
                      <span style={{ color: 'var(--fg-dim)', fontSize: '0.72rem' }}>
                        {new Date(getVal(log, 'timestamp', 'Timestamp')).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── MODAL: NEW SHIPMENT ─── */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">+ Register New Shipment</h2>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sender Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Durban Hub"
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Sipho Ndlovu"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Address *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. 14 Smith Street, Durban"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Driver</label>
                  <select
                    className="form-select"
                    value={newDriverId}
                    onChange={(e) => setNewDriverId(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {drivers.map((d) => (
                      <option key={getVal(d, 'id', 'Id')} value={getVal(d, 'id', 'Id')}>
                        {getVal(d, 'fullName', 'FullName')} ({getVal(d, 'vehicleRegistration', 'VehicleRegistration')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Parcel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: SHIPMENT INSPECTION & EDIT ─── */}
      {selectedShipment && (
        <div className="modal-overlay" onClick={() => setSelectedShipment(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="tracking-pill">
                  {getVal(selectedShipment, 'trackingNumber', 'TrackingNumber')}
                </span>
                <h2 className="modal-title" style={{ marginTop: '0.35rem' }}>
                  {getVal(selectedShipment, 'recipientName', 'RecipientName')}
                </h2>
              </div>
              <button className="modal-close" onClick={() => setSelectedShipment(null)}>✕</button>
            </div>

            {/* Stepper */}
            <div className="stepper">
              {['Pending', 'Dispatched', 'In Transit', 'Delivered'].map((st, i) => {
                const current = getVal(selectedShipment, 'currentStatus', 'CurrentStatus');
                const stages = ['Pending', 'Dispatched', 'In Transit', 'Delivered'];
                const currentIndex = stages.indexOf(current);
                const isCompleted = currentIndex > i;
                const isActive = currentIndex === i;

                return (
                  <div
                    key={st}
                    className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  >
                    <div className="step-circle">{isCompleted ? '✓' : i + 1}</div>
                    <span className="step-label">{st}</span>
                  </div>
                );
              })}
            </div>

            {/* Parcel Meta */}
            <div style={{ background: 'var(--surface-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
              <div><strong>Destination:</strong> {getVal(selectedShipment, 'destinationAddress', 'DestinationAddress')}</div>
              <div style={{ marginTop: '0.35rem' }}><strong>Weight:</strong> {getVal(selectedShipment, 'packageWeightKg', 'PackageWeightKg')} kg</div>
              <div style={{ marginTop: '0.35rem' }}>
                <strong>Current Driver:</strong>{' '}
                {selectedShipment.driver || selectedShipment.Driver
                  ? `${getVal(selectedShipment.driver || selectedShipment.Driver, 'fullName', 'FullName')} [${getVal(selectedShipment.driver || selectedShipment.Driver, 'vehicleRegistration', 'VehicleRegistration')}]`
                  : 'Unassigned'}
              </div>
            </div>

            {/* Update Status Section */}
            <div className="form-group">
              <label className="form-label">Update Delivery Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="form-select"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                </select>
                <button className="btn-primary" onClick={handleModalStatusUpdate}>
                  Update Status
                </button>
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Optional status note (e.g. Arrived at depot)"
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                style={{ marginTop: '0.4rem' }}
              />
            </div>

            {/* Reassign Driver Section */}
            <div className="form-group">
              <label className="form-label">Assign / Change Driver</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="form-select"
                  value={assignDriverId}
                  onChange={(e) => setAssignDriverId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={getVal(d, 'id', 'Id')} value={getVal(d, 'id', 'Id')}>
                      {getVal(d, 'fullName', 'FullName')} ({getVal(d, 'vehicleRegistration', 'VehicleRegistration')})
                    </option>
                  ))}
                </select>
                <button className="btn-secondary" onClick={handleModalDriverAssign}>
                  Reassign Driver
                </button>
              </div>
            </div>

            {/* Status History Logs */}
            <div>
              <label className="form-label">Status Logs History</label>
              <div className="history-list">
                {(selectedShipment.statusLogs || selectedShipment.StatusLogs || []).length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-dim)' }}>No prior status logs recorded.</div>
                ) : (
                  (selectedShipment.statusLogs || selectedShipment.StatusLogs).map((l: any, idx: number) => (
                    <div key={idx} className="history-item">
                      <div>
                        <strong>{getVal(l, 'status', 'Status')}</strong>: {getVal(l, 'notes', 'Notes')}
                      </div>
                      <span style={{ color: 'var(--fg-dim)', fontSize: '0.72rem' }}>
                        {new Date(getVal(l, 'timestamp', 'Timestamp')).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
