"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
export function LoginForm(){const [state,action,pending]=useActionState(login,{});return <form action={action} className="admin-login-form"><label>Пароль администратора<input name="password" type="password" autoComplete="current-password" required autoFocus/></label>{state.error&&<p className="form-error">{state.error}</p>}<button disabled={pending}>{pending?"Проверяем…":"Войти"}</button></form>}
