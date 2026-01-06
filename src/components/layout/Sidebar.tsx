import { 
  LayoutDashboard, 
  TrendingUp, 
  List, 
  Wallet,
  Building2,
  Settings, 
  HelpCircle,
  ChevronUp,
  ChevronRight,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', path: '/' },
  { icon: TrendingUp, label: 'Estatísticas', path: '/estatisticas' },
  { icon: List, label: 'Entradas', path: '/entradas' },
  { icon: Wallet, label: 'Banca', path: '/banca' },
  { icon: Building2, label: 'Saldos', path: '/saldos' },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  { icon: HelpCircle, label: 'Suporte', path: '/suporte' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { displayName, getInitials } = useProfile();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-border">
        <div className="w-10 h-10 overflow-hidden flex-shrink-0 rounded-lg">
          <img src={logo} alt="Hyper Bets Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-sm text-foreground">Hyper Bets</h1>
          <p className="text-xs text-muted-foreground">Bem-vindo de volta! 🎯</p>
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Principal
        </p>
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                    isActive
                      ? "bg-primary/5 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-border">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                    isActive
                      ? "bg-primary/5 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-border">
        <div 
          className="flex items-center gap-3 px-2 cursor-pointer hover:bg-muted/50 rounded-lg py-2 transition-colors"
          onClick={() => navigate('/configuracoes')}
        >
          <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium truncate text-foreground">
                {displayName || user?.email?.split('@')[0] || 'Usuário'}
              </p>
              {displayName && (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}