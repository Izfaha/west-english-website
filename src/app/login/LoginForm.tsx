"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [error, submit, pending] = useActionState(login, "");
  const [visible, setVisible] = useState(false);

  return (
    <form action={submit} className="west-login-form">
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" placeholder="admin@west.id" autoComplete="username" maxLength={255} required />
      <label htmlFor="password">Kata sandi</label>
      <div className="west-password">
        <input id="password" name="password" type={visible ? "text" : "password"} placeholder="Masukkan kata sandi" autoComplete="current-password" maxLength={256} required />
        <button type="button" aria-controls="password" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Sembunyikan" : "Lihat"}</button>
      </div>
      <label className="west-remember"><input type="checkbox" name="remember" /> Ingat saya</label>
      {error && <p role="alert" className="west-error">{error}</p>}
      <button className="west-button" disabled={pending}>{pending ? "Sedang masuk…" : "Login ke Dashboard  ›"}</button>
    </form>
  );
}
