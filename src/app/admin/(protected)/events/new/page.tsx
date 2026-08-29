import Link from "next/link";
import { ArrowLeft,TriangleAlert } from "lucide-react";
import { EventForm } from "@/components/admin/event-form";
import { getEventFormOptions } from "@/lib/admin-data";
export default async function NewEventPage(){let options;try{options=await getEventFormOptions()}catch{return <><header className="admin-top"><div><Link className="admin-back" href="/admin/events"><ArrowLeft size={16}/>К списку</Link><h1>Новое мероприятие</h1></div></header><div className="admin-notice"><TriangleAlert/><div><b>Сначала подключите базу данных</b><p>Форма использует справочники городов, категорий, площадок и организаторов из PostgreSQL.</p></div></div></>}return <><header className="admin-top"><div><Link className="admin-back" href="/admin/events"><ArrowLeft size={16}/>К списку</Link><h1>Новое мероприятие</h1><p>Добавление вручную · источник будет отмечен как manual.</p></div></header><EventForm {...options}/></>}
