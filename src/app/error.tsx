"use client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="not-found"><span>Упс</span><h1>Что-то пошло не так</h1><p>Попробуйте обновить страницу — мы уже разбираемся.</p><button className="primary-button" onClick={reset}>Попробовать снова</button></main>}
