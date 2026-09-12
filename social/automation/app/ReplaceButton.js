'use client';
export default function ReplaceButton({item,target,busy,act}){return ['draft','approved','ready','replacement-failed'].includes(item.status)?<button disabled={busy||Boolean(item.manual_requested_at)} onClick={()=>act({action:'replace-content',target,id:item.id})}>Usuń i przygotuj nową</button>:item.status==='regenerating'?<p role="status">Generowanie nowej treści…</p>:null;}
