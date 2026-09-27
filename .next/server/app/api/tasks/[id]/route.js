"use strict";(()=>{var t={};t.id=974,t.ids=[974],t.modules={399:t=>{t.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:t=>{t.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3913:(t,e,s)=>{s.r(e),s.d(e,{originalPathname:()=>R,patchFetch:()=>T,requestAsyncStorage:()=>l,routeModule:()=>p,serverHooks:()=>E,staticGenerationAsyncStorage:()=>_});var a={};s.r(a),s.d(a,{DELETE:()=>c,PATCH:()=>u});var r=s(9303),n=s(8716),d=s(670),i=s(7070),o=s(7730);async function u(t,{params:e}){try{let{id:s}=e,a=await t.json(),r=await (0,o.xJ)(s,a);if(!r)return i.NextResponse.json({error:"Task not found"},{status:404});return i.NextResponse.json(r)}catch(t){return console.error("Failed to update task:",t),i.NextResponse.json({error:"Failed to update task"},{status:500})}}async function c(t,{params:e}){try{let{id:t}=e;if(!await (0,o._5)(t))return i.NextResponse.json({error:"Task not found"},{status:404});return new i.NextResponse(null,{status:204})}catch(t){return console.error("Failed to delete task:",t),i.NextResponse.json({error:"Failed to delete task"},{status:500})}}let p=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/tasks/[id]/route",pathname:"/api/tasks/[id]",filename:"route",bundlePath:"app/api/tasks/[id]/route"},resolvedPagePath:"D:\\lmth\\hackathons\\contata-hackathon\\app\\api\\tasks\\[id]\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:l,staticGenerationAsyncStorage:_,serverHooks:E}=p,R="/api/tasks/[id]/route";function T(){return(0,d.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:_})}},7730:(t,e,s)=>{s.d(e,{LJ:()=>p,_5:()=>u,QE:()=>d,zO:()=>c,Js:()=>i,xJ:()=>o});var a=s(2237);if(!process.env.DATABASE_URL)throw Error("DATABASE_URL is not set in environment variables");let r=(0,a.qn)(process.env.DATABASE_URL);function n(t){return{id:t.id,title:t.title,description:t.description||"",columnStatus:t.column_status,durationDays:Number(t.duration_days),startDate:"string"==typeof t.start_date?t.start_date.split("T")[0]:new Date(t.start_date).toISOString().split("T")[0],endDate:"string"==typeof t.end_date?t.end_date.split("T")[0]:new Date(t.end_date).toISOString().split("T")[0]}}async function d(){let[t,e]=await Promise.all([r`SELECT id, title, description, column_status, duration_days, start_date::text, end_date::text FROM tasks ORDER BY created_at ASC;`,r`SELECT id, predecessor_id, successor_id FROM task_dependencies;`]);return{tasks:t.map(n),dependencies:e.map(t=>({id:t.id,predecessorId:t.predecessor_id,successorId:t.successor_id}))}}async function i(t){let e=t.title,s=t.description||"",a=t.columnStatus||"BACKLOG",d=t.durationDays&&t.durationDays>0?t.durationDays:1,i=t.startDate||new Date().toISOString().split("T")[0];return n((await r`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES (
      ${e},
      ${s},
      ${a},
      ${d},
      ${i}::date,
      (${i}::date + (${d} * INTERVAL '1 day'))::date
    )
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  `)[0])}async function o(t,e){let s=await r`SELECT * FROM tasks WHERE id = ${t}::uuid;`;if(0===s.length)return null;let a=s[0],d=e.title??a.title,i=e.description??a.description,o=e.columnStatus??a.column_status,u=e.durationDays??a.duration_days,c=e.startDate??a.start_date,p=e.endDate??a.end_date;return n((await r`
    UPDATE tasks
    SET
      title = ${d},
      description = ${i},
      column_status = ${o},
      duration_days = ${u},
      start_date = ${c}::date,
      end_date = ${p}::date,
      updated_at = NOW()
    WHERE id = ${t}::uuid
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  `)[0])}async function u(t){return(await r`DELETE FROM tasks WHERE id = ${t}::uuid RETURNING id;`).length>0}async function c(t,e){let s=await r`
    INSERT INTO task_dependencies (predecessor_id, successor_id)
    VALUES (${t}::uuid, ${e}::uuid)
    RETURNING id, predecessor_id, successor_id;
  `;return{id:s[0].id,predecessorId:s[0].predecessor_id,successorId:s[0].successor_id}}async function p(t,e){return(await r`
    DELETE FROM task_dependencies
    WHERE predecessor_id = ${t}::uuid AND successor_id = ${e}::uuid
    RETURNING id;
  `).length>0}}};var e=require("../../../../webpack-runtime.js");e.C(t);var s=t=>e(e.s=t),a=e.X(0,[276,972,237],()=>s(3913));module.exports=a})();