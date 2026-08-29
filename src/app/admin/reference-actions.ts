"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const slug=z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text=z.string().trim().min(2);
const optionalUrl=z.union([z.literal(""),z.string().url()]);
const formValues=(data:FormData)=>Object.fromEntries(data.entries());

export async function createCity(data:FormData){await requireAdmin();const value=z.object({name:text,slug,region:z.string().trim().optional(),timezone:z.string().trim().min(3)}).parse(formValues(data));await prisma.city.create({data:{...value,region:value.region||null}});revalidatePath("/admin/cities")}
export async function toggleCity(data:FormData){await requireAdmin();const id=String(data.get("id"));const active=String(data.get("active"))==="true";await prisma.city.update({where:{id},data:{active}});revalidatePath("/admin/cities");revalidatePath("/","layout")}

export async function createVenue(data:FormData){await requireAdmin();const value=z.object({name:text,slug,cityId:z.string().min(1),address:z.string().trim().optional(),websiteUrl:optionalUrl}).parse(formValues(data));await prisma.venue.create({data:{...value,address:value.address||null,websiteUrl:value.websiteUrl||null}});revalidatePath("/admin/venues")}
export async function deleteVenue(data:FormData){await requireAdmin();await prisma.venue.delete({where:{id:String(data.get("id"))}});revalidatePath("/admin/venues")}

export async function createCategory(data:FormData){await requireAdmin();const value=z.object({name:text,slug,icon:z.string().trim().max(12).optional(),sortOrder:z.coerce.number().int().min(0).max(999)}).parse(formValues(data));await prisma.category.create({data:{...value,icon:value.icon||null}});revalidatePath("/admin/categories")}
export async function toggleCategory(data:FormData){await requireAdmin();const id=String(data.get("id"));const active=String(data.get("active"))==="true";await prisma.category.update({where:{id},data:{active}});revalidatePath("/admin/categories");revalidatePath("/","layout")}

export async function createOrganizer(data:FormData){await requireAdmin();const value=z.object({name:text,slug,websiteUrl:optionalUrl,phone:z.string().trim().optional(),email:z.union([z.literal(""),z.string().email()])}).parse(formValues(data));await prisma.organizer.create({data:{...value,websiteUrl:value.websiteUrl||null,phone:value.phone||null,email:value.email||null}});revalidatePath("/admin/organizers")}
export async function deleteOrganizer(data:FormData){await requireAdmin();await prisma.organizer.delete({where:{id:String(data.get("id"))}});revalidatePath("/admin/organizers")}
