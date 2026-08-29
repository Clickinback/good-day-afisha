import Link from "next/link";
import { CalendarDays,Database,FileJson2,GitMerge,History,LayoutDashboard,MapPinned,MessageSquareWarning,Radio,Rocket,Sparkles,Shapes,UsersRound,Warehouse,Workflow } from "lucide-react";
import { logout } from "@/app/admin/actions";
const items=[
  ["/admin","Обзор",LayoutDashboard],["/admin/events","Мероприятия",CalendarDays],["/admin/moderation","Требует проверки",MessageSquareWarning],
  ["/admin/sources","Источники",Radio],["/admin/raw-events","Сырые события",FileJson2],["/admin/duplicates","Возможные дубли",GitMerge],["/admin/cities","Города",MapPinned],["/admin/venues","Площадки",Warehouse],
  ["/admin/automation","Автоматизация",Workflow],["/admin/publication","Автопубликация",Rocket],["/admin/collections","Подборки",Sparkles],["/admin/categories","Категории",Shapes],["/admin/organizers","Организаторы",UsersRound],["/admin/collector-runs","История сборов",History],["/admin/errors","Ошибки системы",Database],
] as const;
export function AdminSidebar(){return <aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><i>GD</i><span><b>Good Day</b><small>Управление афишей</small></span></Link><nav>{items.map(([href,label,Icon])=><Link href={href} key={href}><Icon size={17}/>{label}</Link>)}</nav><form action={logout}><button>Выйти</button></form></aside>}
