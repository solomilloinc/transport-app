'use client';

import type React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building,
  Bus,
  Calendar,
  ChevronDown,
  CreditCard,
  LogOut,
  MapPin,
  Settings,
  User,
  UserCheck,
  Users,
  Wrench,
  Home,
  LayoutDashboard,
} from 'lucide-react';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Suspense, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import { logoutFromBackend } from '@/services/auth-client';

// Tipo para items del menú
interface MenuItemType {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
  key?: string;
  submenu?: { name: string; path: string; roles: string[] }[];
}

// Configuración de menú centralizada
const MENU_CONFIG: {
  main: MenuItemType[];
  config: MenuItemType[];
  customer: MenuItemType[];
} = {
  main: [
    {
      name: 'Reservas',
      icon: Calendar,
      path: '/admin/reserves',
      roles: ['admin', 'user'],
    },
    {
      name: 'Clientes',
      icon: Users,
      path: '/admin/passengers',
      key: 'passengers',
      roles: ['admin', 'user'],
      submenu: [
        { name: 'Lista', path: '/admin/passengers/list', roles: ['admin', 'user'] },
        { name: 'Deudas', path: '/admin/passengers/debts', roles: ['admin', 'user'] },
      ],
    },
    {
      name: 'Servicios',
      icon: Wrench,
      path: '/admin/services',
      roles: ['admin'],
    },
    {
      name: 'Choferes',
      icon: User,
      path: '/admin/drivers',
      roles: ['admin'],
    },
  ],
  config: [
    {
      name: 'Usuarios',
      icon: Settings,
      path: '/usuarios',
      roles: ['admin'],
    },
    {
      name: 'Ciudades',
      icon: Building,
      path: '/admin/cities',
      roles: ['admin'],
    },
    {
      name: 'Direcciones',
      icon: MapPin,
      path: '/admin/directions',
      roles: ['admin'],
    },
    {
      name: 'Vehículos',
      icon: Bus,
      path: '/admin/vehicles',
      key: 'vehicles',
      roles: ['admin'],
      submenu: [
        { name: 'Coches', path: '/admin/vehicles', roles: ['admin'] },
        { name: 'Tipos', path: '/admin/vehicles/types', roles: ['admin'] },
      ],
    },
    {
      name: 'Precios',
      icon: CreditCard,
      path: '/admin/prices',
      roles: ['admin'],
    },
  ],
  customer: [
    {
      name: 'Mis Datos',
      icon: UserCheck,
      path: '/passengers/profile',
      roles: ['cliente'],
    },
    {
      name: 'Mis Reservas',
      icon: Calendar,
      path: '/passengers/bookings',
      roles: ['cliente'],
    },
  ],
};

// Componente para renderizar items del menú
function MenuItem({ 
  item, 
  pathname, 
  userRole, 
  isExpanded, 
  onToggle 
}: { 
  item: MenuItemType; 
  pathname: string; 
  userRole: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isActive = item.submenu 
    ? pathname.startsWith(item.path) 
    : pathname === item.path;

  if (item.submenu && item.key) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.name}
          isActive={isActive}
          onClick={onToggle}
          className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950"
        >
          <item.icon className="h-4 w-4" />
          <span className="font-medium">{item.name}</span>
          <ChevronDown
            className={cn(
              'ml-auto h-4 w-4 shrink-0 transition-transform duration-300',
              isExpanded && 'rotate-180'
            )}
          />
        </SidebarMenuButton>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <SidebarMenuSub>
            {item.submenu
              ?.filter((subItem) => subItem.roles?.includes(userRole))
              .map((subItem) => (
                <SidebarMenuSubItem key={subItem.path}>
                  <SidebarMenuSubButton 
                    asChild 
                    isActive={pathname === subItem.path}
                    className="transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950"
                  >
                    <Link href={subItem.path}>{subItem.name}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
          </SidebarMenuSub>
        </div>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isActive} 
        tooltip={item.name}
        className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950"
      >
        <Link href={item.path}>
          <item.icon className="h-4 w-4" />
          <span className="font-medium">{item.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: session } = useSession();
  
  const userRole = (session?.user as any)?.[
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
  ]?.toLowerCase();

  const userName = session?.user?.name || 'Usuario';
  const userEmail = session?.user?.email || '';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      // Primero revocar el refresh token en el backend
      await logoutFromBackend();
      // Luego cerrar la sesión de NextAuth
      await signOut({ callbackUrl: '/', redirect: true });
    } catch (error) {
      console.error('Error durante logout:', error);
      // Aún así intentar cerrar la sesión local
      await signOut({ callbackUrl: '/', redirect: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filtrar menús por rol
  const filteredMainMenu = useMemo(() => 
    MENU_CONFIG.main.filter((item) => item.roles?.includes(userRole)),
    [userRole]
  );

  const filteredConfigMenu = useMemo(() => 
    MENU_CONFIG.config.filter((item) => item.roles?.includes(userRole)),
    [userRole]
  );

  const filteredCustomerMenu = useMemo(() => 
    MENU_CONFIG.customer.filter((item) => item.roles?.includes(userRole)),
    [userRole]
  );

  const isCustomerView = userRole === 'cliente';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SidebarComponent className="border-r border-sidebar-border bg-slate-50 dark:bg-slate-900">
          {/* Header mejorado */}
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <Link href="/" className="font-bold text-lg text-foreground hover:text-blue-600 transition-colors">
                  ZerosTour
                </Link>
                <span className="text-xs text-muted-foreground">
                  {isCustomerView ? 'Portal Cliente' : 'Panel Admin'}
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2">
            {/* Menú Principal */}
            {(filteredMainMenu.length > 0 || filteredCustomerMenu.length > 0) && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  {isCustomerView ? 'Mi Cuenta' : 'Principal'}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {(isCustomerView ? filteredCustomerMenu : filteredMainMenu).map((item) => (
                      <MenuItem
                        key={item.path}
                        item={item}
                        pathname={pathname}
                        userRole={userRole}
                        isExpanded={item.key ? expandedMenus[item.key] || false : false}
                        onToggle={() => item.key && toggleMenu(item.key)}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Menú de Configuración (solo admin) */}
            {filteredConfigMenu.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  Configuración
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredConfigMenu.map((item) => (
                      <MenuItem
                        key={item.path}
                        item={item}
                        pathname={pathname}
                        userRole={userRole}
                        isExpanded={item.key ? expandedMenus[item.key] || false : false}
                        onToggle={() => item.key && toggleMenu(item.key)}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          {/* Footer con info de usuario */}
          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              {/* Info del usuario */}
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-2 py-3">
                  <Avatar className="h-9 w-9 border-2 border-blue-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{userName}</span>
                    <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
                  </div>
                </div>
              </SidebarMenuItem>
              
              <Separator className="my-1" />
              
              {/* Link a inicio */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ir al inicio">
                  <Link href="/" className="text-muted-foreground hover:text-foreground">
                    <Home className="h-4 w-4" />
                    <span>Ir al inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {/* Cerrar sesión */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  tooltip="Cerrar sesión"
                  disabled={isLoggingOut}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          {/* Rail para resize */}
          <SidebarRail />
        </SidebarComponent>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header simplificado */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h1 className="text-sm font-medium">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h1>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">
            <Suspense>{children}</Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
