import { getSessionUser } from "@/server/auth";
import { isSetupComplete } from "@/server/settings";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/gracze", label: "Gracze", icon: "Users" },
  { href: "/admin/zamowienia", label: "Zamówienia", icon: "ShoppingCart" },
  { href: "/admin/produkty", label: "Produkty", icon: "Package" },
  { href: "/admin/kategorie", label: "Kategorie", icon: "FolderTree" },
  { href: "/admin/tryby", label: "Tryby", icon: "Gamepad2" },
  { href: "/admin/tickety", label: "Tickety", icon: "Ticket" },
  { href: "/admin/nagrody", label: "Nagrody", icon: "Gift" },
  { href: "/admin/media", label: "Media", icon: "Youtube" },
  { href: "/admin/serwery", label: "Serwery", icon: "Server" },
  { href: "/admin/discord", label: "Discord", icon: "MessageCircle" },
  { href: "/admin/kody", label: "Kody rabatowe", icon: "TicketPercent" },
  { href: "/admin/logi", label: "Logi", icon: "ScrollText" },
  { href: "/admin/ustawienia", label: "Ustawienia", icon: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isSetupComplete())) redirect("/setup");
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "OWNER") redirect("/");

  return <AdminShell nav={NAV} user={user}>{children}</AdminShell>;
}
