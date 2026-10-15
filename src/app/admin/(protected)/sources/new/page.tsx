import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SourceForm } from "@/components/admin/source-form";
import { prisma } from "@/lib/prisma";
export default async function NewSourcePage(){const cities=await prisma.city.findMany({where:{active:true},select:{id:true,name:true},orderBy:{name:"asc"}});return <><header className="admin-top"><div><Link className="admin-back" href="/admin/sources"><ArrowLeft size={16}/>К источникам</Link><h1>Новый источник</h1><p>Вставьте ссылку, проверьте примеры и включите автоматический сбор.</p></div></header><SourceForm cities={cities}/></>}
