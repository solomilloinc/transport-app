'use client';

import type React from 'react';

import { usePathname, useRouter } from 'next/navigation';
import {
  Building,
  Bus,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LogOut,
  LogOutIcon,
  MapPin,
  Menu,
  Settings,
  User,
  UserCheck,
  UserIcon,
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
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense, useState } from 'react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.[
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
  ]?.toLowerCase();

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };
  const menuItems = [
    {
      name: 'Reservas',
      icon: Calendar,
      path: '/admin/reserves',
      roles: ['admin', 'user'],
    },
    {
      name: 'Pasajeros',
      icon: Users,
      path: '/admin/passengers',
      key: 'passengers',
      roles: ['admin', 'user'],
      submenu: [
        { name: 'Lista', path: '/admin/passengers/list', roles: ['admin', 'user'] },
        { name: 'Deudas', path: '/admin/passengers/deudas', roles: ['admin', 'user'] },
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
      key: 'directions',
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
        {
          name: 'Tipos',
          path: '/admin/vehicles/types',
          roles: ['admin'],
        },
      ],
    },
    {
      name: 'Precios',
      icon: CreditCard,
      path: '/admin/prices',
      roles: ['admin'],
    },
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
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/', redirect: true });
    router.push('/');
  };

  // Check if user is logged in
  //   useEffect(() => {
  //     const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  //     const userRole = localStorage.getItem("userRole");

  //     if (!isLoggedIn || userRole !== "admin") {
  //       router.push("/");
  //     }
  //   }, [router]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SidebarComponent>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <Link href="/" className="font-bold text-xl text-blue-500">
                ZerosTour
              </Link>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems
                    .filter((item) => item.roles?.includes(userRole))
                    .map((item) => {
                      const isActive = item.submenu ? pathname.startsWith(item.path) : pathname === item.path;

                      // If the item has a submenu
                      if (item.submenu && item.key) {
                        const isExpanded = expandedMenus[item.key] || false;

                        return (
                          <SidebarMenuItem key={item.path}>
                            <div className="w-full">
                              <SidebarMenuButton
                                tooltip={item.name}
                                isActive={isActive}
                                onClick={() => toggleMenu(item.key!)}
                              >
                                <item.icon />
                                <span>{item.name}</span>
                                <ChevronDown
                                  className={cn(
                                    'ml-auto h-4 w-4 shrink-0 transition-transform duration-200',
                                    isExpanded && 'rotate-180'
                                  )}
                                />
                              </SidebarMenuButton>

                              {isExpanded && (
                                <SidebarMenuSub>
                                  {item.submenu
                                    ?.filter((subItem) => subItem.roles?.includes(userRole))
                                    .map((subItem) => (
                                      <SidebarMenuSubItem key={subItem.path}>
                                        <SidebarMenuSubButton asChild isActive={pathname === subItem.path}>
                                          <Link href={subItem.path}>{subItem.name}</Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                              )}
                            </div>
                          </SidebarMenuItem>
                        );
                      }

                      // Regular menu item without submenu
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                            <Link href={item.path}>
                              <item.icon />
                              <span>{item.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOutIcon />
                  <span>Cerrar sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </SidebarComponent>
        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b bg-background">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <div className="hidden md:block text-sm">
                  <p className="font-medium">Bienvenido, Usuario Admin</p>
                  <p className="text-muted-foreground">Hoy es {new Date().toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-[120px] justify-end">
                <Button variant="outline" size="sm">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Usuario Admin
                </Button>
              </div>
            </div>
          </header>
          <main className="p-4 md:p-6 w-full">
            <Suspense>{children}</Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
