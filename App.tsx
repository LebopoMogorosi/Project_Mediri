import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, CloudUpload, FileText,
  Heart, HelpCircle, LayoutDashboard, MapPin, Menu, MoreHorizontal, Package,
  Pill, Plus, Search, Settings, ShieldCheck, Sparkles, Stethoscope, TrendingUp,
  Truck, Users,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  assignDelivery, listDeliveries, listDeliveryAgents, listPrescriptions, signIn,
  updateDeliveryStatus, updatePrescriptionNotes, updatePrescriptionStatus, uploadPrescription,
  type DeliveryRecord, type PrescriptionRecord,
} from './api'
import { Button } from './components/ui/button'
import './App.css'

type Role = 'Patient' | 'Doctor' | 'Pharmacist' | 'Delivery Agent' | 'Administrator'
const roles: Role[] = ['Patient', 'Doctor', 'Pharmacist', 'Delivery Agent', 'Administrator']
const demoEmails: Record<Role, string> = {
  Patient: 'patient@mediri.co.bw',
  Doctor: 'doctor@mediri.co.bw',
  Pharmacist: 'pharmacist@mediri.co.bw',
  'Delivery Agent': 'delivery@mediri.co.bw',
  Administrator: 'admin@mediri.co.bw',
}
const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const reminderDateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const navItems = [
  { label: 'Overview', path: '/app', icon: LayoutDashboard },
  { label: 'Prescriptions', path: '/prescriptions', icon: FileText },
  { label: 'Track delivery', path: '/tracking', icon: Truck },
  { label: 'Reminders', path: '/reminders', icon: Clock3 },
  { label: 'Research analytics', path: '/research', icon: Activity },
]
const monthly = [
  { month: 'Jan', deliveries: 185, users: 120 }, { month: 'Feb', deliveries: 220, users: 155 },
  { month: 'Mar', deliveries: 198, users: 195 }, { month: 'Apr', deliveries: 275, users: 240 },
  { month: 'May', deliveries: 310, users: 285 }, { month: 'Jun', deliveries: 295, users: 325 },
  { month: 'Jul', deliveries: 360, users: 370 }, { month: 'Aug', deliveries: 390, users: 420 },
  { month: 'Sep', deliveries: 420, users: 475 }, { month: 'Oct', deliveries: 468, users: 530 },
  { month: 'Nov', deliveries: 505, users: 590 }, { month: 'Dec', deliveries: 560, users: 650 },
]
const cities = [
  { name: 'Gaborone', value: 42, color: '#24895e' }, { name: 'Francistown', value: 24, color: '#2c9cb4' },
  { name: 'Maun', value: 16, color: '#7b86e7' }, { name: 'Palapye', value: 11, color: '#e6a75b' },
  { name: 'Molepolole', value: 7, color: '#e48793' },
]
const patients = [
  { name: 'Kagiso M.', initials: 'KM', drug: 'Metformin 500mg', status: 'Ready for pickup', color: 'green' },
  { name: 'Naledi T.', initials: 'NT', drug: 'Amoxicillin 250mg', status: 'Pending review', color: 'amber' },
  { name: 'Thato K.', initials: 'TK', drug: 'Amlodipine 5mg', status: 'Out for delivery', color: 'blue' },
]

function App() {
  const [role, setRole] = useState<Role>(() => roles.find((item) => item === localStorage.getItem('mediri-role')) ?? 'Patient')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [orders, setOrders] = useState(patients)
  const toast = useCallback((message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }, [])
  return <BrowserRouter><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/landing" element={<Landing />} />
    <Route path="/login" element={<Login onLogin={setRole} />} />
    <Route path="*" element={<Workspace role={role} setRole={setRole} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} orders={orders} setOrders={setOrders} toast={toast} />} />
  </Routes>{notice && <div className="toast"><CheckCircle2 size={18} />{notice}</div>}</BrowserRouter>
}

