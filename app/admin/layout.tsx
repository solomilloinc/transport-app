'use client';

import type React from 'react';
import { usePathname } from 'next/navigation';
import {
  Building,
  Bus,
  Calendar,
  ChevronDown,
  CreditCard,
  Home,
  LogOut,
  MapPin,
  Route,
  Settings,
  User,
  UserCheck,
  Users,
  Wrench,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Suspense, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import { logoutFromBackend } from '@/services/auth-client';
import { useTenant } from '@/contexts/TenantContext';
import Image from 'next/image';

interface MenuItemType {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
  key?: string;
  submenu?: { name: string; path: string; roles: string[] }[];
}

const MENU_CONFIG: {
  main: MenuItemType[];
  config: MenuItemType[];
  customer: MenuItemType[];
} = {
  main: [
    { name: 'Reservas', icon: Calendar, path: '/admin/reserves', roles: ['admin', 'user'] },
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
    { name: 'Servicios', icon: Wrench, path: '/admin/services', roles: ['admin'] },
    { name: 'Choferes', icon: User, path: '/admin/drivers', roles: ['admin'] },
  ],
  config: [
    { name: 'Usuarios', icon: Settings, path: '/usuarios', roles: ['admin'] },
    { name: 'Ciudades', icon: Building, path: '/admin/cities', roles: ['admin'] },
    { name: 'Direcciones', icon: MapPin, path: '/admin/directions', roles: ['admin'] },
    {
      name: 'Vehiculos',
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
      name: 'Rutas',
      icon: Route,
      path: '/admin/trips',
      key: 'trips',
      roles: ['admin'],
      submenu: [
        { name: 'Gestion', path: '/admin/trips', roles: ['admin'] },
        { name: 'Precios masivos', path: '/admin/trips/prices/bulk-update', roles: ['admin'] },
      ],
    },
    { name: 'Precios', icon: CreditCard, path: '/admin/prices', roles: ['admin'] },
  ],
  customer: [
    { name: 'Mis Datos', icon: UserCheck, path: '/passengers/profile', roles: ['cliente'] },
    { name: 'Mis Reservas', icon: Calendar, path: '/passengers/bookings', roles: ['cliente'] },
  ],
};

function MenuItem({
  item,
  pathname,
  userRole,
  isExpanded,
  onToggle,
}: {
  item: MenuItemType;
  pathname: string;
  userRole: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isActive = item.submenu ? pathname.startsWith(item.path) : pathname === item.path;

  if (item.submenu && item.key) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.name}
          isActive={isActive}
          onClick={onToggle}
          className="rounded-2xl px-3 py-2 text-slate-700 transition-all duration-200 hover:bg-white hover:text-slate-950"
        >
          <item.icon className="h-4 w-4" />
          <span className="font-medium">{item.name}</span>
          <ChevronDown className={cn('ml-auto h-4 w-4 shrink-0 transition-transform duration-300', isExpanded && 'rotate-180')} />
        </SidebarMenuButton>

        <div className={cn('overflow-hidden transition-all duration-300 ease-in-out', isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0')}>
          <SidebarMenuSub className="ml-3 border-l border-black/6 pl-3">
            {item.submenu
              ?.filter((subItem) => subItem.roles?.includes(userRole))
              .map((subItem) => (
                <SidebarMenuSubItem key={subItem.path}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.path}
                    className="rounded-xl text-slate-600 transition-colors hover:bg-white hover:text-slate-950"
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
        className="rounded-2xl px-3 py-2 text-slate-700 transition-all duration-200 hover:bg-white hover:text-slate-950"
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
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: session } = useSession();
  const { identity } = useTenant();

  const userRole = (session?.user as any)?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();
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
      await logoutFromBackend();
      await signOut({ callbackUrl: '/', redirect: true });
    } catch {
      await signOut({ callbackUrl: '/', redirect: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const filteredMainMenu = useMemo(() => MENU_CONFIG.main.filter((item) => item.roles?.includes(userRole)), [userRole]);
  const filteredConfigMenu = useMemo(() => MENU_CONFIG.config.filter((item) => item.roles?.includes(userRole)), [userRole]);
  const filteredCustomerMenu = useMemo(() => MENU_CONFIG.customer.filter((item) => item.roles?.includes(userRole)), [userRole]);
  const isCustomerView = userRole === 'cliente';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[linear-gradient(180deg,#eef1eb,#e4ebe4)] text-slate-900">
        <SidebarComponent className="border-r border-black/6 bg-[linear-gradient(180deg,#f6f6f1,#edf1ea)]">
          <SidebarHeader className="border-b border-black/6">
            <div className="px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#182b1f,#35533f)] shadow-[0_16px_30px_rgba(24,43,31,0.16)]">
                  {identity.logoUrl ? (
                    <Image src={identity.logoUrl} alt={identity.companyName} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <Bus className="h-5 w-5 text-emerald-100" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link href="/" className="font-display text-xl text-slate-950 transition-colors hover:text-slate-700">
                    {identity.companyNameShort}
                  </Link>
                  <p className="truncate text-xs uppercase tracking-[0.28em] text-slate-500">
                    {isCustomerView ? 'portal cliente' : 'consola operativa'}
                  </p>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            {(filteredMainMenu.length > 0 || filteredCustomerMenu.length > 0) && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  {isCustomerView ? 'mi cuenta' : 'operacion'}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
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

            {filteredConfigMenu.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  administracion
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
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

          <SidebarFooter className="border-t border-black/6">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="m-3 rounded-[1.25rem] border border-black/6 bg-white/72 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-black/6">
                      <AvatarFallback className="bg-[linear-gradient(135deg,#182b1f,#35533f)] text-sm font-medium text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{userName}</span>
                      <span className="block truncate text-xs text-slate-500">{userEmail}</span>
                    </div>
                  </div>
                </div>
              </SidebarMenuItem>

              <Separator className="my-1 bg-black/6" />

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ir al inicio" className="rounded-2xl px-3 py-2 text-slate-600 hover:bg-white hover:text-slate-950">
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Ir al inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  tooltip="Cerrar sesion"
                  disabled={isLoggingOut}
                  className="rounded-2xl px-3 py-2 text-red-700 hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesion'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </SidebarComponent>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-black/6 bg-[rgba(244,246,239,0.9)] backdrop-blur-xl">
            <div className="flex h-16 items-center gap-4 px-5">
              <SidebarTrigger className="-ml-1 rounded-full border border-black/6 bg-white/75" />
              <Separator orientation="vertical" className="h-6 bg-black/6" />
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">operacion del dia</p>
                <h1 className="mt-1 text-sm font-medium text-slate-900">
                  {new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto max-w-[1600px]">
              <Suspense>{children}</Suspense>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
