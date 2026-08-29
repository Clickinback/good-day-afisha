import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/admin-auth";
export default async function LoginPage(){if(await isAdmin())redirect("/admin");return <main className="admin-login"><div><span className="eyebrow coral">Good Day · Admin</span><h1>Управляйте городским ритмом.</h1><p>Войдите, чтобы добавлять события и работать с модерацией.</p><LoginForm/></div><aside><b>Сегодня хороший день</b><span>для точной и актуальной афиши</span></aside></main>}
