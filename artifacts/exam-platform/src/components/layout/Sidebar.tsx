import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, BookOpen, BarChart3, Users, FileText,
  TrendingUp, Library, Building2, Settings, ChevronLeft,
  ChevronRight, GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Available Exams', href: '/student/exams', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'My Results', href: '/student/results', icon: <BarChart3 className="w-5 h-5" /> },
];

const facultyNav: NavItem[] = [
  { label: 'Dashboard', href: '/faculty/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'My Exams', href: '/faculty/exams/list', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Problem Sets', href: '/faculty/exams/exam001/questions', icon: <Library className="w-5 h-5" /> },
  { label: 'Students', href: '/faculty/students', icon: <Users className="w-5 h-5" /> },
  { label: 'Reports', href: '/faculty/reports', icon: <FileText className="w-5 h-5" /> },
  { label: 'Analytics', href: '/faculty/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'User Management', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Departments', href: '/admin/departments', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar() {
  const { role, user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = role === 'student' ? studentNav : role === 'faculty' ? facultyNav : role === 'admin' ? adminNav : [];

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-sidebar-border', collapsed && 'justify-center px-3')}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-sidebar-foreground tracking-tight">ExamPro</span>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/50 truncate">{user.department}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed((c) => !c)}
          data-testid="button-sidebar-toggle"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent text-sm transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
