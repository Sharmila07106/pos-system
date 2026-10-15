import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileText,
  Download,
  Building2,
  Users,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Reports() {
  const { accentColor } = useOutletContext() || {};
  const [downloading, setDownloading] = useState({});

  const reports = [
    {
      id: 'summary',
      title: 'Executive Multi-Tenant Platform Summary',
      description:
        'Comprehensive multi-page operational summary covering supermarket registrations, tenant operational status, compliance approvals, and core KPI metrics.',
      endpoint: '/platform/reports/summary.pdf',
      filename: 'StoreFlow_Platform_Executive_Summary.pdf',
      icon: FileCheck,
      color: 'bg-[#12A58B]/10 text-[#12A58B] border-[#12A58B]/30',
      badge: 'Executive Summary',
    },
    {
      id: 'stores',
      title: 'Registered Supermarkets & Tenancy Directory',
      description:
        'Full operational roster of all approved and pending supermarkets, tenant IDs, store codes, city distribution, and contact details.',
      endpoint: '/platform/reports/stores.pdf',
      filename: 'StoreFlow_Supermarkets_Roster.pdf',
      icon: Building2,
      color: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
      badge: 'Stores & Tenancy',
    },
    {
      id: 'staff',
      title: 'Staff Access & Role Permissions Report',
      description:
        'Compliance roster listing all supermarket personnel, store assignment, designated roles (Store Admin, Cashier), and active status.',
      endpoint: '/platform/reports/staff.pdf',
      filename: 'StoreFlow_Staff_Access_Report.pdf',
      icon: Users,
      color: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30',
      badge: 'Staff & Roles',
    },
    {
      id: 'complaints',
      title: 'Supermarket Complaints & Ticket Resolutions',
      description:
        'Formal incident report detailing all support tickets raised by supermarkets, resolution timeliness, priority categorizations, and actions taken.',
      endpoint: '/platform/reports/complaints.pdf',
      filename: 'StoreFlow_Complaints_Report.pdf',
      icon: AlertTriangle,
      color: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
      badge: 'Support & Issues',
    },
  ];

  const handleDownload = async (report) => {
    try {
      setDownloading((prev) => ({ ...prev, [report.id]: true }));
      toast.loading(`Generating ${report.title}...`, { id: report.id });

      const response = await api.get(report.endpoint, {
        responseType: 'blob',
      });

      // Create blob download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = report.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`${report.title} downloaded successfully!`, { id: report.id });
    } catch (err) {
      console.error(`Failed to download ${report.title}:`, err);
      toast.error(`Failed to generate ${report.title}. Please check server logs.`, {
        id: report.id,
      });
    } finally {
      setDownloading((prev) => ({ ...prev, [report.id]: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3A] tracking-tight">
            Platform Reports & PDF Downloads
          </h2>
          <p className="text-xs sm:text-sm text-[#53607A] font-medium mt-0.5">
            Download certified PDF documents compiled in real time from live MongoDB tenant databases.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const isBusy = downloading[report.id];

          return (
            <div
              key={report.id}
              className="bg-white rounded-2xl p-6 border border-[#E3E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${report.color}`}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F8FAFC] text-[#53607A] border border-[#CBD5E1]">
                    {report.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-base sm:text-lg text-[#0B1B3A]">
                  {report.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#53607A] leading-relaxed mt-2">
                  {report.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider">
                  Format: PDF &bull; Live Data
                </span>

                <button
                  onClick={() => handleDownload(report)}
                  disabled={isBusy}
                  style={{ backgroundColor: accentColor || '#0FA38F' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isBusy ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
