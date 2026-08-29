import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { getEventFormOptions,dateTimeLocal } from "@/lib/admin-data";
import { prisma } from "@/lib/prisma";
export default async function EditEventPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const [event,options]=await Promise.all([prisma.event.findUnique({where:{id}}),getEventFormOptions()]);if(!event)notFound();const initial={id:event.id,title:event.title,slug:event.slug,shortDescription:event.shortDescription??"",description:event.description??"",imageUrl:event.imageUrl??"",cityId:event.cityId,categoryId:event.categoryId,venueId:event.venueId??"",organizerId:event.organizerId??"",address:event.address??"",startsAt:dateTimeLocal(event.startsAt),timeTbd:event.timeTbd,endsAt:dateTimeLocal(event.endsAt),priceMin:event.priceMin?.toString()??"",priceMax:event.priceMax?.toString()??"",isFree:event.isFree,ageRestriction:event.ageRestriction??"",ticketUrl:event.ticketUrl??"",status:event.status};return <><header className="admin-top"><div><Link className="admin-back" href="/admin/events"><ArrowLeft size={16}/>К списку</Link><h1>Редактирование</h1><p>{event.title}</p></div></header><EventForm {...options} initial={initial}/></>}