function Workspace({ role, setRole, mobileOpen, setMobileOpen, orders, setOrders, toast }: {
  role: Role; setRole: (role: Role) => void; mobileOpen: boolean; setMobileOpen: (open: boolean) => void
  orders: typeof patients; setOrders: (orders: typeof patients) => void; toast: (message: string) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = navItems.find((item) => item.path === location.pathname)?.label ?? 'Overview'
  const subtitle = location.pathname === '/research' ? 'Insights that make care more accessible.' : 'Here’s what’s happening with your care today.'
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Heart size={21} fill="currentColor" /></div><span>mediri</span><span className="brand-dot">.</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="role-picker">
        <div className="role-avatar"><Stethoscope size={17} /></div>
        <div className="role-copy"><strong>{role} portal</strong><span>MEDIRI Botswana</span></div>
        <ChevronDown size={15} />
        <select aria-label="Switch demo role" value={role} onChange={async (event) => { const nextRole = event.target.value as Role; try { const user = await signIn(demoEmails[nextRole], 'Password123'); setRole(user.role as Role) } catch (error) { toast(error instanceof Error ? error.message : 'Unable to switch demo role.') } }}>
          {roles.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="workspace-label nav-label">MENU</div>
      <nav className="side-nav">{navItems.map(({ label, path, icon: Icon }) =>
        <NavLink key={path} to={path} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Prescriptions' && <span className="nav-count">4</span>}
        </NavLink>)}
      </nav>
      <div className="sidebar-promo">
        <div className="promo-icon"><Sparkles size={16} /></div><strong>Care that comes to you.</strong>
        <p>Good health should never be out of reach.</p><button onClick={() => toast('Your care team is here to help.')}>Get support <ArrowRight size={14} /></button>
      </div>
      <div className="sidebar-bottom">
        <button className="plain-nav" onClick={() => toast('Settings are coming soon.')}><Settings size={17} /> Settings</button>
        <button className="plain-nav" onClick={() => toast('Help centre opened.')}><HelpCircle size={17} /> Help centre</button>
        <div className="user-profile"><div className="profile-photo">BM</div><div><strong>Boitumelo M.</strong><span>{role}</span></div><MoreHorizontal size={18} /></div>
      </div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <main className="main-panel">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
        <div className="breadcrumbs">Workspace <ChevronRight size={14} /> <strong>{title}</strong></div>
        <div className="topbar-actions"><div className="date-chip"><CalendarDays size={15} />{todayLabel}</div>
          <button className="icon-button search-button" aria-label="Search" onClick={() => toast('Search is ready for your care records.')}><Search size={18} /></button>
          <button className="icon-button notification-button" aria-label="Notifications" onClick={() => toast('You’re all caught up on notifications.')}><Bell size={18} /><i /></button>
          <div className="top-avatar">BM</div>
        </div>
      </header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">{role.toUpperCase()} DASHBOARD</div><h1>{location.pathname === '/research' ? 'Research analytics' : location.pathname === '/prescriptions' ? 'Prescriptions' : location.pathname === '/tracking' ? 'Track your delivery' : location.pathname === '/reminders' ? 'Medication reminders' : role === 'Administrator' ? 'Platform overview' : role === 'Doctor' ? 'Good morning, Dr. Keneilwe' : role === 'Delivery Agent' ? 'Your delivery route' : 'Good morning, Boitumelo'} <span className="heading-wave">✳</span></h1><p>{subtitle}</p></div>
          <Button onClick={() => navigate('/prescriptions')}><Plus size={17} /> New prescription</Button>
        </div>
        <Routes>
          <Route path="/app" element={<Dashboard role={role} toast={toast} />} />
          <Route path="/research" element={<Research />} />
          <Route path="/prescriptions" element={<Prescriptions toast={toast} />} />
          <Route path="/tracking" element={<Tracking orders={orders} setOrders={setOrders} toast={toast} />} />
          <Route path="/reminders" element={<Reminders toast={toast} />} />
          <Route path="*" element={<Dashboard role={role} toast={toast} />} />
        </Routes>
        <footer className="page-footer"><span>© 2024 Mediri Health Technologies</span><span><span className="live-dot" /> All systems operational <span className="footer-divider">·</span> Botswana</span></footer>
      </div>
    </main>
  </div>
}

function StatCard({ title, value, detail, trend, icon: Icon, tint = 'mint' }: { title: string; value: string; detail: string; trend: string; icon: typeof Activity; tint?: string }) {
  return <div className="stat-card"><div className="stat-top"><span>{title}</span><div className={`stat-icon ${tint}`}><Icon size={17} /></div></div><div className="stat-value">{value}</div><div className="stat-foot"><span className="trend"><ArrowUpRight size={13} />{trend}</span><span>{detail}</span></div></div>
}

function Dashboard({ role, toast }: { role: Role; toast: (message: string) => void }) {
  if (role === 'Administrator') return <AdminDashboard />
  const isAdmin = role === 'Pharmacist'
  const stats = role === 'Doctor' ? [
    { title: 'Pending prescriptions', value: '18', detail: 'Awaiting clinical review', trend: '+6 this week', icon: FileText },
    { title: 'Patients under care', value: '42', detail: 'Across your care team', trend: '+4 this month', icon: Users, tint: 'blue' },
    { title: 'Recent reviews', value: '06', detail: 'Completed today', trend: 'On schedule', icon: CheckCircle2, tint: 'violet' },
    { title: 'Patient satisfaction', value: '98.4%', detail: 'Care team feedback', trend: '+4.2%', icon: Heart, tint: 'orange' },
  ] : role === 'Pharmacist' ? [
    { title: 'Pending reviews', value: '24', detail: 'Awaiting pharmacy review', trend: '+8 today', icon: FileText },
    { title: 'Approved orders', value: '86', detail: 'Ready to prepare', trend: '+12.8%', icon: CheckCircle2, tint: 'blue' },
    { title: 'Medication inventory', value: '1,284', detail: 'Units across pharmacy', trend: '94% in stock', icon: Pill, tint: 'violet' },
    { title: 'Deliveries today', value: '16', detail: 'Across 5 service areas', trend: 'On track', icon: Truck, tint: 'orange' },
  ] : role === 'Delivery Agent' ? [
    { title: 'Assigned deliveries', value: '12', detail: 'Assigned to your route', trend: 'On route', icon: Package },
    { title: 'Completed deliveries', value: '86', detail: 'This month', trend: '+8 this month', icon: CheckCircle2, tint: 'blue' },
    { title: 'Pending deliveries', value: '04', detail: 'Awaiting acceptance', trend: 'Ready to accept', icon: Truck, tint: 'violet' },
    { title: 'Delivery success', value: '98.4%', detail: 'On-time handovers', trend: '+4.2%', icon: Activity, tint: 'orange' },
  ] : [
    { title: 'Active prescriptions', value: '03', detail: 'vs. last month', trend: '+12.8%', icon: Package },
    { title: 'Ready for collection', value: '01', detail: 'Across 3 pharmacies', trend: '+2 new', icon: CheckCircle2, tint: 'blue' },
    { title: 'Deliveries in transit', value: '02', detail: 'On their way to you', trend: 'On track', icon: Truck, tint: 'violet' },
    { title: 'Care score', value: '98.4%', detail: 'Service satisfaction', trend: '+4.2%', icon: Heart, tint: 'orange' },
  ]
  return <>
    <section className="welcome-banner">
      <div className="welcome-text"><div className="welcome-kicker"><span className="pulse-dot" /> YOUR HEALTH, IN GOOD HANDS</div><h2>{isAdmin ? 'Care in motion.' : 'Your wellness, made simpler.'}</h2><p>{isAdmin ? 'A clearer view of the care your team is delivering.' : 'Your medication journey, thoughtfully taken care of.'}</p><button className="welcome-action" onClick={() => toast('Your care overview is up to date.')}>Explore your care <ArrowRight size={15} /></button></div>
      <div className="welcome-illustration"><div className="illustration-orbit orbit-one" /><div className="illustration-orbit orbit-two" /><div className="illustration-cross"><Plus size={38} strokeWidth={2.4} /></div><div className="floating-pill"><Pill size={25} /></div><div className="floating-shield"><ShieldCheck size={25} /></div><div className="floating-heart"><Heart size={21} fill="currentColor" /></div></div>
    </section>
    <section className="stats-grid">{stats.map((stat) => <StatCard key={stat.title} {...stat} />)}</section>
    {role !== 'Patient' && <OperationsWorklist role={role} toast={toast} />}
    <section className="content-grid overview-grid">
      <div className="panel delivery-panel"><PanelHeading title="Delivery overview" subtitle="Your medication journey at a glance" action="View all" onAction={() => window.location.assign('/tracking')} />
        <div className="delivery-active"><div className="pharmacy-avatar"><Pill size={21} /></div><div className="delivery-info"><div className="delivery-title">Prescription #MD-2048 <span className="status-pill status-transit">In transit</span></div><div className="delivery-sub">Metformin · Life Pharmacy, Gaborone</div><div className="delivery-progress"><span /></div><div className="delivery-route"><span>Pharmacy</span><span>Arriving in 18 min</span><span>Your home</span></div></div><button className="round-arrow" aria-label="Track delivery" onClick={() => window.location.assign('/tracking')}><ArrowRight size={17} /></button></div>
        <div className="delivery-map"><div className="map-road road-a" /><div className="map-road road-b" /><div className="map-road road-c" /><div className="map-road road-d" /><div className="map-area-label">GABORONE, BOTSWANA</div><div className="map-route-line" /><div className="map-marker marker-start"><Pill size={13} /></div><div className="map-marker marker-end"><MapPin size={16} /></div><div className="courier-dot"><Truck size={15} /></div><div className="map-chip"><span className="live-dot" /> Courier is nearby <ChevronRight size={14} /></div></div>
      </div>
      <div className="panel activity-panel"><PanelHeading title="Recent activity" subtitle="The latest from your care team" action="See all" onAction={() => toast('Showing all recent activity.')} />
        <div className="activity-list"><ActivityItem icon={Check} color="mint" title="Prescription approved" text="Metformin 500mg · Life Pharmacy" time="Today, 9:42 AM" /><ActivityItem icon={Truck} color="blue" title="Order is on its way" text="Courier: Kabelo · 18 min away" time="Today, 9:18 AM" /><ActivityItem icon={FileText} color="violet" title="New prescription uploaded" text="Dr. Motsumi · 2 items" time="Yesterday, 3:26 PM" /><ActivityItem icon={Clock3} color="orange" title="Time for your medication" text="Metformin 500mg · Morning dose" time="Yesterday, 8:00 AM" /></div>
      </div>
    </section>
    <section className="content-grid lower-grid">
      <div className="panel chart-panel"><PanelHeading title="Your care, over time" subtitle="Prescription activity this year" action="This year⌄" onAction={() => toast('Showing this year’s activity.')} />
        <div className="chart-legend"><span><i className="legend-dot mint-dot" /> Prescriptions</span><span><i className="legend-dot teal-dot" /> Deliveries</span></div>
        <ResponsiveContainer width="100%" height={205}><AreaChart data={monthly} margin={{ left: -22, right: 3, top: 10, bottom: 0 }}><defs><linearGradient id="mintFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#36a475" stopOpacity={0.18} /><stop offset="100%" stopColor="#36a475" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ef" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9aa8a0', fontSize: 11 }} dy={9} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#a3aea8', fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e9efeb', fontSize: 12 }} /><Area type="monotone" dataKey="deliveries" stroke="#32956c" strokeWidth={2.5} fill="url(#mintFill)" /><Line type="monotone" dataKey="users" stroke="#6cb6c1" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer>
      </div>
      <div className="panel reminders-panel"><PanelHeading title="Medication reminders" subtitle="Your daily wellness routine" action="View schedule" onAction={() => window.location.assign('/reminders')} />
        <div className="reminder-list"><ReminderCompact title="Morning medication" detail="Metformin · 08:00 AM" state="Taken" tone="done" /><ReminderCompact title="Afternoon medication" detail="Vitamin D · 01:00 PM" state="Upcoming" tone="upcoming" /><ReminderCompact title="Evening medication" detail="Amlodipine · 08:00 PM" state="Upcoming" tone="upcoming" /></div><button className="text-link" onClick={() => window.location.assign('/reminders')}>Manage reminders <ArrowRight size={14} /></button>
      </div>
    </section>
  </>
}

function OperationsWorklist({ role, toast }: { role: Role; toast: (message: string) => void }) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([])
  const [agents, setAgents] = useState<{ user_id: number; name: string; availability: string }[]>([])
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState<number | null>(null)
  const isAgent = role === 'Delivery Agent'
  const isPharmacist = role === 'Pharmacist'
  const queuePrescriptions = prescriptions.filter((prescription) => isPharmacist ? ['Pending Review', 'Approved'].includes(prescription.status) : prescription.status === 'Pending Review').slice(0, 6)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (isAgent) {
          const results = await listDeliveries()
          if (active) setDeliveries(results)
        } else {
          const results = await listPrescriptions()
          if (active) setPrescriptions(results)
          if (isPharmacist) {
            const [deliveryResults, agentResults] = await Promise.all([listDeliveries(), listDeliveryAgents()])
            if (active) { setDeliveries(deliveryResults); setAgents(agentResults) }
          }
        }
      } catch (error) {
        if (active) toast(error instanceof Error ? error.message : 'Unable to load the work queue.')
      }
    }
    void load()
    return () => { active = false }
  }, [isAgent, isPharmacist, role, refresh, toast])

  const changePrescription = async (prescription: PrescriptionRecord, status: string) => {
    const notes = status === 'Rejected' || status === 'Approved' ? window.prompt(`Review notes for ${prescription.medication}:`, prescription.notes ?? '') : undefined
    if (notes === null) return
    setBusy(prescription.id)
    try {
      await updatePrescriptionStatus(prescription.id, status, notes)
      toast(`${prescription.medication}: ${status.toLowerCase()}.`)
      setRefresh((value) => value + 1)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Prescription update failed.')
    } finally {
      setBusy(null)
    }
  }
  const addPrescriptionNote = async (prescription: PrescriptionRecord) => {
    const notes = window.prompt(`Review notes for ${prescription.medication}:`, prescription.notes ?? '')
    if (notes === null) return
    setBusy(prescription.id)
    try {
      await updatePrescriptionNotes(prescription.id, notes)
      toast(`Notes saved for ${prescription.medication}.`)
      setRefresh((value) => value + 1)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save the prescription notes.')
    } finally {
      setBusy(null)
    }
  }
  const changeDelivery = async (delivery: DeliveryRecord, status: string) => {
    setBusy(delivery.id)
    try {
      await updateDeliveryStatus(delivery.id, status)
      toast(`Delivery ${delivery.tracking_code}: ${status.toLowerCase()}.`)
      setRefresh((value) => value + 1)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Delivery update failed.')
    } finally {
      setBusy(null)
    }
  }
  const assignAgent = async (delivery: DeliveryRecord, agentId: number) => {
    setBusy(delivery.id)
    try {
      await assignDelivery(delivery.id, agentId)
      toast(`Delivery ${delivery.tracking_code} assigned.`)
      setRefresh((value) => value + 1)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not assign the delivery.')
    } finally {
      setBusy(null)
    }
  }

  if (isAgent) return <div className="panel worklist-panel"><PanelHeading title="My assigned deliveries" subtitle="Accept a delivery and keep its status up to date." /><div className="worklist">{deliveries.map((delivery) => <div className="worklist-row" key={delivery.id}><div className="worklist-icon blue"><Truck size={16} /></div><div className="worklist-copy"><strong>{delivery.medication} · {delivery.patient_name}</strong><span>{delivery.tracking_code} · {delivery.city} · {delivery.status}</span></div><div className="worklist-actions">{delivery.status === 'Pending' && delivery.order_status === 'Medication Prepared' && <button className="mini-action" disabled={busy === delivery.id} onClick={() => void changeDelivery(delivery, 'Accepted')}>Accept</button>}{delivery.status === 'Pending' && delivery.order_status !== 'Medication Prepared' && <span className="waiting-label">Waiting for pharmacy</span>}{delivery.status === 'Accepted' && <button className="mini-action" disabled={busy === delivery.id} onClick={() => void changeDelivery(delivery, 'Out for Delivery')}>Out for delivery</button>}{delivery.status === 'Out for Delivery' && <button className="mini-action" disabled={busy === delivery.id} onClick={() => void changeDelivery(delivery, 'Delivered')}>Mark delivered</button>}</div></div>)}{deliveries.length === 0 && <p className="empty-state">No assigned deliveries are waiting for action.</p>}</div></div>

  return <div className="content-grid worklist-grid">
    <div className="panel worklist-panel"><PanelHeading title={role === 'Doctor' ? 'Prescription review queue' : 'Pharmacy review queue'} subtitle={role === 'Doctor' ? 'Review prescriptions submitted for your clinical approval.' : 'Approve requests, prepare medication and leave pharmacist notes.'} />
    <div className="worklist">{queuePrescriptions.map((prescription) => <div className="worklist-row" key={prescription.id}><div className="worklist-icon mint"><FileText size={16} /></div><div className="worklist-copy"><strong>{prescription.medication} · {prescription.patient_name}</strong><span>{prescription.pharmacy_name ?? 'Pharmacy pending'} · {prescription.status}</span></div><div className="worklist-actions">{role === 'Doctor' && <button className="mini-action subtle" disabled={busy === prescription.id} onClick={() => toast(`Verified ${prescription.medication} for review.`)}>Verify</button>}{prescription.status === 'Pending Review' && <button className="mini-action" disabled={busy === prescription.id} onClick={() => void changePrescription(prescription, 'Approved')}>Approve</button>}{prescription.status === 'Pending Review' && <button className="mini-action reject" disabled={busy === prescription.id} onClick={() => void changePrescription(prescription, 'Rejected')}>Reject</button>}{isPharmacist && prescription.status === 'Approved' && <button className="mini-action subtle" disabled={busy === prescription.id} onClick={() => void changePrescription(prescription, 'Medication Prepared')}>Prepare</button>}{role === 'Doctor' && <button className="mini-action subtle" disabled={busy === prescription.id} onClick={() => void addPrescriptionNote(prescription)}>Add notes</button>}</div></div>)}{queuePrescriptions.length === 0 && <p className="empty-state">No prescriptions are waiting for review.</p>}</div>
    </div>
    {isPharmacist && <div className="panel worklist-panel"><PanelHeading title="Assign a delivery" subtitle="Send prepared orders to an available delivery partner." /><div className="worklist">{deliveries.filter((delivery) => delivery.status === 'Pending' && delivery.order_status === 'Medication Prepared').slice(0, 5).map((delivery) => <div className="worklist-row assign-row" key={delivery.id}><div className="worklist-icon violet"><Truck size={16} /></div><div className="worklist-copy"><strong>{delivery.medication} · {delivery.patient_name}</strong><span>{delivery.tracking_code} · {delivery.city}</span></div><select aria-label={`Agent for ${delivery.tracking_code}`} disabled={busy === delivery.id} onChange={(event) => { if (event.target.value) void assignAgent(delivery, Number(event.target.value)) }} defaultValue=""><option value="">Assign agent</option>{agents.filter((agent) => agent.availability === 'Available').map((agent) => <option value={agent.user_id} key={agent.user_id}>{agent.name}</option>)}</select></div>)}{deliveries.filter((delivery) => delivery.status === 'Pending' && delivery.order_status === 'Medication Prepared').length === 0 && <p className="empty-state">No prepared orders are waiting for an agent.</p>}</div></div>}
  </div>
}

