import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { SourceForm } from "@/components/admin/source-form";
import { prisma } from "@/lib/prisma";
export default async function EditSourcePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const [source,cities]=await Promise.all([prisma.source.findUnique({where:{id}}),prisma.city.findMany({where:{active:true},select:{id:true,name:true},orderBy:{name:"asc"}})]);if(!source)notFound();const initial={id:source.id,name:source.name,type:source.type,url:source.url,cityId:source.cityId??"",trustScore:source.trustScore.toString(),collectionMethod:source.collectionMethod,active:source.active,config:source.config?JSON.stringify(source.config,null,2):""};return <><header className="admin-top"><div><Link className="admin-back" href="/admin/sources"><ArrowLeft size={16}/>К источникам</Link><h1>Редактирование источника</h1><p>{source.name}</p></div></header><SourceForm cities={cities} initial={initial}/></>}
