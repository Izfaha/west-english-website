import { requireAdmin } from "@/lib/admin-auth";
import { logout } from "../login/actions";
import { Brand } from "./ui";
import { CurrentPage, Navigation } from "./Navigation";
import "./west.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const name = admin.name;
  return (
    <div className="west west-admin">
      <aside className="west-sidebar">
        <Brand />
        <p className="west-eyebrow">Menu Utama</p>
        <Navigation />
        <div className="west-sidebar-bottom">
          <div className="west-learning"><b>WEST Learning Center</b><small>Kelola pembelajaran lebih mudah.</small></div>
          <form action={logout}><button className="west-logout">↪ &nbsp; Logout</button></form>
        </div>
      </aside>
      <div className="west-admin-main">
        <header className="west-topbar">
          <strong><CurrentPage /></strong>
          <div className="west-profile"><span aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span><div><b>{name}</b><small>Admin</small></div></div>
        </header>
        <main className="west-content">{children}</main>
      </div>
    </div>
  );
}
