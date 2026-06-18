export type AppRole = "admin" | "user" | "client" | "superadmin";

const ROLE_MAP: Record<string, AppRole> = {
  admin: "admin",
  administrador: "admin",
  user: "user",
  operator: "user",
  operativo: "user",
  client: "client",
  cliente: "client",
  superadmin: "superadmin",
};

export function normalizeRole(role?: string | null): AppRole | null {
  if (!role) {
    return null;
  }

  return ROLE_MAP[role.trim().toLowerCase()] ?? null;
}

export function isAdminRole(role?: AppRole | null): boolean {
  return role === "admin" || role === "superadmin";
}
