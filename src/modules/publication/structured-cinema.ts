type StructuredCinemaLink={
  sourceId:string;
  source:{url:string;active:boolean;config:unknown};
  rawEvent:{url:string;rawHtml:string|null}|null;
};

export function isTrustedStructuredCinema(links:StructuredCinemaLink[]):boolean{
  return links.some(link=>{
    if(link.sourceId!=="src_cinemaminsk_np"||!link.source.active||link.source.url.replace(/\/$/,"")!=="https://hubl.by/novopolock/afisha")return false;
    if(!link.source.config||typeof link.source.config!=="object"||!("syncScreenings" in link.source.config)||link.source.config.syncScreenings!==true)return false;
    if(!link.rawEvent?.rawHtml)return false;
    try{
      const url=new URL(link.rawEvent.url);
      if(url.protocol!=="https:"||url.hostname!=="hubl.by"||!/^\/novopolock\/kino\/[^/]+\/?$/.test(url.pathname))return false;
      const node=JSON.parse(link.rawEvent.rawHtml) as Record<string,unknown>;
      const types=Array.isArray(node["@type"])?node["@type"]:[node["@type"]];
      return types.some(type=>type==="Event"||type==="ScreeningEvent")&&typeof node.name==="string"&&Boolean(node.name.trim())&&typeof node.startDate==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(node.startDate)&&Number.isFinite(+new Date(node.startDate));
    }catch{return false}
  });
}
