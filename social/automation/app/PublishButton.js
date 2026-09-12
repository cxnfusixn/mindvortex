'use client';
export default function PublishButton({item,target,busy,act,paused}){if(!['approved','ready'].includes(item.status))return null;return <button disabled={busy||paused||Boolean(item.manual_requested_at)} onClick={()=>act({action:'publish-now',target,id:item.id})}>{item.manual_requested_at?'Publikacja zlecona':'Opublikuj teraz'}</button>;}
