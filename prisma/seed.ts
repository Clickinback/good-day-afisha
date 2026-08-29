import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
const categories=[
  ["concerts","Концерты","♫"],["theatre","Театр","◐"],["cinema","Кино","▶"],["parties","Вечеринки","✦"],["festivals","Фестивали","☀"],["exhibitions","Выставки","◇"],["kids","Детям","☺"],["sport","Спорт","●"],["free","Бесплатно","○"],["other","Другое","+"]
] as const;
async function main(){
  const polotsk=await prisma.city.upsert({where:{slug:"polotsk"},update:{},create:{slug:"polotsk",name:"Полоцк",region:"Витебская область"}});
  const novopolotsk=await prisma.city.upsert({where:{slug:"novopolotsk"},update:{},create:{slug:"novopolotsk",name:"Новополоцк",region:"Витебская область"}});
  for(const [index,[slug,name,icon]] of categories.entries())await prisma.category.upsert({where:{slug},update:{name,icon,sortOrder:index},create:{slug,name,icon,sortOrder:index}});
  await prisma.venue.upsert({where:{cityId_slug:{cityId:polotsk.id,slug:"sofia"}},update:{},create:{cityId:polotsk.id,slug:"sofia",name:"Софийский собор",address:"ул. Замковая, 1"}});
  await prisma.venue.upsert({where:{cityId_slug:{cityId:novopolotsk.id,slug:"culture-center"}},update:{},create:{cityId:novopolotsk.id,slug:"culture-center",name:"Центр культуры",address:"ул. Калинина, 3"}});
  await prisma.source.upsert({where:{type_url:{type:"MANUAL",url:"https://good-day.local/manual"}},update:{active:false},create:{name:"Ручное добавление",type:"MANUAL",url:"https://good-day.local/manual",collectionMethod:"MANUAL",trustScore:1,active:false}});
  await prisma.source.upsert({where:{type_url:{type:"TELEGRAM",url:"https://t.me/s/polotsk_ck"}},update:{cityId:polotsk.id,active:true,trustScore:.95,config:{maxItems:20,includeForwarded:false}},create:{name:"Центр культуры «Полоцк»",type:"TELEGRAM",url:"https://t.me/s/polotsk_ck",cityId:polotsk.id,collectionMethod:"TELEGRAM",trustScore:.95,active:true,config:{maxItems:20,includeForwarded:false}}});
  await prisma.source.upsert({where:{type_url:{type:"TELEGRAM",url:"https://t.me/s/nplckod"}},update:{cityId:novopolotsk.id,active:true,trustScore:.9,config:{maxItems:20,includeForwarded:true}},create:{name:"Новополоцк. Официально. Достоверно.",type:"TELEGRAM",url:"https://t.me/s/nplckod",cityId:novopolotsk.id,collectionMethod:"TELEGRAM",trustScore:.9,active:true,config:{maxItems:20,includeForwarded:true}}});
  const sofia=await prisma.venue.findUniqueOrThrow({where:{cityId_slug:{cityId:polotsk.id,slug:"sofia"}}});
  const culture=await prisma.venue.findUniqueOrThrow({where:{cityId_slug:{cityId:novopolotsk.id,slug:"culture-center"}}});
  const categoryRows=await prisma.category.findMany();
  const categoryId=(slug:string)=>categoryRows.find(item=>item.slug===slug)!.id;
  const at=(days:number,hour:number)=>{const value=new Date();value.setHours(hour,0,0,0);value.setDate(value.getDate()+days);return value};
  const demoEvents=[
    {endsAt:undefined,slug:"vecher-dzhaza-v-sofii",title:"Вечер джаза у Софийского собора",shortDescription:"Живой джаз, закат и старый город",cityId:polotsk.id,venueId:sofia.id,address:sofia.address,categoryId:categoryId("concerts"),startsAt:at(0,19),priceMin:25,isFree:false,ageRestriction:"12+",isFeatured:true},
    {slug:"gorod-v-akvareli",title:"Город в акварели",shortDescription:"Выставка молодых художников Поозерья",cityId:novopolotsk.id,venueId:culture.id,address:culture.address,categoryId:categoryId("exhibitions"),startsAt:at(0,11),endsAt:at(7,19),priceMin:null,isFree:true,ageRestriction:"0+",isFeatured:true},
    {slug:"semeyny-piknik",title:"Большой семейный пикник",shortDescription:"Игры, мастерские и музыка для всей семьи",cityId:polotsk.id,venueId:sofia.id,address:"Парк культуры",categoryId:categoryId("kids"),startsAt:at(2,12),endsAt:at(2,18),priceMin:null,isFree:true,ageRestriction:"0+",isFeatured:false},
    {endsAt:undefined,slug:"noch-korotkogo-metra",title:"Ночь короткого метра",shortDescription:"Белорусское и европейское короткометражное кино",cityId:novopolotsk.id,venueId:culture.id,address:culture.address,categoryId:categoryId("cinema"),startsAt:at(1,20),priceMin:12,isFree:false,ageRestriction:"16+",isFeatured:false},
    {endsAt:undefined,slug:"organ-na-rassvete",title:"Орган на рассвете",shortDescription:"Редкая утренняя программа",cityId:polotsk.id,venueId:sofia.id,address:sofia.address,categoryId:categoryId("concerts"),startsAt:at(1,9),priceMin:18,isFree:false,ageRestriction:"6+",isFeatured:false},
    {endsAt:undefined,slug:"zabeg-dvuh-gorodov",title:"Забег двух городов",shortDescription:"Открытая тренировка на 5 километров",cityId:novopolotsk.id,venueId:culture.id,address:"Площадь Строителей",categoryId:categoryId("sport"),startsAt:at(3,10),priceMin:null,isFree:true,ageRestriction:"12+",isFeatured:false},
  ];
  for(const event of demoEvents)await prisma.event.upsert({where:{slug:event.slug},update:{startsAt:event.startsAt,endsAt:event.endsAt},create:{...event,description:event.shortDescription,status:"PUBLISHED",moderationStatus:"APPROVED",additionMethod:"MANUAL",publishedAt:new Date()}});
}
main().then(()=>prisma.$disconnect()).catch(async error=>{console.error(error);await prisma.$disconnect();process.exit(1)});