function AdminDashboard() {
  const medicationDemand = [
    { name: 'Metformin', requests: 184 }, { name: 'Amlodipine', requests: 152 },
    { name: 'Amoxicillin', requests: 138 }, { name: 'Vitamin D', requests: 116 },
    { name: 'Atorvastatin', requests: 94 },
  ]
  const urbanRural = [{ name: 'Urban', value: 68, color: '#2b9163' }, { name: 'Rural', value: 32, color: '#77bb9a' }]
  return <>
    <section className="admin-welcome"><div><span className="eyebrow">MEDIRI BOTSWANA · PLATFORM HEALTH</span><h2>Care, moving forward.</h2><p>A live-inspired snapshot of prescription access and delivery operations.</p></div><div className="admin-period"><CalendarDays size={15} /> Last 12 months <ChevronDown size={14} /></div></section>
    <section className="admin-stat-grid">
      <StatCard title="Total users" value="100" detail="Across 5 cities" trend="+18.6%" icon={Users} />
      <StatCard title="Total prescriptions" value="200" detail="Seeded demo dataset" trend="+24.2%" icon={FileText} tint="blue" />
      <StatCard title="Completed deliveries" value="114" detail="Out of 150 deliveries" trend="+16.4%" icon={CheckCircle2} tint="violet" />
      <StatCard title="Revenue simulation" value="BWP 38.3k" detail="Estimated gross value" trend="+12.8%" icon={TrendingUp} tint="orange" />
      <StatCard title="Active pharmacies" value="06" detail="Across 5 cities" trend="+2 this qtr" icon={Plus} />
      <StatCard title="Delivery success rate" value="76.0%" detail="Completed / total deliveries" trend="+5.1%" icon={Activity} tint="blue" />
    </section>
    <section className="content-grid admin-charts">
      <div className="panel admin-chart-panel"><PanelHeading title="Monthly delivery requests" subtitle="Request volume alongside new-user growth" action="2025 · Full year" /><div className="chart-legend"><span><i className="legend-dot mint-dot" /> Deliveries</span><span><i className="legend-dot teal-dot" /> New users</span></div><ResponsiveContainer width="100%" height={220}><AreaChart data={monthly} margin={{ left: -22, right: 6, top: 14, bottom: 0 }}><defs><linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#32956c" stopOpacity={0.18} /><stop offset="100%" stopColor="#32956c" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ef" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9aa8a0', fontSize: 10 }} dy={8} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#a3aea8', fontSize: 9 }} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e9efeb', fontSize: 11 }} /><Area type="monotone" dataKey="deliveries" stroke="#32956c" strokeWidth={2.3} fill="url(#adminFill)" /><Line type="monotone" dataKey="users" stroke="#68b4c1" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div>
      <div className="panel admin-chart-panel"><PanelHeading title="Top requested medications" subtitle="Most prescribed in the demo dataset" /><ResponsiveContainer width="100%" height={250}><BarChart data={medicationDemand} layout="vertical" margin={{ left: 4, right: 20, top: 12, bottom: 2 }}><CartesianGrid horizontal={false} stroke="#edf1ef" /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={84} tickLine={false} axisLine={false} tick={{ fill: '#738278', fontSize: 9 }} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e9efeb', fontSize: 11 }} /><Bar dataKey="requests" fill="#48a277" radius={[0, 5, 5, 0]} barSize={13} /></BarChart></ResponsiveContainer></div>
    </section>
    <section className="content-grid admin-bottom">
      <div className="panel admin-chart-panel"><PanelHeading title="Urban vs. rural requests" subtitle="Medication delivery demand by location type" /><div className="geo-content admin-geo"><div className="geo-donut"><ResponsiveContainer width="100%" height={170}><PieChart><Pie data={urbanRural} dataKey="value" nameKey="name" innerRadius={49} outerRadius={70} paddingAngle={4} stroke="none">{urbanRural.map((area) => <Cell key={area.name} fill={area.color} />)}</Pie><Tooltip formatter={(value) => [`${value}%`, 'Requests']} /></PieChart></ResponsiveContainer><div className="donut-label"><strong>100%</strong><span>Requests</span></div></div><div className="city-list">{urbanRural.map((area) => <div className="city-row" key={area.name}><i style={{ background: area.color }} /><span>{area.name} areas</span><strong>{area.value}%</strong></div>)}<p className="rural-insight">Rural communities represent nearly one-third of requests — an opportunity to extend access.</p></div></div></div>
      <div className="panel activity-panel"><PanelHeading title="Operations pulse" subtitle="A snapshot of the care pipeline" /><div className="activity-list"><ActivityItem icon={Users} color="mint" title="100 registered users" text="Patients, clinicians and delivery partners" time="5 Botswana cities" /><ActivityItem icon={FileText} color="blue" title="200 prescriptions recorded" text="Across 12 months of sample analytics" time="Seeded research dataset" /><ActivityItem icon={Truck} color="violet" title="114 deliveries completed" text="76% completion across 150 requests" time="End-to-end tracking enabled" /></div></div>
    </section>
  </>
}

