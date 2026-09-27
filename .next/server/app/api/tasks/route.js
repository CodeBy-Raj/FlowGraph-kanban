"use strict";(()=>{var t={};t.id=495,t.ids=[495],t.modules={399:t=>{t.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:t=>{t.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1621:(t,e,s)=>{s.r(e),s.d(e,{originalPathname:()=>D,patchFetch:()=>h,requestAsyncStorage:()=>_,routeModule:()=>p,serverHooks:()=>f,staticGenerationAsyncStorage:()=>E});var a={};s.r(a),s.d(a,{GET:()=>c,POST:()=>l});var r=s(9303),n=s(8716),i=s(670),d=s(7070),o=s(7730);function u(t,e){let s=new Date(t);return s.setDate(s.getDate()+e),s.toISOString().split("T")[0]}async function c(){try{let{tasks:t,dependencies:e}=await (0,o.QE)(),s=function(t,e,s=new Date().toISOString().split("T")[0]){let a=new Map(t.map(t=>[t.id,t])),r=new Map;for(let e of t)r.set(e.id,[]);for(let t of e)a.has(t.predecessorId)&&a.has(t.successorId)&&r.get(t.successorId).push(t.predecessorId);let n=function(t,e,s){let a=new Map(t.map(t=>[t.id,t])),r=new Map,n=new Map,i=new Map;for(let e of t)r.set(e.id,0),n.set(e.id,[]),i.set(e.id,[]);for(let t of e)a.has(t.predecessorId)&&a.has(t.successorId)&&(n.get(t.predecessorId).push(t.successorId),i.get(t.successorId).push(t.predecessorId),r.set(t.successorId,(r.get(t.successorId)||0)+1));let d=[];for(let[t,e]of r.entries())0===e&&d.push(t);let o=[];for(;d.length>0;){let t=d.shift();for(let e of(o.push(t),n.get(t)||[])){let t=r.get(e)-1;r.set(e,t),0===t&&d.push(e)}}let c=new Map;for(let t of o){let e=a.get(t),r=i.get(t)||[],n=0;if(r.length>0)for(let t of r){let e=c.get(t);e&&e.earlyFinish>n&&(n=e.earlyFinish)}let d=n+Math.max(e.durationDays,1),o=u(s,n),l=u(s,d);c.set(t,{earlyStart:n,earlyFinish:d,computedStartDate:o,computedEndDate:l})}return c}(t,e,s);return t.map(t=>{let e=r.get(t.id)||[],s=[];for(let t of e){let e=a.get(t);e&&"DONE"!==e.columnStatus&&s.push(t)}let i=s.length>0,d=n.get(t.id)||{earlyStart:0,earlyFinish:t.durationDays,computedStartDate:t.startDate,computedEndDate:t.endDate};return{...t,startDate:d.computedStartDate,endDate:d.computedEndDate,earlyStart:d.earlyStart,earlyFinish:d.earlyFinish,dependencyStatus:i?"BLOCKED":"READY",isBlocked:i,blockingPredecessorIds:s}})}(t,e);return d.NextResponse.json({tasks:s,dependencies:e})}catch(t){return console.error("Failed to fetch graph:",t),d.NextResponse.json({error:"Internal Server Error"},{status:500})}}async function l(t){try{let e=await t.json();if(!e.title)return d.NextResponse.json({error:"Task title is required"},{status:400});let s=await (0,o.Js)({title:e.title,description:e.description,columnStatus:e.columnStatus,durationDays:e.durationDays,startDate:e.startDate});return d.NextResponse.json(s,{status:201})}catch(t){return console.error("Failed to create task:",t),d.NextResponse.json({error:"Failed to create task"},{status:500})}}let p=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/tasks/route",pathname:"/api/tasks",filename:"route",bundlePath:"app/api/tasks/route"},resolvedPagePath:"D:\\lmth\\hackathons\\contata-hackathon\\app\\api\\tasks\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:_,staticGenerationAsyncStorage:E,serverHooks:f}=p,D="/api/tasks/route";function h(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:E})}},7730:(t,e,s)=>{s.d(e,{LJ:()=>l,_5:()=>u,QE:()=>i,zO:()=>c,Js:()=>d,xJ:()=>o});var a=s(2237);if(!process.env.DATABASE_URL)throw Error("DATABASE_URL is not set in environment variables");let r=(0,a.qn)(process.env.DATABASE_URL);function n(t){return{id:t.id,title:t.title,description:t.description||"",columnStatus:t.column_status,durationDays:Number(t.duration_days),startDate:"string"==typeof t.start_date?t.start_date.split("T")[0]:new Date(t.start_date).toISOString().split("T")[0],endDate:"string"==typeof t.end_date?t.end_date.split("T")[0]:new Date(t.end_date).toISOString().split("T")[0]}}async function i(){let[t,e]=await Promise.all([r`SELECT id, title, description, column_status, duration_days, start_date::text, end_date::text FROM tasks ORDER BY created_at ASC;`,r`SELECT id, predecessor_id, successor_id FROM task_dependencies;`]);return{tasks:t.map(n),dependencies:e.map(t=>({id:t.id,predecessorId:t.predecessor_id,successorId:t.successor_id}))}}async function d(t){let e=t.title,s=t.description||"",a=t.columnStatus||"BACKLOG",i=t.durationDays&&t.durationDays>0?t.durationDays:1,d=t.startDate||new Date().toISOString().split("T")[0];return n((await r`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES (
      ${e},
      ${s},
      ${a},
      ${i},
      ${d}::date,
      (${d}::date + (${i} * INTERVAL '1 day'))::date
    )
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  `)[0])}async function o(t,e){let s=await r`SELECT * FROM tasks WHERE id = ${t}::uuid;`;if(0===s.length)return null;let a=s[0],i=e.title??a.title,d=e.description??a.description,o=e.columnStatus??a.column_status,u=e.durationDays??a.duration_days,c=e.startDate??a.start_date,l=e.endDate??a.end_date;return n((await r`
    UPDATE tasks
    SET
      title = ${i},
      description = ${d},
      column_status = ${o},
      duration_days = ${u},
      start_date = ${c}::date,
      end_date = ${l}::date,
      updated_at = NOW()
    WHERE id = ${t}::uuid
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  `)[0])}async function u(t){return(await r`DELETE FROM tasks WHERE id = ${t}::uuid RETURNING id;`).length>0}async function c(t,e){let s=await r`
    INSERT INTO task_dependencies (predecessor_id, successor_id)
    VALUES (${t}::uuid, ${e}::uuid)
    RETURNING id, predecessor_id, successor_id;
  `;return{id:s[0].id,predecessorId:s[0].predecessor_id,successorId:s[0].successor_id}}async function l(t,e){return(await r`
    DELETE FROM task_dependencies
    WHERE predecessor_id = ${t}::uuid AND successor_id = ${e}::uuid
    RETURNING id;
  `).length>0}}};var e=require("../../../webpack-runtime.js");e.C(t);var s=t=>e(e.s=t),a=e.X(0,[276,972,237],()=>s(1621));module.exports=a})();