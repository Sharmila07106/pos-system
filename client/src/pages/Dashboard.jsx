import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, AlertTriangle, IndianRupee } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
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
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-emerald-500 font-medium flex items-center"><TrendingUp size={14} className="mr-1" /> +12%</span>
        <span className="text-slate-500">vs last week</span>
      </div>
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
          <p className="text-slate-500 font-medium mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value={`₹${stats?.todayRevenue?.toFixed(2) || '0.00'}`} 
          icon={IndianRupee} 
          color="#00e5ff" 
          delay={0.1} 
        />
        <StatCard 
          title="Sales Count" 
          value={stats?.todaySalesCount || 0} 
          icon={TrendingUp} 
          color="#8b5cf6" 
          delay={0.2} 
        />
        <StatCard 
          title="Total Products" 
          value="35" // Hardcoded for demo, normally from API
          icon={Package} 
          color="#3b82f6" 
          delay={0.3} 
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats?.lowStockCount || 0} 
          icon={AlertTriangle} 
          color="#f97316" 
          delay={0.4} 
        />
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