function PanelHeading({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="panel-heading"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <button className="panel-action" onClick={onAction}>{action} <ChevronRight size={14} /></button>}</div>
}
function ActivityItem({ icon: Icon, color, title, text, time }: { icon: typeof Activity; color: string; title: string; text: string; time: string }) {
  return <div className="activity-item"><div className={`activity-icon ${color}`}><Icon size={15} /></div><div className="activity-copy"><strong>{title}</strong><span>{text}</span><small>{time}</small></div></div>
}
function ReminderCompact({ title, detail, state, tone }: { title: string; detail: string; state: string; tone: string }) {
  return <div className="reminder-row"><div className={`reminder-check ${tone}`}>{tone === 'done' ? <Check size={13} /> : <Clock3 size={13} />}</div><div className="reminder-copy"><strong>{title}</strong><span>{detail}</span></div><span className={`reminder-state ${tone}`}>{state}</span></div>
}

function Research() {
  const segments = [{ name: 'Elderly patients', percent: 36, icon: '👵', color: '#26895e' }, { name: 'Working professionals', percent: 42, icon: '🧑‍💼', color: '#5b9db3' }, { name: 'Chronic care patients', percent: 22, icon: '💚', color: '#8983d3' }]
  const demand = useMemo(() => cities.map((city) => ({ ...city, count: Math.round(city.value * 6.1) })), [])
  return <>
    <div className="research-intro"><div className="research-intro-icon"><Activity size={20} /></div><div><strong>MEDIRI Botswana · Research overview</strong><p>Population health insights and medication access trends across Botswana.</p></div><span className="updated-tag"><span className="live-dot" /> Updated today</span></div>
    <section className="stats-grid research-stats"><StatCard title="Registered users" value="8,642" detail="Across 5 districts" trend="+18.6%" icon={Users} /><StatCard title="Adoption rate" value="64.8%" detail="Digital prescription use" trend="+6.2%" icon={TrendingUp} tint="blue" /><StatCard title="Patient retention" value="81.2%" detail="Returning users · 90 days" trend="+3.8%" icon={Heart} tint="violet" /><StatCard title="Active pharmacies" value="34" detail="Across Botswana" trend="+4 this qtr" icon={Plus} tint="orange" /></section>
    <section className="content-grid research-grid">
      <div className="panel research-chart-panel"><PanelHeading title="Adoption & delivery growth" subtitle="Monthly platform adoption and delivery requests" action="Last 12 months⌄" />
        <div className="chart-legend"><span><i className="legend-dot mint-dot" /> Delivery requests</span><span><i className="legend-dot teal-dot" /> New users</span></div>
        <ResponsiveContainer width="100%" height={255}><AreaChart data={monthly} margin={{ left: -22, right: 6, top: 12, bottom: 0 }}><defs><linearGradient id="researchFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#32956c" stopOpacity={0.2} /><stop offset="100%" stopColor="#32956c" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ef" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9aa8a0', fontSize: 11 }} dy={8} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#a3aea8', fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e9efeb', fontSize: 12 }} /><Area type="monotone" dataKey="deliveries" stroke="#32956c" strokeWidth={2.5} fill="url(#researchFill)" /><Line type="monotone" dataKey="users" stroke="#68b4c1" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div>
      <div className="panel prediction-panel"><PanelHeading title="Demand prediction" subtitle="AI-powered forecast · next 30 days" /><div className="prediction-card"><div className="prediction-top"><span className="prediction-badge"><Sparkles size={13} /> FORECAST</span><span className="confidence">94% confidence</span></div><div className="prediction-value">78%<small>+8.4%</small></div><strong>Predicted adoption rate</strong><p>Based on current registration and engagement trends.</p><div className="prediction-rule" /><div className="prediction-value smaller">420 <small>+12%</small></div><strong>Predicted monthly deliveries</strong><p>Expected delivery requests across all active areas.</p></div></div>
    </section>
    <section className="content-grid research-lower">
      <div className="panel segment-panel"><PanelHeading title="Patient segments" subtitle="User clusters based on care patterns" action="Explore segments" /><div className="segments">{segments.map((segment) => <div className="segment-row" key={segment.name}><div className="segment-emoji">{segment.icon}</div><div className="segment-copy"><div><strong>{segment.name}</strong><span>{segment.percent}%</span></div><div className="segment-track"><i style={{ width: `${segment.percent}%`, background: segment.color }} /></div></div></div>)}</div><div className="segment-note"><Sparkles size={15} /> Working professionals are the fastest growing segment <ArrowUpRight size={14} /></div></div>
      <div className="panel geo-panel"><PanelHeading title="Geographic demand" subtitle="Medication requests by city" action="View map" /><div className="geo-content"><div className="geo-donut"><ResponsiveContainer width="100%" height={166}><PieChart><Pie data={cities} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={4} stroke="none">{cities.map((city) => <Cell key={city.name} fill={city.color} />)}</Pie><Tooltip formatter={(value) => [`${value}%`, 'Demand']} /></PieChart></ResponsiveContainer><div className="donut-label"><strong>5</strong><span>Cities</span></div></div><div className="city-list">{demand.map((city) => <div className="city-row" key={city.name}><i style={{ background: city.color }} /><span>{city.name}</span><strong>{city.count}</strong></div>)}</div></div></div>
    </section>
  </>
}

