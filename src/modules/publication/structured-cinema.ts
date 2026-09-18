type StructuredCinemaLink={
  sourceId:string;
  sourceUrl:string;
  source:{url:string;active:boolean;config:unknown};
};

export function isTrustedStructuredCinema(links:StructuredCinemaLink[]):boolean{
  return links.some(link=>{
    if(link.sourceId!=="src_cinemaminsk_np"||!link.source.active||link.source.url.replace(/\/$/,"")!=="https://hubl.by/novopolock/afisha")return false;
    if(!link.source.config||typeof link.source.config!=="object"||!("syncScreenings" in link.source.config)||link.source.config.syncScreenings!==true)return false;
    try{
      const url=new URL(link.sourceUrl);
      return url.protocol==="https:"&&url.hostname==="hubl.by"&&/^\/novopolock\/kino\/[^/]+\/?$/.test(url.pathname);
    }catch{return false}
  });
}
