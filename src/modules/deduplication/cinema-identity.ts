import { normalize } from "./similarity";

function hublFilmPath(value:string){
  try{
    const url=new URL(value);
    if(url.hostname!=="hubl.by")return null;
    const match=url.pathname.match(/^\/([^/]+)\/kino\/([^/]+)\/?$/);
    if(!match)return null;
    return {city:match[1],film:match[2].replace(/-\d+$/,"")};
  }catch{return null}
}

export function isHublCinemaVariant(incoming:{title:string;url:string},candidate:{title:string;url:string}){
  if(normalize(incoming.title)!==normalize(candidate.title))return false;
  const first=hublFilmPath(incoming.url),second=hublFilmPath(candidate.url);
  return Boolean(first&&second&&first.city===second.city&&first.film===second.film);
}
