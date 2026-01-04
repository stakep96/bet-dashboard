import { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  List, 
  Calendar, 
  Wallet, 
  Settings, 
  HelpCircle,
  ChevronDown,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', active: true },
  { icon: TrendingUp, label: 'Estatísticas' },
  { icon: List, label: 'Entradas' },
  { icon: Calendar, label: 'Calendário' },
  { icon: Wallet, label: 'Banca' },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Configurações' },
  { icon: HelpCircle, label: 'Suporte' },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState('Visão Geral');

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-base">Hyper Bets</h1>
          <p className="text-xs text-sidebar-foreground/60">Gestão de Apostas</p>
        </div>
        <ChevronDown className="w-4 h-4 ml-auto text-sidebar-foreground/40" />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6">
        <p className="text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider mb-4 px-2">
          Principal
        </p>
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeItem === item.label
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {activeItem === item.label && (
                  <div className="ml-auto w-1.5 h-5 bg-primary rounded-full" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeItem === item.label
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">JB</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">João Bets</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">joao@email.com</p>
          </div>
          <ChevronDown className="w-4 h-4 text-sidebar-foreground/40" />
        </div>
      </div>
    </aside>
  );
}
