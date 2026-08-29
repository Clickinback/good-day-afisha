import type { Category, City, Event } from "@/modules/events/types";

export const cities: City[] = [
  { slug: "polotsk", name: "Полоцк", preposition: "в Полоцке" },
  { slug: "novopolotsk", name: "Новополоцк", preposition: "в Новополоцке" },
];

export const categories: Category[] = [
  { slug: "concerts", name: "Концерты", icon: "♫" }, { slug: "theatre", name: "Театр", icon: "◐" },
  { slug: "cinema", name: "Кино", icon: "▶" }, { slug: "parties", name: "Вечеринки", icon: "✦" },
  { slug: "festivals", name: "Фестивали", icon: "☀" }, { slug: "exhibitions", name: "Выставки", icon: "◇" },
  { slug: "kids", name: "Детям", icon: "☺" }, { slug: "sport", name: "Спорт", icon: "●" },
];

const at = (days: number, hour: number) => { const d = new Date(); d.setHours(hour, 0, 0, 0); d.setDate(d.getDate() + days); return d.toISOString(); };

export const events: Event[] = [
  { id:"1", slug:"vecher-dzhaza-v-sofii", title:"Вечер джаза у Софийского собора", shortDescription:"Живой джаз, закат и старый город", description:"Камерный концерт под открытым небом. В программе — джазовые стандарты и авторские композиции молодых белорусских музыкантов.", imageUrl:"https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=85", city:cities[0], venue:"Софийский собор", address:"ул. Замковая, 1", startsAt:at(0,19), category:categories[0], priceMin:25, priceMax:45, isFree:false, ageRestriction:"12+", featured:true },
  { id:"2", slug:"gorod-v-akvareli", title:"Город в акварели", shortDescription:"Выставка молодых художников Поозерья", description:"Светлая летняя выставка о знакомых улицах, дворах и людях двух городов. По субботам проходят встречи с авторами.", imageUrl:"https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1200&q=85", city:cities[1], venue:"Центр культуры", address:"ул. Калинина, 3", startsAt:at(0,11), endsAt:at(14,19), category:categories[5], priceMin:null, isFree:true, ageRestriction:"0+", featured:true },
  { id:"3", slug:"semeyny-piknik", title:"Большой семейный пикник", shortDescription:"Игры, мастерские и музыка для всей семьи", description:"Городской пикник с творческими мастерскими, настольными играми, локальной едой и концертной программой.", imageUrl:"https://images.unsplash.com/photo-1504151932400-72d4384f04b3?auto=format&fit=crop&w=1200&q=85", city:cities[0], venue:"Парк культуры", address:"пр-т Ф. Скорины, 16", startsAt:at(2,12), endsAt:at(2,18), category:categories[6], priceMin:null, isFree:true, ageRestriction:"0+" },
  { id:"4", slug:"noch-korotkogo-metra", title:"Ночь короткого метра", shortDescription:"Белорусское и европейское короткометражное кино", description:"Пять коротких историй и разговор с кинокритиком после показа.", imageUrl:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85", city:cities[1], venue:"Кинотеатр «Минск»", address:"ул. Молодёжная, 152", startsAt:at(1,20), category:categories[2], priceMin:12, isFree:false, ageRestriction:"16+" },
  { id:"5", slug:"organ-na-rassvete", title:"Орган на рассвете", shortDescription:"Редкая утренняя программа в концертном зале", description:"Музыка Баха и современных композиторов в необычном утреннем формате.", imageUrl:"https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=85", city:cities[0], venue:"Концертный зал", address:"ул. Стрелецкая, 4", startsAt:at(1,9), category:categories[0], priceMin:18, isFree:false, ageRestriction:"6+" },
  { id:"6", slug:"zabeg-dvuh-gorodov", title:"Забег двух городов", shortDescription:"Открытая тренировка на 5 километров", description:"Дружеский городской забег. Темп свободный, предварительная регистрация не требуется.", imageUrl:"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85", city:cities[1], venue:"Площадь Строителей", address:"пл. Строителей, 1", startsAt:at(3,10), category:categories[7], priceMin:null, isFree:true, ageRestriction:"12+" },
];
