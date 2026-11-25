import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { Brand } from "../admin/ui";
import LoginForm from "./LoginForm";
import "../admin/west.css";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="west west-login">
      <aside className="west-login-aside">
        <Brand />
        <div className="west-login-art" aria-hidden="true">
          <div className="west-art-card west-art-card-top">Aa</div>
          <div className="west-art-card west-art-card-bottom">Great job!</div>
          <div className="west-art-person"><i /><b /></div>
          <span className="west-art-hello">Hello!</span>
        </div>
        <div>
          <p className="west-eyebrow">WEST Admin Portal</p>
          <h2>Empowering English learning, every day.</h2>
          <p>Kelola program, pendaftaran, dan perjalanan belajar siswa dalam satu tempat.</p>
        </div>
      </aside>
      <section className="west-login-panel">
        <div>
          <p className="west-eyebrow">Admin Dashboard</p>
          <h1>Welcome Back!</h1>
          <p className="west-muted">Login ke WEST Admin Dashboard untuk melanjutkan.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
