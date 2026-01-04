import { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  List, 
  Calendar, 
  Wallet, 
  Settings, 
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Trophy,
  ChevronRight
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-sm text-foreground">Hyper Bets</h1>
          <p className="text-xs text-muted-foreground">Gestão de Apostas</p>
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Principal
        </p>
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                  activeItem === item.label
                    ? "bg-primary/5 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {activeItem === item.label && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  "w-5 h-5",
                  activeItem === item.label ? "text-foreground" : "text-muted-foreground"
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {activeItem === item.label && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-border">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                  activeItem === item.label
                    ? "bg-primary/5 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {activeItem === item.label && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  "w-5 h-5",
                  activeItem === item.label ? "text-foreground" : "text-muted-foreground"
                )} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">JB</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium truncate text-foreground">João Bets</p>
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[8px] text-primary-foreground">✓</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground truncate">joao@email.com</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}
