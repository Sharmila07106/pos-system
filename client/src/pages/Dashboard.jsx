import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, AlertTriangle, IndianRupee, ShoppingBag, Coins, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, delay, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
  >
    <GlassCard tilt className="p-6 h-full border-t-2" style={{ borderTopColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-text-color">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${color}20`, color }}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trend}
        </div>
      )}
    </GlassCard>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <GlassCard className="!p-3 border border-border-color shadow-2xl">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="font-bold text-cyan-400 text-lg">₹{payload[0].value.toFixed(2)}</p>
      </GlassCard>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin"></div>
      </div>
    );
  }

  // Ensure 7 days of data for the chart even if API returns less
  const defaultChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      name: d.toISOString().split('T')[0],
      revenue: 0
    };
  });

  const chartData = stats?.chartData?.length > 0 ? stats.chartData : defaultChartData;

  return (
    <div className="space-y-8 pb-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black text-text-color tracking-tight">Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Welcome back, {user?.name || 'Admin'}. Here's what's happening today.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Today's Revenue" 
          value={`₹${stats?.todayRevenue?.toFixed(2) || '0.00'}`} 
          icon={IndianRupee} 
          color="#0FA38F" 
          delay={0.1} 
        />
        <StatCard 
          title="Bills Today" 
          value={stats?.todaySalesCount || 0} 
          icon={TrendingUp} 
          color="#0284C7" 
          delay={0.15} 
        />
        <StatCard 
          title="Items Sold" 
          value={stats?.itemsSold || 0} 
          icon={ShoppingBag} 
          color="#8B5CF6" 
          delay={0.2} 
        />
        <StatCard 
          title="Low Stock" 
          value={stats?.lowStockCount || 0} 
          icon={AlertTriangle} 
          color="#F97316" 
          delay={0.25} 
        />
        <StatCard 
          title="Stock Value" 
          value={`₹${stats?.stockValue?.toFixed(2) || '0.00'}`} 
          icon={Coins} 
          color="#10B981" 
          delay={0.3} 
        />
      </div>

      {/* Store Admin Quick Management Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/products" className="group p-4 bg-white rounded-xl border border-[#E3E8F0] hover:border-[#0FA38F] hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center font-bold">
              <Package size={20} />
            </div>
            <div>
              <div className="font-bold text-[#0B1B3A] group-hover:text-[#0FA38F] text-sm">Product Catalogue</div>
              <div className="text-xs text-[#53607A]">View, add & update stock</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#8B96AB] group-hover:text-[#0FA38F] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link to="/sales" className="group p-4 bg-white rounded-xl border border-[#E3E8F0] hover:border-[#0284C7] hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="font-bold text-[#0B1B3A] group-hover:text-[#0284C7] text-sm">Sales History & Reports</div>
              <div className="text-xs text-[#53607A]">Filtered transactions & audits</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#8B96AB] group-hover:text-[#0284C7] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link to="/users" className="group p-4 bg-white rounded-xl border border-[#E3E8F0] hover:border-[#7C3AED] hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <div className="font-bold text-[#0B1B3A] group-hover:text-[#7C3AED] text-sm">Staff Management</div>
              <div className="text-xs text-[#53607A]">Cashiers & Quota controls</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#8B96AB] group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full h-[400px]"
      >
        <GlassCard className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-bold mb-6">Revenue - Last 7 Days</h2>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => {
                    const [, month, day] = val.split('-');
                    return `${month}/${day}`;
                  }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00e5ff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Dashboard;
