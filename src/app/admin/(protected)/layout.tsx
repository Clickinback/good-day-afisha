import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/admin-auth";
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireAdmin();return <div className="admin-shell"><AdminSidebar/><div className="admin-content">{children}</div></div>}
