"use strict";(()=>{var e={};e.id=68,e.ids=[68],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9500:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>R,patchFetch:()=>y,requestAsyncStorage:()=>l,routeModule:()=>p,serverHooks:()=>E,staticGenerationAsyncStorage:()=>_});var r={};s.r(r),s.d(r,{DELETE:()=>c,POST:()=>u});var n=s(9303),a=s(8716),d=s(670),i=s(7070),o=s(7730);async function u(e){try{let{predecessorId:t,successorId:s}=await e.json();if(!t||!s)return i.NextResponse.json({error:"predecessorId and successorId are required"},{status:400});if(t===s)return i.NextResponse.json({error:"A task cannot depend on itself"},{status:400});let{dependencies:r}=await (0,o.QE)();if(function(e,t,s){if(t===s)return!0;let r=new Map;for(let t of e)r.has(t.predecessorId)||r.set(t.predecessorId,[]),r.get(t.predecessorId).push(t.successorId);let n=new Set,a=[s];for(;a.length>0;){let e=a.pop();if(e===t)return!0;if(!n.has(e))for(let t of(n.add(e),r.get(e)||[]))n.has(t)||a.push(t)}return!1}(r,t,s))return i.NextResponse.json({error:"Circular dependency detected: Adding this dependency creates a cycle. The existing graph remains unchanged."},{status:400});let n=await (0,o.zO)(t,s);return i.NextResponse.json(n,{status:201})}catch(e){if(console.error("Failed to create dependency:",e),e.message?.includes("duplicate key value"))return i.NextResponse.json({error:"Dependency already exists"},{status:409});return i.NextResponse.json({error:"Failed to create dependency"},{status:500})}}async function c(e){try{let{searchParams:t}=new URL(e.url),s=t.get("pred"),r=t.get("succ");if(!s||!r)return i.NextResponse.json({error:"pred and succ query parameters are required"},{status:400});if(!await (0,o.LJ)(s,r))return i.NextResponse.json({error:"Dependency not found"},{status:404});return new i.NextResponse(null,{status:204})}catch(e){return console.error("Failed to delete dependency:",e),i.NextResponse.json({error:"Failed to delete dependency"},{status:500})}}let p=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/dependencies/route",pathname:"/api/dependencies",filename:"route",bundlePath:"app/api/dependencies/route"},resolvedPagePath:"D:\\lmth\\hackathons\\contata-hackathon\\app\\api\\dependencies\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:l,staticGenerationAsyncStorage:_,serverHooks:E}=p,R="/api/dependencies/route";function y(){return(0,d.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:_})}},7730:(e,t,s)=>{s.d(t,{LJ:()=>p,_5:()=>u,QE:()=>d,zO:()=>c,Js:()=>i,xJ:()=>o});var r=s(2237);if(!process.env.DATABASE_URL)throw Error("DATABASE_URL is not set in environment variables");let n=(0,r.qn)(process.env.DATABASE_URL);function a(e){return{id:e.id,title:e.title,description:e.description||"",columnStatus:e.column_status,durationDays:Number(e.duration_days),startDate:"string"==typeof e.start_date?e.start_date.split("T")[0]:new Date(e.start_date).toISOString().split("T")[0],endDate:"string"==typeof e.end_date?e.end_date.split("T")[0]:new Date(e.end_date).toISOString().split("T")[0]}}async function d(){let[e,t]=await Promise.all([n`SELECT id, title, description, column_status, duration_days, start_date::text, end_date::text FROM tasks ORDER BY created_at ASC;`,n`SELECT id, predecessor_id, successor_id FROM task_dependencies;`]);return{tasks:e.map(a),dependencies:t.map(e=>({id:e.id,predecessorId:e.predecessor_id,successorId:e.successor_id}))}}async function i(e){let t=e.title,s=e.description||"",r=e.columnStatus||"BACKLOG",d=e.durationDays&&e.durationDays>0?e.durationDays:1,i=e.startDate||new Date().toISOString().split("T")[0];return a((await n`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES (
      ${t},
      ${s},
      ${r},
      ${d},
      ${i}::date,
      (${i}::date + (${d} * INTERVAL '1 day'))::date
    )
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  `)[0])}async function o(e,t){let s=await n`SELECT * FROM tasks WHERE id = ${e}::uuid;`;if(0===s.length)return null;let r=s[0],d=t.title??r.title,i=t.description??r.description,o=t.columnStatus??r.column_status,u=t.durationDays??r.duration_days,c=t.startDate??r.start_date,p=t.endDate??r.end_date;return a((await n`
    UPDATE tasks
    SET
      title = ${d},
      description = ${i},
      column_status = ${o},
      duration_days = ${u},
      start_date = ${c}::date,
      end_date = ${p}::date,
      updated_at = NOW()
    WHERE id = ${e}::uuid
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  `)[0])}async function u(e){return(await n`DELETE FROM tasks WHERE id = ${e}::uuid RETURNING id;`).length>0}async function c(e,t){let s=await n`
    INSERT INTO task_dependencies (predecessor_id, successor_id)
    VALUES (${e}::uuid, ${t}::uuid)
    RETURNING id, predecessor_id, successor_id;
  `;return{id:s[0].id,predecessorId:s[0].predecessor_id,successorId:s[0].successor_id}}async function p(e,t){return(await n`
    DELETE FROM task_dependencies
    WHERE predecessor_id = ${e}::uuid AND successor_id = ${t}::uuid
    RETURNING id;
  `).length>0}}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[276,972,237],()=>s(9500));module.exports=r})();