function Prescriptions({ toast }: { toast: (message: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [medication, setMedication] = useState('')
  const [pharmacyId, setPharmacyId] = useState('1')
  const [address, setAddress] = useState('Plot 214, Extension 9, Gaborone')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    if (!file || !medication.trim() || !address.trim()) {
      toast('Add a prescription file, medication, and delivery address.')
      return
    }
    setSubmitting(true)
    try {
      const result = await uploadPrescription(file, Number(pharmacyId), medication.trim(), address.trim(), notes.trim())
      toast(result.message)
      setFile(null)
      setMedication('')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Prescription upload failed.')
    } finally {
      setSubmitting(false)
    }
  }
  return <div className="content-grid utility-grid">
    <div className="panel form-panel">
      <PanelHeading title="Upload a prescription" subtitle="Share a clear photo or PDF of your prescription." />
      <label className="upload-zone">
        <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <CloudUpload size={27} />
        <strong>{file?.name ?? 'Drop your prescription here'}</strong>
        <span>PNG, JPG or PDF · up to 10 MB</span>
        <button type="button" className="button button-outline">Choose file</button>
      </label>
      <label className="form-label">Medication name<input placeholder="e.g. Metformin 500mg" value={medication} onChange={(event) => setMedication(event.target.value)} /></label>
      <label className="form-label">Select pharmacy
        <select value={pharmacyId} onChange={(event) => setPharmacyId(event.target.value)}>
          <option value="1">Life Pharmacy — Gaborone</option>
          <option value="2">Wellness Pharmacy — Francistown</option>
          <option value="3">Medlane Pharmacy — Maun</option>
          <option value="4">Palapye Family Pharmacy — Palapye</option>
          <option value="5">Molepolole Community Pharmacy — Molepolole</option>
        </select>
      </label>
      <label className="form-label">Delivery address<input placeholder="Street, suburb, city" value={address} onChange={(event) => setAddress(event.target.value)} /></label>
      <label className="form-label">Notes for the pharmacist<textarea placeholder="Anything your pharmacist should know?" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <button disabled={submitting} className="button button-primary full-width" onClick={() => void submit()}><CloudUpload size={16} /> {submitting ? 'Uploading securely…' : 'Submit prescription'}</button>
    </div>
    <div className="panel prescription-list-panel">
      <PanelHeading title="Recent prescriptions" subtitle="Your prescription history" action="View history" onAction={() => toast('Prescription history loaded.')} />
      {patients.map((patient, index) => <div className="prescription-row" key={patient.initials}>
        <div className="prescription-file"><FileText size={18} /></div>
        <div className="prescription-copy"><strong>{patient.drug}</strong><span>Dr. Motsumi · {index + 3} items</span><small>Uploaded {index === 0 ? 'Today' : 'Jun ' + (18 - index)}</small></div>
        <span className={`status-pill status-${patient.color}`}>{patient.status}</span>
      </div>)}
    </div>
  </div>
}
function Tracking({ orders, setOrders, toast }: { orders: typeof patients; setOrders: (orders: typeof patients) => void; toast: (message: string) => void }) {
  const [selected, setSelected] = useState(0)
  const current = orders[selected] ?? orders[0]
  const steps = ['Pending review', 'Approved', 'Medication prepared', 'Out for delivery', 'Delivered']
  const activeStep = current.status === 'Delivered' ? 4 : current.status === 'Out for delivery' ? 3 : current.status === 'Ready for pickup' ? 2 : current.status === 'Pending review' ? 0 : 1
  return <div className="content-grid utility-grid"><div className="panel tracking-panel"><PanelHeading title="Track your medication" subtitle="Follow every step, from pharmacy to doorstep." /><div className="tracking-select"><label>SELECT AN ORDER</label><select value={selected} onChange={(event) => setSelected(Number(event.target.value))}>{orders.map((item, index) => <option key={item.initials} value={index}>MD-204{index + 8} · {item.drug}</option>)}</select></div><div className="tracking-hero"><div className="tracking-pharmacy"><div className="pharmacy-avatar"><Pill size={20} /></div><div><strong>{current.drug}</strong><span>Life Pharmacy · Gaborone</span></div><span className={`status-pill status-${current.color}`}>{current.status}</span></div><div className="timeline">{steps.map((step, index) => <div className={`timeline-step ${index <= activeStep ? 'complete' : ''} ${index === activeStep ? 'current' : ''}`} key={step}><div className="timeline-marker">{index < activeStep ? <Check size={12} /> : <span />}</div><div className="timeline-copy"><strong>{step}</strong><span>{index < activeStep ? 'Completed · ' + (9 - index) + ':15 AM' : index === activeStep ? 'In progress right now' : 'Waiting for previous step'}</span></div></div>)}</div></div><button className="button button-primary full-width" onClick={() => { const next = [...orders]; next[selected] = { ...current, status: current.status === 'Delivered' ? 'Pending review' : 'Delivered', color: 'green' }; setOrders(next); toast(current.status === 'Delivered' ? 'Order reset for demo.' : 'Delivery marked as delivered.') }}>{current.status === 'Delivered' ? 'Reset demo status' : 'Mark as delivered'} <CheckCircle2 size={16} /></button></div>
    <div className="panel delivery-detail-panel"><PanelHeading title="Delivery details" subtitle="Your courier and drop-off information" /><div className="detail-map"><div className="map-road road-a" /><div className="map-road road-b" /><div className="map-route-line" /><div className="map-marker marker-end"><MapPin size={17} /></div><div className="courier-dot"><Truck size={15} /></div><span className="map-area-label">GABORONE</span></div><div className="courier-profile"><div className="courier-avatar">KT</div><div><strong>Kabelo T.</strong><span>Mediri delivery partner · 4.9 ★</span></div><button className="button button-outline" onClick={() => toast('Calling Kabelo…')}><HelpCircle size={15} /> Contact</button></div><div className="address-block"><MapPin size={17} /><div><strong>Delivering to</strong><span>Plot 214, Extension 9<br />Gaborone, Botswana</span></div></div></div></div>
}
function Reminders({ toast }: { toast: (message: string) => void }) {
  const [enabled, setEnabled] = useState([true, true, false])
  const schedule = [{ title: 'Morning medication', time: '08:00 AM', name: 'Metformin 500mg', instruction: 'Take with breakfast', icon: '☀', color: 'morning' }, { title: 'Afternoon medication', time: '01:00 PM', name: 'Vitamin D 1000 IU', instruction: 'Take with lunch', icon: '◒', color: 'afternoon' }, { title: 'Evening medication', time: '08:00 PM', name: 'Amlodipine 5mg', instruction: 'Take after dinner', icon: '☾', color: 'evening' }]
  return <>
    <div className="reminders-overview">
      <div><span className="eyebrow">YOUR DAILY ROUTINE</span><h2>Small steps, healthier days.</h2><p>Three reminders to keep your care on track today.</p></div>
      <div className="reminder-date"><CalendarDays size={17} /> {reminderDateLabel}</div>
    </div>
    <div className="reminders-grid">{schedule.map((item, index) => <div className="panel reminder-card" key={item.title}>
      <div className={`reminder-card-icon ${item.color}`}>{item.icon}</div>
      <div className="reminder-card-top"><div><span className="eyebrow">{item.title.toUpperCase()}</span><h3>{item.time}</h3></div>
        <button className={`toggle ${enabled[index] ? 'on' : ''}`} aria-label={`Toggle ${item.title}`} onClick={() => setEnabled(enabled.map((state, i) => i === index ? !state : state))}><i /></button>
      </div>
      <div className="reminder-medication"><div className="medication-icon"><Pill size={18} /></div><div><strong>{item.name}</strong><span>{item.instruction}</span></div></div>
      <div className="reminder-card-bottom"><span className={index === 0 ? 'taken-state' : 'scheduled-state'}>{index === 0 ? <><CheckCircle2 size={14} /> Taken today</> : <><Clock3 size={14} /> {enabled[index] ? 'Reminder on' : 'Reminder off'}</>}</span><button onClick={() => toast(`${item.title} updated.`)}>Edit <ArrowRight size={14} /></button></div>
    </div>)}</div>
    <div className="panel reminder-tip"><div className="tip-icon"><Heart size={19} /></div><div><strong>A little reminder from us</strong><p>Taking your medication at the same time each day can help you build a routine that sticks.</p></div><button className="text-link" onClick={() => toast('More medication tips are on the way.')}>More wellness tips <ArrowRight size={14} /></button></div>
  </>
}

function Landing() {
  const navigate = useNavigate()
  return <div className="landing-page"><header className="landing-nav"><div className="brand"><div className="brand-mark"><Heart size={21} fill="currentColor" /></div><span>mediri</span><span className="brand-dot">.</span></div><nav><a href="#features">Features</a><a href="#how">How it works</a><a href="#benefits">Benefits</a><a href="#stories">Stories</a><a href="#contact">Contact</a></nav><div><button className="landing-login" onClick={() => navigate('/login')}>Log in</button><button className="button button-primary" onClick={() => navigate('/login')}>Get started <ArrowRight size={15} /></button></div></header><section className="landing-hero"><div className="landing-copy"><div className="welcome-kicker"><span className="pulse-dot" /> CARE, DELIVERED DIFFERENTLY</div><h1>Safe prescriptions,<br /><span>at your doorstep.</span></h1><p>Safe prescription delivery, medication tracking and trusted care — all thoughtfully brought together for you.</p><div className="landing-actions"><button className="button button-primary" onClick={() => navigate('/login')}>Get started <ArrowRight size={16} /></button><button className="landing-play" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}><span>▶</span> See how it works</button></div><div className="landing-proof"><div className="proof-avatars"><i>BM</i><i>KT</i><i>NM</i><i>+</i></div><span><strong>Trusted care, closer.</strong><br />For communities across Botswana</span></div></div><div className="landing-visual"><div className="visual-background" /><div className="visual-circle"><div className="visual-cross"><Plus size={64} /></div><div className="visual-leaf leaf-one">✦</div><div className="visual-leaf leaf-two">✿</div></div><div className="floating-card secure-card"><div className="secure-icon"><ShieldCheck size={19} /></div><div><strong>Care you can trust</strong><span>Safe & verified</span></div><CheckCircle2 size={18} className="secure-check" /></div><div className="floating-card delivery-card"><div className="delivery-mini"><Truck size={18} /></div><div><strong>Your delivery is on its way</strong><span>Arriving in 18 minutes</span></div></div><div className="hero-sparkle">✳</div></div></section><section id="features" className="landing-features"><div className="section-heading"><span className="eyebrow">CARE, MADE CONVENIENT</span><h2>Everything you need.<br />A little more peace of mind.</h2></div><div className="feature-cards"><Feature icon={CloudUpload} title="Prescriptions, simplified" body="Upload your prescription securely. We’ll take it from there." /><Feature icon={Truck} title="Delivery you can follow" body="Know exactly where your medication is, every step of the way." /><Feature icon={Heart} title="Care that remembers" body="Thoughtful reminders help keep your health routine on track." /></div></section><section id="how" className="how-section"><div className="section-heading"><span className="eyebrow">THREE SIMPLE STEPS</span><h2>From prescription to your doorstep.</h2></div><div className="how-steps"><div><b>01</b><CloudUpload /><strong>Share your prescription</strong><span>Upload a photo or digital copy in moments.</span></div><div><b>02</b><Pill /><strong>Your pharmacy gets to work</strong><span>A trusted pharmacist checks and prepares your medication.</span></div><div><b>03</b><Truck /><strong>We bring it to you</strong><span>Follow your delivery to the door, in real time.</span></div></div></section><section id="benefits" className="benefits-strip"><div><div className="benefit-icon"><ShieldCheck size={20} /></div><strong>Verified, secure care</strong><span>Prescription information is handled with care from upload to pharmacy review.</span></div><div><div className="benefit-icon"><MapPin size={20} /></div><strong>Closer to every community</strong><span>Built around Botswana’s cities, neighbourhoods and everyday needs.</span></div><div><div className="benefit-icon"><Clock3 size={20} /></div><strong>More time for what matters</strong><span>Clear status updates and reminders make staying on track feel simpler.</span></div></section><section id="stories" className="testimonial"><div className="testimonial-mark">“</div><blockquote>Finally, getting my medicine is one less thing to worry about. It just feels like someone’s looking out for me.</blockquote><div className="testimonial-by"><div className="profile-photo">BM</div><span><strong>Boitumelo M.</strong><small>Mediri patient, Gaborone</small></span></div></section><footer id="contact" className="landing-footer"><div className="brand"><div className="brand-mark"><Heart size={21} fill="currentColor" /></div><span>mediri</span><span className="brand-dot">.</span></div><span>Care that comes to you. Proudly serving Botswana.</span><a href="mailto:hello@mediri.co.bw">Contact · hello@mediri.co.bw</a><button onClick={() => navigate('/login')}>Get started <ArrowRight size={14} /></button></footer></div>
}
function Feature({ icon: Icon, title, body }: { icon: typeof Activity; title: string; body: string }) {
  return <div className="feature-card"><div className="feature-icon"><Icon size={20} /></div><h3>{title}</h3><p>{body}</p><ArrowRight size={16} className="feature-arrow" /></div>
}
function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('Patient')
  const [email, setEmail] = useState('patient@mediri.co.bw')
  const [password, setPassword] = useState('Password123')
  const [error, setError] = useState('')
  
  return <div className="login-page"><button className="login-back" onClick={() => navigate('/')}><ChevronLeft size={16} /> Back to Mediri</button><div className="login-card"><div className="brand"><div className="brand-mark"><Heart size={21} fill="currentColor" /></div><span>mediri</span><span className="brand-dot">.</span></div><div className="login-heading"><h1>Welcome back</h1><p>Sign in to continue your care journey.</p></div><label className="form-label">Demo account<select value={role} onChange={(event) => { const selected = event.target.value as Role; setRole(selected); setEmail(demoEmails[selected]) }}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label><label className="form-label">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="form-label">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="login-error">{error}</div>}<button className="button button-primary full-width" onClick={async () => { setError(''); try { const user = await signIn(email, password); onLogin(user.role as Role); navigate('/app') } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.') } }}>Sign in securely <ArrowRight size={16} /></button><div className="login-divider"><span /> DEMO ACCESS <span /></div><p className="demo-hint">Choose a role above. Demo password: <strong>Password123</strong></p><div className="login-security"><ShieldCheck size={15} /> Your health information is private and secure</div></div><span className="login-copyright">© 2024 Mediri Health Technologies · Botswana</span></div>
}

export default App
