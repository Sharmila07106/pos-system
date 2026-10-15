import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  MapPin,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import api from '../../services/api';

const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
      <div>
        <h3 className="text-sm font-extrabold text-[#0B1B3A] tracking-tight">{title}</h3>
        <p className="text-[11px] text-[#55607A] mt-0.5">{subtitle}</p>
      </div>
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-[#0B1B3A]/5 text-[#0B1B3A] flex items-center justify-center">
          <Icon size={16} />
        </div>
      )}
    </div>
    <div className="h-64 w-full flex items-center justify-center">{children}</div>
  </div>
);

const EmptyChart = ({ message = 'No data yet this month' }) => (
  <div className="flex flex-col items-center justify-center text-[#55607A] space-y-2 py-8">
    <div className="w-10 h-10 rounded-full bg-[#F4F7FB] flex items-center justify-center text-[#CBD5E1]">
      <Inbox size={20} />
    </div>
    <span className="text-xs font-semibold">{message}</span>
  </div>
);

export default function Overview() {
  const { refreshCounter, accentColor } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    pendingApplications: 0,
    systemHealth: 'OPERATIONAL',
    platformVersion: '2.0.0',
  });

  // Current month label (Asia/Kolkata)
  const [monthName, setMonthName] = useState(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  });

  // Chart datasets
  const [appsTrend, setAppsTrend] = useState([]);
  const [statusData, setStatusData] = useState({ breakdown: {}, chartData: [], total: 0 });
  const [storesGrowth, setStoresGrowth] = useState([]);
  const [complaintsData, setComplaintsData] = useState({ breakdown: {}, chartData: [], total: 0 });
  const [storesByCity, setStoresByCity] = useState([]);
  const [recentApps, setRecentApps] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        trendRes,
        statusRes,
        growthRes,
        compRes,
        cityRes,
        appsRes,
      ] = await Promise.allSettled([
        api.get('/platform/stats'),
        api.get('/platform/analytics/applications-trend'),
        api.get('/platform/analytics/status-breakdown'),
        api.get('/platform/analytics/stores-growth'),
        api.get('/platform/analytics/complaints-summary'),
        api.get('/platform/analytics/stores-by-city'),
        api.get('/platform/applications?limit=5'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data) {
        setStats(statsRes.value.data.data);
      }
      if (trendRes.status === 'fulfilled' && trendRes.value?.data) {
        if (trendRes.value.data.monthName) setMonthName(trendRes.value.data.monthName);
        setAppsTrend(trendRes.value.data.data || []);
      }
      if (statusRes.status === 'fulfilled' && statusRes.value?.data) {
        setStatusData(statusRes.value.data.data || { breakdown: {}, chartData: [], total: 0 });
      }
      if (growthRes.status === 'fulfilled' && growthRes.value?.data) {
        setStoresGrowth(growthRes.value.data.data || []);
      }
      if (compRes.status === 'fulfilled' && compRes.value?.data) {
        setComplaintsData(compRes.value.data.data || { breakdown: {}, chartData: [], total: 0 });
      }
      if (cityRes.status === 'fulfilled' && cityRes.value?.data) {
        setStoresByCity(cityRes.value.data.data || []);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value?.data?.data) {
        setRecentApps(appsRes.value.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load overview analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshCounter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Supermarkets */}
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#55607A] uppercase tracking-wider">
              Total Supermarkets
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1B3A] mt-1 tabular-nums">
              {stats.totalStores || 0}
            </div>
            <p className="text-[11px] text-[#12A58B] font-semibold mt-1">
              Approved Supermarkets
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0B1B3A]/5 text-[#0B1B3A] flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
        </div>

        {/* Card 2: Active Operational */}
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#55607A] uppercase tracking-wider">
              Active Operational
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#12A58B] mt-1 tabular-nums">
              {stats.activeStores || 0}
            </div>
            <p className="text-[11px] text-[#55607A] font-semibold mt-1">Live POS registers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#12A58B]/10 text-[#12A58B] flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#55607A] uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#F59E0B] mt-1 tabular-nums">
              {stats.pendingApplications || 0}
            </div>
            <p className="text-[11px] text-[#55607A] font-semibold mt-1">Awaiting review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
        </div>

        {/* Card 4: System Health */}
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#55607A] uppercase tracking-wider">
              System Health
            </span>
            <div className="text-lg font-black text-[#10B981] mt-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              {stats.systemHealth || 'OPERATIONAL'}
            </div>
            <p className="text-[11px] text-[#55607A] font-semibold mt-1">
              API v{stats.platformVersion || '2.0.0'} &bull; Operational
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
        </div>
      </div>

      {/* 5 REAL-TIME CHARTS GRID (CURRENT MONTH SCOPED) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Applications This Month */}
        <ChartCard
          title="Applications This Month"
          subtitle={`Submissions in ${monthName}`}
          icon={TrendingUp}
        >
          {appsTrend.length > 0 && appsTrend.some((d) => d.applications > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={appsTrend} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor || '#12A58B'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={accentColor || '#12A58B'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#55607A' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#55607A' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1B3A',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke={accentColor || '#12A58B'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#appGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No data yet this month" />
          )}
        </ChartCard>

        {/* Chart 2: Application Status Breakdown (This Month) */}
        <ChartCard
          title="Application Status Breakdown"
          subtitle={`Submissions in ${monthName} by status`}
          icon={PieIcon}
        >
          {statusData.chartData && statusData.chartData.length > 0 && statusData.total > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.chartData}
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1B3A',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-7">
                <span className="text-2xl font-black text-[#0B1B3A]">{statusData.total}</span>
                <span className="text-[10px] font-bold text-[#55607A] uppercase tracking-wider">
                  Total Apps
                </span>
              </div>
            </div>
          ) : (
            <EmptyChart message="No data yet this month" />
          )}
        </ChartCard>

        {/* Chart 3: Registered Stores Growth (This Month) */}
        <ChartCard
          title="Registered Stores Growth"
          subtitle={`Stores approved in ${monthName}, cumulative per day`}
          icon={BarChart3}
        >
          {storesGrowth.length > 0 && storesGrowth.some((d) => d.totalStores > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storesGrowth} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#55607A' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#55607A' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1B3A',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="totalStores"
                  name="Approved Stores"
                  fill={accentColor || '#12A58B'}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No data yet this month" />
          )}
        </ChartCard>

        {/* Chart 4: Complaints & Tickets Desk (This Month) */}
        <ChartCard
          title="Complaints & Tickets Desk"
          subtitle={`Complaints raised in ${monthName} by status`}
          icon={AlertCircle}
        >
          {complaintsData.chartData && complaintsData.chartData.length > 0 && complaintsData.total > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintsData.chartData}
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {complaintsData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1B3A',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-7">
                <span className="text-2xl font-black text-[#0B1B3A]">{complaintsData.total}</span>
                <span className="text-[10px] font-bold text-[#55607A] uppercase tracking-wider">
                  Tickets
                </span>
              </div>
            </div>
          ) : (
            <EmptyChart message="No data yet this month" />
          )}
        </ChartCard>
      </div>

      {/* Chart 5: Top Cities by Supermarket Count (Real Data Only) */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-extrabold text-[#0B1B3A] tracking-tight">
              Top Cities
            </h3>
            <p className="text-[11px] text-[#55607A] mt-0.5">
              Approved supermarkets by location (real data only)
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#0B1B3A]/5 text-[#0B1B3A] flex items-center justify-center">
            <MapPin size={16} />
          </div>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {storesByCity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={storesByCity}
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#55607A' }} />
                <YAxis dataKey="city" type="category" tick={{ fontSize: 11, fill: '#0F1B33', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1B3A',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="stores"
                  name="Approved Stores"
                  fill="#0B1B3A"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No data yet this month" />
          )}
        </div>
      </div>

      {/* RECENT APPLICATIONS TABLE */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-extrabold text-[#0B1B3A] tracking-tight">
              Recent Supermarket Applications
            </h3>
            <p className="text-[11px] text-[#55607A] mt-0.5">
              Newly submitted store onboarding requests
            </p>
          </div>
          <Link
            to="/platform-admin/applications"
            className="text-xs font-bold text-[#12A58B] hover:text-[#0E8C76] flex items-center gap-1 transition-colors"
          >
            <span>View All Applications</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentApps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#55607A] font-bold border-b border-[#E5EAF1]">
                <tr>
                  <th className="py-2.5 px-3">App ID</th>
                  <th className="py-2.5 px-3">Business Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {recentApps.map((app) => (
                  <tr key={app._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0B1B3A]">
                      {app.applicationId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#0B1B3A]">
                      {app.businessName}
                    </td>
                    <td className="py-2.5 px-3 text-[#55607A]">{app.ownerName}</td>
                    <td className="py-2.5 px-3 text-[#55607A]">{app.city}</td>
                    <td className="py-2.5 px-3 text-[#55607A]">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          app.status === 'APPROVED'
                            ? 'bg-[#E2F6F3] text-[#12A58B]'
                            : app.status === 'REJECTED'
                            ? 'bg-[#FEE2E2] text-[#EF4444]'
                            : app.status === 'CHANGES_REQUESTED'
                            ? 'bg-[#EFF6FF] text-[#3B82F6]'
                            : 'bg-[#FEF3C7] text-[#D97706]'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyChart message="No applications found" />
        )}
      </div>
    </div>
  );
}
