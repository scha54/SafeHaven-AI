import React from 'react';
import {
  LayoutDashboard,
  Flame,
  MapPin,
  Navigation as NavIcon,
  PackageCheck,
  Megaphone,
  FileCheck2,
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, incidents, routes, alerts } = useDisaster();

  const criticalIncidentsCount = incidents.filter(
    (i) => i.severity === 'Critical' && i.status !== 'Resolved'
  ).length;
  const pendingRoutesCount = routes.filter((r) => r.status === 'Proposed').length;
  const draftAlertsCount = alerts.filter((a) => a.status === 'Draft').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'incidents',
      label: 'Incident Intelligence',
      icon: Flame,
      badge: criticalIncidentsCount > 0 ? `${criticalIncidentsCount} Crit` : null,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    {
      id: 'map',
      label: 'Live Disaster Map',
      icon: MapPin,
      badge: null,
    },
    {
      id: 'routing',
      label: 'Rescue & Evacuation',
      icon: NavIcon,
      badge: pendingRoutesCount > 0 ? `${pendingRoutesCount} Pending` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'resources',
      label: 'Relief Resources',
      icon: PackageCheck,
      badge: null,
    },
    {
      id: 'alerts',
      label: 'Alerts & Comms',
      icon: Megaphone,
      badge: draftAlertsCount > 0 ? `${draftAlertsCount} Draft` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'audit',
      label: 'Data & AI Audit',
      icon: FileCheck2,
      badge: null,
    },
  ];

  return (
    <nav className="bg-[#0D1527] border-b border-slate-800/80 px-4 lg:px-6 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 py-1.5 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                }`}
              />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold border ${
                    item.badgeColor || 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
