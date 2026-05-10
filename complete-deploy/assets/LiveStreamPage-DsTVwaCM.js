import{r as re,j as x}from"./app.js";const Kn="https://claw-backend-2026.onrender.com";function Wl({proxyEnabled:i,onProxyEnabledChange:e,useOwnProxy:t,onUseOwnProxyChange:n,ownProxyUrl:s,onOwnProxyUrlChange:r,ownProxyHost:a,onOwnProxyHostChange:o,ownProxyPort:c,onOwnProxyPortChange:l,ownProxyUser:f,onOwnProxyUserChange:p,ownProxyPass:u,onOwnProxyPassChange:m,selectedRegion:_,onRegionChange:E,selectedPlan:h,onPlanChange:d,disabled:M}){var he;const[y,T]=re.useState([]),[L,A]=re.useState([]),[P,S]=re.useState(null),[w,O]=re.useState(!1),[R,I]=re.useState(""),[G,Y]=re.useState(!1),[N,B]=re.useState(null);re.useEffect(()=>{ee(),ne(),se()},[]);const k=()=>{const H=localStorage.getItem("token");return H?{Authorization:`Bearer ${H}`}:{}},ee=async()=>{try{const ce=await(await fetch(`${Kn}/api/stream-proxy/plans`)).json();ce.success&&T(Object.values(ce.data))}catch{}},ne=async()=>{try{const ce=await(await fetch(`${Kn}/api/stream-proxy/regions`)).json();ce.success&&A(ce.data.filter(ve=>ve.available))}catch{}},se=async()=>{var H;try{const ve=await(await fetch(`${Kn}/api/stream-proxy/subscription`,{headers:{...k(),"Content-Type":"application/json"}})).json();ve.success&&ve.data&&(S(ve.data),((H=ve.data.selected_regions)==null?void 0:H.length)>0&&E(ve.data.selected_regions[0]),ve.data.plan_id&&d(ve.data.plan_id))}catch{}},me=async()=>{if(!h){I("请选择代理套餐");return}Y(!0),I("");try{const ve=await(await fetch(`${Kn}/api/stream-proxy/order`,{method:"POST",headers:{...k(),"Content-Type":"application/json"},body:JSON.stringify({planId:h,selectedRegions:[_],paymentMethod:"shouqianba",durationMonths:1})})).json();ve.success?(B(ve.data),ve.data.id&&Se(ve.data)):I(ve.error||"创建订单失败")}catch(H){I(H.message)}finally{Y(!1)}},Se=async H=>{var ce;try{const F=await(await fetch(`${Kn}/api/payment/create`,{method:"POST",headers:{...k(),"Content-Type":"application/json"},body:JSON.stringify({amount:H.amount,orderNo:`PROXY-${H.id}`,description:`${H.plan_name} - 代理服务`,metadata:{type:"proxy",orderId:H.id}})})).json();F.success&&((ce=F.data)!=null&&ce.paymentUrl)?(window.open(F.data.paymentUrl,"_blank"),ze(H.id)):I("发起支付失败，请稍后重试")}catch(ve){I(ve.message)}},ze=H=>{let ce=0;const ve=60,F=setInterval(async()=>{ce++;try{(await(await fetch(`${Kn}/api/stream-proxy/activate`,{method:"POST",headers:{...k(),"Content-Type":"application/json"},body:JSON.stringify({orderId:H})})).json()).success&&(clearInterval(F),se(),B(null))}catch{}ce>=ve&&(clearInterval(F),I("支付确认超时，如已付款请刷新页面"))},3e3)},Ve=H=>`¥${(H/100).toLocaleString()}`,De=H=>H<0?"不限":`${H}h`,q=y.find(H=>H.id===h);return x.jsxs("div",{className:"ls-card",children:[x.jsx("h3",{children:"🔒 推流代理"}),x.jsx("p",{className:"ls-hint",style:{marginBottom:12},children:"直播推流到海外平台时需代理，否则可能被平台拒绝或限流"}),R&&x.jsxs("div",{className:"ls-error",onClick:()=>I(""),style:{marginBottom:8},children:["⚠️ ",R]}),x.jsxs("label",{className:"ls-checkbox",style:{marginBottom:16},children:[x.jsx("input",{type:"checkbox",checked:i,onChange:H=>e(H.target.checked),disabled:M}),i?"🟢 代理已启用":"⚪ 启用代理推流"]}),i&&x.jsxs(x.Fragment,{children:[x.jsxs("div",{className:"ls-proxy-mode",children:[x.jsxs("label",{className:"ls-radio",children:[x.jsx("input",{type:"radio",checked:!t,onChange:()=>n(!1),disabled:M}),"🌐 使用 Claw 代理 (付费)"]}),x.jsxs("label",{className:"ls-radio",children:[x.jsx("input",{type:"radio",checked:t,onChange:()=>n(!0),disabled:M}),"🔧 我用自己的代理"]})]}),t?x.jsxs("div",{className:"ls-proxy-own",children:[x.jsx("label",{children:"代理地址"}),x.jsx("input",{type:"text",value:a,onChange:H=>o(H.target.value),disabled:M,placeholder:"127.0.0.1"}),x.jsx("label",{children:"端口"}),x.jsx("input",{type:"number",value:c,onChange:H=>l(H.target.value),disabled:M,placeholder:"1080"}),x.jsx("label",{children:"用户名 (可选)"}),x.jsx("input",{type:"text",value:f,onChange:H=>p(H.target.value),disabled:M,placeholder:"代理认证用户名"}),x.jsx("label",{children:"密码 (可选)"}),x.jsx("input",{type:"password",value:u,onChange:H=>m(H.target.value),disabled:M,placeholder:"代理认证密码"}),a&&c&&x.jsxs("div",{className:"ls-proxy-status",style:{color:"#00e676"},children:["🟢 自定义代理已配置 (",a,":",c,")"]})]}):x.jsxs("div",{className:"ls-proxy-claw",children:[P&&!P.isExpired?x.jsxs("div",{className:"ls-subscription-info",children:[x.jsxs("div",{className:"ls-sub-header",children:[x.jsx("span",{style:{color:"#00e676"},children:"✅ 代理已激活"}),x.jsx("span",{className:"ls-badge",children:P.plan_name})]}),x.jsxs("div",{className:"ls-sub-details",children:[x.jsxs("div",{className:"ls-sub-stat",children:[x.jsx("span",{children:"剩余天数"}),x.jsxs("strong",{style:{color:P.daysRemaining<7?"#ff9800":"#00e676"},children:[P.daysRemaining,"天"]})]}),x.jsxs("div",{className:"ls-sub-stat",children:[x.jsx("span",{children:"剩余时长"}),x.jsx("strong",{children:De(P.remainingHours)})]}),x.jsxs("div",{className:"ls-sub-stat",children:[x.jsx("span",{children:"到期时间"}),x.jsx("strong",{children:new Date(P.expires_at).toLocaleDateString("zh-CN")})]})]}),x.jsx("label",{children:"推流区域"}),x.jsx("select",{value:_,onChange:H=>E(H.target.value),disabled:M,children:(P.selected_regions||["hongkong"]).map(H=>{const ce=L.find(ve=>ve.id===H);return x.jsx("option",{value:H,children:ce?ce.name:H},H)})}),_&&x.jsxs("div",{className:"ls-proxy-status",style:{color:"#00e676",marginTop:8},children:["🟢 代理就绪 — ",((he=L.find(H=>H.id===_))==null?void 0:he.name)||_]})]}):x.jsxs("div",{className:"ls-proxy-purchase",children:[x.jsx("label",{children:"选择套餐"}),x.jsx("div",{className:"ls-plan-grid",children:y.map(H=>{const ce=h===H.id,ve={starter:"#cd7f32",standard:"#c0c0c0",professional:"#ffd700",enterprise:"#00bcd4"};return x.jsxs("div",{className:`ls-plan-card ${ce?"ls-plan-selected":""}`,onClick:()=>!M&&d(H.id),style:ce?{borderColor:ve[H.id]||"#666"}:{},children:[x.jsx("div",{className:"ls-plan-name",children:H.name}),x.jsxs("div",{className:"ls-plan-price",children:[Ve(H.price),x.jsx("span",{children:"/月"})]}),x.jsx("div",{className:"ls-plan-features",children:H.features.slice(0,4).map((F,_e)=>x.jsx("span",{className:"ls-plan-feat",children:F},_e))})]},H.id)})}),x.jsx("label",{style:{marginTop:12},children:"推流区域"}),x.jsx("select",{value:_,onChange:H=>E(H.target.value),disabled:M,children:L.map(H=>x.jsxs("option",{value:H.id,children:[H.name," (",H.nodeCount,"节点)"]},H.id))}),q&&x.jsxs("div",{className:"ls-order-summary",children:[x.jsxs("span",{children:["💰 合计: ",x.jsx("strong",{children:Ve(q.price)}),"/月"]}),x.jsxs("span",{children:["📺 ",q.concurrentPlatforms,"路并发 · ",q.maxResolution," · ",q.ipType==="shared"?"共享IP":q.ipType==="dedicated"?"独享IP":"半独享IP"]})]}),x.jsx("button",{className:"ls-btn ls-btn-start",onClick:me,disabled:G||!h||M,style:{marginTop:12,width:"100%"},children:G?"创建订单中...":"💳 立即购买"})]}),N&&x.jsxs("div",{className:"ls-order-pending",children:[x.jsxs("p",{children:["📋 订单 #",N.id," 已创建"]}),x.jsx("p",{children:"支付完成后代理将自动激活"})]})]})]})]})}const Er={orientation:"portrait",width:1080,height:1920,background:{type:"gradient",value:"#0a0a1a,#1a1a2e"},avatar:{x:50,y:42,width:85,height:72},overlays:[],bottomBar:{enabled:!0,text:"云南瑞丽翡翠源头直播",height:80,backgroundColor:"rgba(0,0,0,0.7)",textColor:"#e0e0e0",showLiveDot:!0,showTimer:!0}},Qo={orientation:"landscape",width:1920,height:1080,background:{type:"gradient",value:"#0a0a1a,#1a1a2e"},avatar:{x:35,y:50,width:45,height:85},overlays:[{id:"qrcode-left",type:"qrcode",label:"微信二维码",enabled:!0,position:{x:3,y:65},size:{width:160,height:200},style:{backgroundColor:"#ffffff",borderRadius:12,padding:10},content:{text:"扫码加微信",qrValue:"https://u.wechat.com/example"},animation:"none",zIndex:10},{id:"ad-text-right",type:"text-banner",label:"右侧广告词",enabled:!0,position:{x:72,y:15},size:{width:380,height:120},style:{fontSize:22,fontFamily:"Microsoft YaHei, sans-serif",color:"#ffd700",backgroundColor:"rgba(0,0,0,0.6)",borderColor:"#ffd700",borderWidth:2,borderRadius:10,fontWeight:"bold",textAlign:"center",padding:15},content:{text:`缅甸A货翡翠
假一赔十 · 源头直供`},animation:"pulse",zIndex:10},{id:"led-news",type:"led-marquee",label:"LED滚动条",enabled:!0,position:{x:72,y:32},size:{width:380,height:36},style:{fontSize:16,fontFamily:"Courier New, monospace",color:"#00ff00",backgroundColor:"#0a1a0a",borderColor:"#00ff00",borderWidth:1,borderRadius:6,textAlign:"left",padding:6},content:{text:"🔥 新粉关注立减50元 | 💎 全场A货翡翠假一赔十 | 📦 顺丰包邮7天无理由 | 🎁 满1999送鉴定证书"},animation:"marquee",zIndex:10},{id:"product-card-right",type:"product-card",label:"产品展示卡",enabled:!1,position:{x:72,y:50},size:{width:380,height:260},style:{backgroundColor:"rgba(20,20,40,0.9)",borderColor:"#6c5ce7",borderWidth:2,borderRadius:12,fontSize:16,color:"#e0e0e0",textAlign:"center",padding:12},content:{productName:"冰种飘花翡翠手镯",productPrice:"¥8,800",text:"缅甸A货 · 种水通透 · 附鉴定证书"},animation:"slide-in",zIndex:10}],bottomBar:{enabled:!0,text:"云南瑞丽翡翠源头直播 · 缅甸A货 · 假一赔十",height:60,backgroundColor:"rgba(0,0,0,0.7)",textColor:"#e0e0e0",showLiveDot:!0,showTimer:!0}},Xl={youtube:"landscape",facebook:"landscape",twitch:"landscape",bilibili:"landscape",tiktok:"portrait",douyin:"portrait",kuaishou:"portrait",custom:"portrait"};function jl(){return`overlay_${Date.now()}_${Math.random().toString(36).slice(2,6)}`}function ql(i){const e={id:jl(),type:i,label:"",enabled:!0,position:{x:50,y:50},size:{width:200,height:100},style:{fontSize:16,color:"#ffffff",backgroundColor:"rgba(0,0,0,0.6)",borderRadius:8,padding:10,textAlign:"center"},content:{},animation:"none",zIndex:10};switch(i){case"qrcode":e.label="微信二维码",e.size={width:160,height:200},e.style.backgroundColor="#ffffff",e.style.color="#333333",e.style.fontSize=13,e.content={text:"扫码加微信",qrValue:""};break;case"text-banner":e.label="广告词",e.size={width:350,height:100},e.style.fontSize=20,e.style.fontWeight="bold",e.style.borderColor="#ffd700",e.style.borderWidth=2,e.content={text:"输入广告词..."};break;case"led-marquee":e.label="LED跑马灯",e.size={width:350,height:36},e.style.fontSize=15,e.style.fontFamily="Courier New, monospace",e.style.color="#00ff00",e.style.backgroundColor="#0a1a0a",e.style.borderColor="#00ff00",e.style.borderWidth=1,e.content={text:"滚动文字..."},e.animation="marquee";break;case"image":e.label="图片",e.size={width:200,height:150},e.content={imageUrl:""};break;case"product-card":e.label="产品卡片",e.size={width:350,height:240},e.style.backgroundColor="rgba(20,20,40,0.9)",e.style.borderColor="#6c5ce7",e.style.borderWidth=2,e.style.borderRadius=12,e.style.fontSize=15,e.content={productName:"产品名称",productPrice:"¥0",text:"产品描述..."};break}return e}const ki=[{type:"qrcode",icon:"📱",label:"二维码"},{type:"text-banner",icon:"📝",label:"广告词"},{type:"led-marquee",icon:"💡",label:"LED跑马灯"},{type:"product-card",icon:"🛍️",label:"产品卡"},{type:"image",icon:"🖼️",label:"图片"}],Yl=[{value:"none",label:"无动画"},{value:"marquee",label:"跑马灯滚动"},{value:"blink",label:"闪烁"},{value:"pulse",label:"脉冲"},{value:"slide-in",label:"滑入"}];function $l({sceneConfig:i,onSceneConfigChange:e,avatarImageUrl:t,avatarName:n,disabled:s=!1,compact:r=!1}){const[a,o]=re.useState(null),[c,l]=re.useState(!1),[f,p]=re.useState(null),[u,m]=re.useState(null),[_,E]=re.useState({x:0,y:0}),h=re.useRef(null),[d,M]=re.useState(!1),[y,T]=re.useState(""),[L,A]=re.useState(0),[P,S]=re.useState(!1),[w,O]=re.useState(""),[R,I]=re.useState("idle"),G=re.useRef(null),Y="https://claw-backend-2026.onrender.com",N=re.useCallback(()=>{if(d)return;I("connecting"),M(!0);const F=new URLSearchParams({profileId:"xiaorui",orientation:i.orientation}),_e=`${Y}/api/live-stream/preview-stream?${F}`,ge=new EventSource(_e);G.current=ge,ge.addEventListener("init",xe=>{const Oe=JSON.parse(xe.data);console.log("[SceneEditor] SSE预览初始化:",Oe)}),ge.addEventListener("frame",xe=>{const Oe=JSON.parse(xe.data);T(Oe.svg),A(Oe.frame),S(Oe.speaking),O(Oe.script||""),R!=="live"&&I("live")}),ge.onerror=()=>{I("error"),B()}},[d,i.orientation,R]),B=re.useCallback(()=>{G.current&&(G.current.close(),G.current=null),M(!1),T(""),I("idle"),O(""),S(!1)},[]);re.useEffect(()=>{d&&(B(),setTimeout(()=>N(),300))},[i.orientation]),re.useEffect(()=>()=>{G.current&&G.current.close()},[]);const k=re.useCallback(F=>{if(s)return;const _e=F==="landscape"?{...Qo,overlays:i.overlays}:{...Er,overlays:i.overlays};e(_e)},[s,i.overlays,e]),ee=re.useCallback(F=>{if(s)return;const _e=ql(F);e({...i,overlays:[...i.overlays,_e]}),o(_e.id),l(!1)},[s,i,e]),ne=re.useCallback(F=>{s||(e({...i,overlays:i.overlays.filter(_e=>_e.id!==F)}),a===F&&o(null))},[s,i,e,a]),se=re.useCallback(F=>{s||e({...i,overlays:i.overlays.map(_e=>_e.id===F?{..._e,enabled:!_e.enabled}:_e)})},[s,i,e]),me=re.useCallback((F,_e)=>{s||e({...i,overlays:i.overlays.map(ge=>ge.id===F?{...ge,..._e}:ge)})},[s,i,e]),Se=re.useCallback((F,_e)=>{s||e({...i,overlays:i.overlays.map(ge=>ge.id===F?{...ge,style:{...ge.style,..._e}}:ge)})},[s,i,e]),ze=re.useCallback((F,_e)=>{s||e({...i,overlays:i.overlays.map(ge=>ge.id===F?{...ge,content:{...ge.content,..._e}}:ge)})},[s,i,e]),Ve=re.useCallback(F=>{s||e({...i,bottomBar:{...i.bottomBar,...F}})},[s,i,e]),De=re.useCallback((F,_e)=>{s||(F.stopPropagation(),o(_e),p(_e),E({x:F.clientX,y:F.clientY}))},[s]);re.useEffect(()=>{if(!f)return;const F=ge=>{const xe=h.current;if(!xe)return;const Oe=xe.getBoundingClientRect(),Ce=(ge.clientX-_.x)/Oe.width*100,Ke=(ge.clientY-_.y)/Oe.height*100;E({x:ge.clientX,y:ge.clientY}),e({...i,overlays:i.overlays.map(qe=>qe.id!==f?qe:{...qe,position:{x:Math.max(0,Math.min(100,qe.position.x+Ce)),y:Math.max(0,Math.min(100,qe.position.y+Ke))}})})},_e=()=>p(null);return window.addEventListener("mousemove",F),window.addEventListener("mouseup",_e),()=>{window.removeEventListener("mousemove",F),window.removeEventListener("mouseup",_e)}},[f,_,i,e]);const q=i.orientation==="landscape"?.35:.22,he=i.width*q,H=i.height*q,ce=i.overlays.find(F=>F.id===a),ve=F=>{const{position:_e,size:ge,style:xe,content:Oe,animation:Ce}=F,Ke=_e.x/100*he,qe=_e.y/100*H,dt=ge.width*q,D=ge.height*q,ot=Ce!=="none"?`se-overlay-${Ce}`:"";switch(F.type){case"qrcode":return x.jsxs("div",{className:`se-overlay se-qrcode ${ot} ${F.id===a?"se-selected":""} ${F.enabled?"":"se-disabled"}`,style:{left:Ke,top:qe,width:dt,height:D,backgroundColor:xe.backgroundColor,borderRadius:xe.borderRadius,padding:(xe.padding||10)*q,border:F.id===a?"2px solid #6c5ce7":xe.borderWidth?`${xe.borderWidth}px solid ${xe.borderColor}`:"none"},onMouseDown:Ue=>De(Ue,F.id),children:[x.jsx("div",{className:"se-qr-placeholder",children:"📱 QR"}),x.jsx("div",{style:{fontSize:(xe.fontSize||12)*q,color:xe.color,textAlign:"center"},children:Oe.text||"扫码加微信"})]},F.id);case"text-banner":return x.jsx("div",{className:`se-overlay se-text-banner ${ot} ${F.id===a?"se-selected":""} ${F.enabled?"":"se-disabled"}`,style:{left:Ke,top:qe,width:dt,height:D,backgroundColor:xe.backgroundColor,color:xe.color,fontSize:(xe.fontSize||16)*q,fontWeight:xe.fontWeight||"normal",borderRadius:xe.borderRadius,border:xe.borderWidth?`${xe.borderWidth}px solid ${xe.borderColor}`:"none",padding:(xe.padding||10)*q,textAlign:xe.textAlign||"center",whiteSpace:"pre-wrap",overflow:"hidden"},onMouseDown:Ue=>De(Ue,F.id),children:Oe.text||"广告词"},F.id);case"led-marquee":return x.jsx("div",{className:`se-overlay se-led ${F.id===a?"se-selected":""} ${F.enabled?"":"se-disabled"}`,style:{left:Ke,top:qe,width:dt,height:D,backgroundColor:xe.backgroundColor,color:xe.color,fontSize:Math.max(8,(xe.fontSize||14)*q),fontFamily:xe.fontFamily,borderRadius:xe.borderRadius,border:xe.borderWidth?`${xe.borderWidth}px solid ${xe.borderColor}`:"none",padding:`${2*q}px ${6*q}px`,overflow:"hidden"},onMouseDown:Ue=>De(Ue,F.id),children:x.jsx("div",{className:"se-marquee-text",children:Oe.text||"LED滚动文字..."})},F.id);case"product-card":return x.jsxs("div",{className:`se-overlay se-product-card ${ot} ${F.id===a?"se-selected":""} ${F.enabled?"":"se-disabled"}`,style:{left:Ke,top:qe,width:dt,height:D,backgroundColor:xe.backgroundColor,color:xe.color,borderRadius:xe.borderRadius,border:xe.borderWidth?`${xe.borderWidth}px solid ${xe.borderColor}`:"none",padding:(xe.padding||12)*q,fontSize:(xe.fontSize||14)*q,textAlign:"center"},onMouseDown:Ue=>De(Ue,F.id),children:[x.jsx("div",{className:"se-product-img",children:"🛍️"}),x.jsx("div",{className:"se-product-name",style:{fontSize:Math.max(8,(xe.fontSize||14)*q)},children:Oe.productName||"产品名称"}),x.jsx("div",{className:"se-product-price",style:{color:"#ffd700",fontSize:Math.max(7,((xe.fontSize||14)-2)*q)},children:Oe.productPrice||""})]},F.id);case"image":return x.jsx("div",{className:`se-overlay se-image-overlay ${F.id===a?"se-selected":""} ${F.enabled?"":"se-disabled"}`,style:{left:Ke,top:qe,width:dt,height:D,backgroundColor:xe.backgroundColor||"#2a2a4a",borderRadius:xe.borderRadius,border:F.id===a?"2px solid #6c5ce7":"1px dashed #555",display:"flex",alignItems:"center",justifyContent:"center"},onMouseDown:Ue=>De(Ue,F.id),children:Oe.imageUrl?x.jsx("img",{src:Oe.imageUrl,alt:"",style:{maxWidth:"100%",maxHeight:"100%"}}):x.jsx("span",{style:{fontSize:10,color:"#666"},children:"🖼️ 图片"})},F.id)}};return r?x.jsxs("div",{className:"se-compact",children:[x.jsxs("div",{className:"se-compact-header",children:[x.jsx("h4",{children:"🎬 直播画面预览与编辑"}),x.jsxs("div",{className:"se-orientation-switch",children:[x.jsx("button",{className:`se-orientation-btn ${i.orientation==="portrait"?"se-active":""}`,onClick:()=>k("portrait"),disabled:s,children:"📱 竖屏"}),x.jsx("button",{className:`se-orientation-btn ${i.orientation==="landscape"?"se-active":""}`,onClick:()=>k("landscape"),disabled:s,children:"🖥️ 横屏"})]})]}),x.jsxs("div",{className:"se-preview-controls",children:[d?x.jsx("button",{className:"se-preview-btn se-preview-stop",onClick:B,children:"⏹ 停止预览"}):x.jsx("button",{className:"se-preview-btn se-preview-start",onClick:N,disabled:s,children:"▶️ 实时预览"}),x.jsxs("span",{className:`se-preview-status se-preview-${R}`,children:[R==="connecting"&&"⏳ 连接中...",R==="live"&&`🔴 直播中 · 帧#${L}`,R==="error"&&"⚠️ 连接失败",R==="idle"&&"点击预览查看直播画面"]})]}),x.jsxs("div",{className:"se-canvas-wrapper",children:[d&&y?x.jsx("div",{className:"se-canvas se-canvas-live",style:{width:he,height:H},dangerouslySetInnerHTML:{__html:y}}):x.jsxs("div",{ref:h,className:"se-canvas",style:{width:he,height:H,background:i.background.type==="gradient"?`linear-gradient(180deg, ${i.background.value.split(",").join(",")})`:i.background.value},children:[x.jsx("div",{className:"se-avatar-area",style:{left:`${i.avatar.x}%`,top:`${i.avatar.y}%`,width:`${i.avatar.width}%`,height:`${i.avatar.height}%`,transform:"translate(-50%, -50%)"},children:t?x.jsx("img",{src:t,alt:n||"主播",className:"se-avatar-img"}):x.jsxs("div",{className:"se-avatar-placeholder",children:[x.jsx("span",{children:"👤"}),x.jsx("span",{style:{fontSize:Math.max(8,12*q),color:"#888"},children:n||"AI主播"})]})}),i.overlays.filter(F=>F.enabled).map(ve),i.bottomBar.enabled&&x.jsxs("div",{className:"se-bottom-bar",style:{height:i.bottomBar.height*q,backgroundColor:i.bottomBar.backgroundColor,color:i.bottomBar.textColor,fontSize:Math.max(7,10*q)},children:[i.bottomBar.showLiveDot&&x.jsx("span",{className:"se-live-dot",children:"🔴 LIVE"}),x.jsx("span",{children:i.bottomBar.text}),i.bottomBar.showTimer&&x.jsx("span",{className:"se-timer",children:"00:00"})]})]}),d&&P&&w&&x.jsxs("div",{className:"se-subtitle-bar",children:[x.jsx("span",{className:"se-subtitle-icon",children:"🗣️"}),x.jsx("span",{className:"se-subtitle-text",children:w})]})]}),x.jsx("div",{className:"se-add-bar",children:ki.map(F=>x.jsxs("button",{className:"se-add-btn",onClick:()=>ee(F.type),disabled:s,title:F.label,children:[F.icon," ",F.label]},F.type))}),i.overlays.length>0&&x.jsx("div",{className:"se-overlay-list",children:i.overlays.map(F=>{var _e;return x.jsxs("div",{className:`se-overlay-item ${F.id===a?"se-overlay-item-active":""} ${F.enabled?"":"se-overlay-item-off"}`,onClick:()=>o(F.id),children:[x.jsx("span",{className:"se-overlay-item-icon",children:(_e=ki.find(ge=>ge.type===F.type))==null?void 0:_e.icon}),x.jsx("span",{className:"se-overlay-item-label",children:F.label}),x.jsx("button",{className:"se-overlay-toggle",onClick:ge=>{ge.stopPropagation(),se(F.id)},children:F.enabled?"👁️":"🚫"}),x.jsx("button",{className:"se-overlay-delete",onClick:ge=>{ge.stopPropagation(),ne(F.id)},children:"✕"})]},F.id)})}),ce&&x.jsx(Xa,{overlay:ce,onUpdate:F=>me(ce.id,F),onStyleUpdate:F=>Se(ce.id,F),onContentUpdate:F=>ze(ce.id,F),disabled:s}),x.jsxs("div",{className:"se-bottom-bar-settings",children:[x.jsxs("label",{className:"se-checkbox-label",children:[x.jsx("input",{type:"checkbox",checked:i.bottomBar.enabled,onChange:F=>Ve({enabled:F.target.checked}),disabled:s}),"显示底部信息栏"]}),i.bottomBar.enabled&&x.jsx("input",{type:"text",value:i.bottomBar.text,onChange:F=>Ve({text:F.target.value}),placeholder:"底部滚动文字",disabled:s,className:"se-input"})]})]}):x.jsxs("div",{className:"se-full-editor",children:[x.jsxs("div",{className:"se-toolbar",children:[x.jsx("h3",{children:"🎬 直播画面编辑器"}),x.jsxs("div",{className:"se-orientation-switch",children:[x.jsx("button",{className:`se-orientation-btn ${i.orientation==="portrait"?"se-active":""}`,onClick:()=>k("portrait"),disabled:s,children:"📱 竖屏 9:16"}),x.jsx("button",{className:`se-orientation-btn ${i.orientation==="landscape"?"se-active":""}`,onClick:()=>k("landscape"),disabled:s,children:"🖥️ 横屏 16:9"})]})]}),x.jsxs("div",{className:"se-editor-body",children:[x.jsxs("div",{className:"se-left-panel",children:[x.jsx("h4",{children:"叠加元素"}),x.jsx("div",{className:"se-add-buttons",children:ki.map(F=>x.jsxs("button",{className:"se-add-type-btn",onClick:()=>ee(F.type),disabled:s,children:[F.icon," ",F.label]},F.type))}),x.jsx("div",{className:"se-overlay-list-full",children:i.overlays.length===0?x.jsx("p",{className:"se-empty-hint",children:"点击上方按钮添加叠加元素"}):i.overlays.map(F=>{var _e;return x.jsxs("div",{className:`se-overlay-item ${F.id===a?"se-overlay-item-active":""} ${F.enabled?"":"se-overlay-item-off"}`,onClick:()=>o(F.id),children:[x.jsx("span",{className:"se-overlay-item-icon",children:(_e=ki.find(ge=>ge.type===F.type))==null?void 0:_e.icon}),x.jsx("span",{className:"se-overlay-item-label",children:F.label}),x.jsxs("div",{className:"se-overlay-item-actions",children:[x.jsx("button",{onClick:ge=>{ge.stopPropagation(),se(F.id)},children:F.enabled?"👁️":"🚫"}),x.jsx("button",{onClick:ge=>{ge.stopPropagation(),ne(F.id)},children:"✕"})]})]},F.id)})})]}),x.jsx("div",{className:"se-canvas-container",children:x.jsxs("div",{ref:h,className:"se-canvas",style:{width:he,height:H,background:i.background.type==="gradient"?`linear-gradient(180deg, ${i.background.value.split(",").join(",")})`:i.background.value},children:[x.jsx("div",{className:"se-avatar-area",style:{left:`${i.avatar.x}%`,top:`${i.avatar.y}%`,width:`${i.avatar.width}%`,height:`${i.avatar.height}%`,transform:"translate(-50%, -50%)"},children:t?x.jsx("img",{src:t,alt:n||"主播",className:"se-avatar-img"}):x.jsxs("div",{className:"se-avatar-placeholder",children:[x.jsx("span",{children:"👤"}),x.jsx("span",{children:n||"AI主播"})]})}),i.overlays.filter(F=>F.enabled).map(ve),i.bottomBar.enabled&&x.jsxs("div",{className:"se-bottom-bar",style:{height:i.bottomBar.height*q,backgroundColor:i.bottomBar.backgroundColor,color:i.bottomBar.textColor,fontSize:Math.max(7,10*q)},children:[i.bottomBar.showLiveDot&&x.jsx("span",{className:"se-live-dot",children:"🔴 LIVE"}),x.jsx("span",{children:i.bottomBar.text}),i.bottomBar.showTimer&&x.jsx("span",{className:"se-timer",children:"00:00"})]})]})}),x.jsxs("div",{className:"se-right-panel",children:[ce?x.jsx(Xa,{overlay:ce,onUpdate:F=>me(ce.id,F),onStyleUpdate:F=>Se(ce.id,F),onContentUpdate:F=>ze(ce.id,F),disabled:s}):x.jsxs("div",{className:"se-no-selection",children:[x.jsx("p",{children:"👆 点击画布上的元素进行编辑"}),x.jsx("p",{className:"se-hint",children:"或点击左侧列表选择元素"})]}),x.jsxs("div",{className:"se-bottom-settings",children:[x.jsx("h4",{children:"底部信息栏"}),x.jsxs("label",{className:"se-checkbox-label",children:[x.jsx("input",{type:"checkbox",checked:i.bottomBar.enabled,onChange:F=>Ve({enabled:F.target.checked}),disabled:s}),"启用"]}),i.bottomBar.enabled&&x.jsxs(x.Fragment,{children:[x.jsx("input",{type:"text",value:i.bottomBar.text,onChange:F=>Ve({text:F.target.value}),placeholder:"底部文字",disabled:s,className:"se-input"}),x.jsxs("label",{className:"se-checkbox-label",children:[x.jsx("input",{type:"checkbox",checked:i.bottomBar.showLiveDot,onChange:F=>Ve({showLiveDot:F.target.checked}),disabled:s}),"显示LIVE红点"]}),x.jsxs("label",{className:"se-checkbox-label",children:[x.jsx("input",{type:"checkbox",checked:i.bottomBar.showTimer,onChange:F=>Ve({showTimer:F.target.checked}),disabled:s}),"显示时长"]})]})]})]})]})]})}function Xa({overlay:i,onUpdate:e,onStyleUpdate:t,onContentUpdate:n,disabled:s}){return x.jsxs("div",{className:"se-property-panel",children:[x.jsx("h4",{children:"📐 属性编辑"}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"名称"}),x.jsx("input",{type:"text",value:i.label,onChange:r=>e({label:r.target.value}),disabled:s,className:"se-input"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"位置 X% / Y%"}),x.jsxs("div",{className:"se-prop-row",children:[x.jsx("input",{type:"number",value:Math.round(i.position.x),onChange:r=>e({position:{...i.position,x:Number(r.target.value)}}),disabled:s,className:"se-input se-input-sm",min:0,max:100}),x.jsx("input",{type:"number",value:Math.round(i.position.y),onChange:r=>e({position:{...i.position,y:Number(r.target.value)}}),disabled:s,className:"se-input se-input-sm",min:0,max:100})]})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"大小 W×H (px)"}),x.jsxs("div",{className:"se-prop-row",children:[x.jsx("input",{type:"number",value:i.size.width,onChange:r=>e({size:{...i.size,width:Number(r.target.value)}}),disabled:s,className:"se-input se-input-sm"}),x.jsx("input",{type:"number",value:i.size.height,onChange:r=>e({size:{...i.size,height:Number(r.target.value)}}),disabled:s,className:"se-input se-input-sm"})]})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"字号"}),x.jsx("input",{type:"number",value:i.style.fontSize||16,onChange:r=>t({fontSize:Number(r.target.value)}),disabled:s,className:"se-input se-input-sm"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"文字颜色"}),x.jsx("input",{type:"color",value:i.style.color||"#ffffff",onChange:r=>t({color:r.target.value}),disabled:s,className:"se-input-color"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"背景颜色"}),x.jsx("input",{type:"text",value:i.style.backgroundColor||"",onChange:r=>t({backgroundColor:r.target.value}),disabled:s,placeholder:"rgba(0,0,0,0.6) 或 #ffffff",className:"se-input"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"边框颜色"}),x.jsx("input",{type:"text",value:i.style.borderColor||"",onChange:r=>t({borderColor:r.target.value}),disabled:s,placeholder:"#ffd700",className:"se-input"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"圆角 (px)"}),x.jsx("input",{type:"number",value:i.style.borderRadius||0,onChange:r=>t({borderRadius:Number(r.target.value)}),disabled:s,className:"se-input se-input-sm"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"动画"}),x.jsx("select",{value:i.animation,onChange:r=>e({animation:r.target.value}),disabled:s,className:"se-input",children:Yl.map(r=>x.jsx("option",{value:r.value,children:r.label},r.value))})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"层级"}),x.jsx("input",{type:"number",value:i.zIndex,onChange:r=>e({zIndex:Number(r.target.value)}),disabled:s,className:"se-input se-input-sm"})]}),i.type==="qrcode"&&x.jsxs(x.Fragment,{children:[x.jsx("div",{className:"se-prop-divider",children:"二维码设置"}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"提示文字"}),x.jsx("input",{type:"text",value:i.content.text||"",onChange:r=>n({text:r.target.value}),disabled:s,className:"se-input"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"二维码内容/链接"}),x.jsx("input",{type:"text",value:i.content.qrValue||"",onChange:r=>n({qrValue:r.target.value}),disabled:s,placeholder:"微信号或链接",className:"se-input"})]})]}),(i.type==="text-banner"||i.type==="led-marquee")&&x.jsxs(x.Fragment,{children:[x.jsx("div",{className:"se-prop-divider",children:"文字内容"}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"文字内容"}),x.jsx("textarea",{value:i.content.text||"",onChange:r=>n({text:r.target.value}),disabled:s,rows:i.type==="led-marquee"?1:3,className:"se-input se-textarea"})]})]}),i.type==="product-card"&&x.jsxs(x.Fragment,{children:[x.jsx("div",{className:"se-prop-divider",children:"产品信息"}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"产品名称"}),x.jsx("input",{type:"text",value:i.content.productName||"",onChange:r=>n({productName:r.target.value}),disabled:s,className:"se-input"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"价格"}),x.jsx("input",{type:"text",value:i.content.productPrice||"",onChange:r=>n({productPrice:r.target.value}),disabled:s,className:"se-input"})]}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"描述"}),x.jsx("input",{type:"text",value:i.content.text||"",onChange:r=>n({text:r.target.value}),disabled:s,className:"se-input"})]})]}),i.type==="image"&&x.jsxs(x.Fragment,{children:[x.jsx("div",{className:"se-prop-divider",children:"图片设置"}),x.jsxs("div",{className:"se-prop-group",children:[x.jsx("label",{children:"图片URL"}),x.jsx("input",{type:"text",value:i.content.imageUrl||"",onChange:r=>n({imageUrl:r.target.value}),disabled:s,placeholder:"https://...",className:"se-input"})]})]})]})}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const _a="184",Kl=0,ja=1,Zl=2,xs=1,el=2,Ci=3,Ln=0,Ut=1,pn=2,gn=0,fi=1,br=2,qa=3,Ya=4,Jl=5,Gn=100,Ql=101,ec=102,tc=103,nc=104,ic=200,sc=201,rc=202,ac=203,yr=204,Tr=205,oc=206,lc=207,cc=208,uc=209,dc=210,hc=211,fc=212,pc=213,mc=214,Ar=0,wr=1,Rr=2,mi=3,Cr=4,Pr=5,Nr=6,Lr=7,xa=0,gc=1,_c=2,rn=0,tl=1,nl=2,il=3,sl=4,rl=5,al=6,ol=7,ll=300,Wn=301,gi=302,zs=303,Gs=304,Is=306,Dr=1e3,mn=1001,Ir=1002,At=1003,xc=1004,Hi=1005,Pt=1006,Vs=1007,kn=1008,Vt=1009,cl=1010,ul=1011,Li=1012,va=1013,on=1014,nn=1015,xn=1016,Sa=1017,Ma=1018,Di=1020,dl=35902,hl=35899,fl=1021,pl=1022,Zt=1023,vn=1026,Hn=1027,ml=1028,Ea=1029,Xn=1030,ba=1031,ya=1033,vs=33776,Ss=33777,Ms=33778,Es=33779,Ur=35840,Fr=35841,Or=35842,Br=35843,zr=36196,Gr=37492,Vr=37496,kr=37488,Hr=37489,Ts=37490,Wr=37491,Xr=37808,jr=37809,qr=37810,Yr=37811,$r=37812,Kr=37813,Zr=37814,Jr=37815,Qr=37816,ea=37817,ta=37818,na=37819,ia=37820,sa=37821,ra=36492,aa=36494,oa=36495,la=36283,ca=36284,As=36285,ua=36286,vc=3200,da=0,Sc=1,Cn="",Wt="srgb",ws="srgb-linear",Rs="linear",rt="srgb",Zn=7680,$a=519,Mc=512,Ec=513,bc=514,Ta=515,yc=516,Tc=517,Aa=518,Ac=519,Ka=35044,Za="300 es",sn=2e3,Ii=2001;function wc(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Ui(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Rc(){const i=Ui("canvas");return i.style.display="block",i}const Ja={};function Qa(...i){const e="THREE."+i.shift();console.log(e,...i)}function gl(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Fe(...i){i=gl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function tt(...i){i=gl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function ha(...i){const e=i.join(" ");e in Ja||(Ja[e]=!0,Fe(...i))}function Cc(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const Pc={[Ar]:wr,[Rr]:Nr,[Cr]:Lr,[mi]:Pr,[wr]:Ar,[Nr]:Rr,[Lr]:Cr,[Pr]:mi};class jn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const s=n[e];if(s!==void 0){const r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}}const Rt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],bs=Math.PI/180,fa=180/Math.PI;function Fi(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Rt[i&255]+Rt[i>>8&255]+Rt[i>>16&255]+Rt[i>>24&255]+"-"+Rt[e&255]+Rt[e>>8&255]+"-"+Rt[e>>16&15|64]+Rt[e>>24&255]+"-"+Rt[t&63|128]+Rt[t>>8&255]+"-"+Rt[t>>16&255]+Rt[t>>24&255]+Rt[n&255]+Rt[n>>8&255]+Rt[n>>16&255]+Rt[n>>24&255]).toLowerCase()}function Je(i,e,t){return Math.max(e,Math.min(t,i))}function Nc(i,e){return(i%e+e)%e}function ks(i,e,t){return(1-t)*i+t*e}function Mi(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function It(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const La=class La{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};La.prototype.isVector2=!0;let it=La;class vi{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let c=n[s+0],l=n[s+1],f=n[s+2],p=n[s+3],u=r[a+0],m=r[a+1],_=r[a+2],E=r[a+3];if(p!==E||c!==u||l!==m||f!==_){let h=c*u+l*m+f*_+p*E;h<0&&(u=-u,m=-m,_=-_,E=-E,h=-h);let d=1-o;if(h<.9995){const M=Math.acos(h),y=Math.sin(M);d=Math.sin(d*M)/y,o=Math.sin(o*M)/y,c=c*d+u*o,l=l*d+m*o,f=f*d+_*o,p=p*d+E*o}else{c=c*d+u*o,l=l*d+m*o,f=f*d+_*o,p=p*d+E*o;const M=1/Math.sqrt(c*c+l*l+f*f+p*p);c*=M,l*=M,f*=M,p*=M}}e[t]=c,e[t+1]=l,e[t+2]=f,e[t+3]=p}static multiplyQuaternionsFlat(e,t,n,s,r,a){const o=n[s],c=n[s+1],l=n[s+2],f=n[s+3],p=r[a],u=r[a+1],m=r[a+2],_=r[a+3];return e[t]=o*_+f*p+c*m-l*u,e[t+1]=c*_+f*u+l*p-o*m,e[t+2]=l*_+f*m+o*u-c*p,e[t+3]=f*_-o*p-c*u-l*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(n/2),f=o(s/2),p=o(r/2),u=c(n/2),m=c(s/2),_=c(r/2);switch(a){case"XYZ":this._x=u*f*p+l*m*_,this._y=l*m*p-u*f*_,this._z=l*f*_+u*m*p,this._w=l*f*p-u*m*_;break;case"YXZ":this._x=u*f*p+l*m*_,this._y=l*m*p-u*f*_,this._z=l*f*_-u*m*p,this._w=l*f*p+u*m*_;break;case"ZXY":this._x=u*f*p-l*m*_,this._y=l*m*p+u*f*_,this._z=l*f*_+u*m*p,this._w=l*f*p-u*m*_;break;case"ZYX":this._x=u*f*p-l*m*_,this._y=l*m*p+u*f*_,this._z=l*f*_-u*m*p,this._w=l*f*p+u*m*_;break;case"YZX":this._x=u*f*p+l*m*_,this._y=l*m*p+u*f*_,this._z=l*f*_-u*m*p,this._w=l*f*p-u*m*_;break;case"XZY":this._x=u*f*p-l*m*_,this._y=l*m*p-u*f*_,this._z=l*f*_+u*m*p,this._w=l*f*p+u*m*_;break;default:Fe("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],c=t[9],l=t[2],f=t[6],p=t[10],u=n+o+p;if(u>0){const m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(f-c)*m,this._y=(r-l)*m,this._z=(a-s)*m}else if(n>o&&n>p){const m=2*Math.sqrt(1+n-o-p);this._w=(f-c)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+l)/m}else if(o>p){const m=2*Math.sqrt(1+o-n-p);this._w=(r-l)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(c+f)/m}else{const m=2*Math.sqrt(1+p-n-o);this._w=(a-s)/m,this._x=(r+l)/m,this._y=(c+f)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Je(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,c=t._y,l=t._z,f=t._w;return this._x=n*f+a*o+s*l-r*c,this._y=s*f+a*c+r*o-n*l,this._z=r*f+a*l+n*c-s*o,this._w=a*f-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let c=1-t;if(o<.9995){const l=Math.acos(o),f=Math.sin(l);c=Math.sin(c*l)/f,t=Math.sin(t*l)/f,this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+a*t,this._onChangeCallback()}else this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Da=class Da{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(eo.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(eo.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*s-o*n),f=2*(o*t-r*s),p=2*(r*n-a*t);return this.x=t+c*l+a*p-o*f,this.y=n+c*f+o*l-r*p,this.z=s+c*p+r*f-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,c=t.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Hs.copy(this).projectOnVector(e),this.sub(Hs)}reflect(e){return this.sub(Hs.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Da.prototype.isVector3=!0;let V=Da;const Hs=new V,eo=new vi,Ia=class Ia{constructor(e,t,n,s,r,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l)}set(e,t,n,s,r,a,o,c,l){const f=this.elements;return f[0]=e,f[1]=s,f[2]=o,f[3]=t,f[4]=r,f[5]=c,f[6]=n,f[7]=a,f[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],f=n[4],p=n[7],u=n[2],m=n[5],_=n[8],E=s[0],h=s[3],d=s[6],M=s[1],y=s[4],T=s[7],L=s[2],A=s[5],P=s[8];return r[0]=a*E+o*M+c*L,r[3]=a*h+o*y+c*A,r[6]=a*d+o*T+c*P,r[1]=l*E+f*M+p*L,r[4]=l*h+f*y+p*A,r[7]=l*d+f*T+p*P,r[2]=u*E+m*M+_*L,r[5]=u*h+m*y+_*A,r[8]=u*d+m*T+_*P,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],f=e[8];return t*a*f-t*o*l-n*r*f+n*o*c+s*r*l-s*a*c}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],f=e[8],p=f*a-o*l,u=o*c-f*r,m=l*r-a*c,_=t*p+n*u+s*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const E=1/_;return e[0]=p*E,e[1]=(s*l-f*n)*E,e[2]=(o*n-s*a)*E,e[3]=u*E,e[4]=(f*t-s*c)*E,e[5]=(s*r-o*t)*E,e[6]=m*E,e[7]=(n*c-l*t)*E,e[8]=(a*t-n*r)*E,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+e,-s*l,s*c,-s*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Ws.makeScale(e,t)),this}rotate(e){return this.premultiply(Ws.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ws.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Ia.prototype.isMatrix3=!0;let Xe=Ia;const Ws=new Xe,to=new Xe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),no=new Xe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Lc(){const i={enabled:!0,workingColorSpace:ws,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===rt&&(s.r=_n(s.r),s.g=_n(s.g),s.b=_n(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===rt&&(s.r=pi(s.r),s.g=pi(s.g),s.b=pi(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Cn?Rs:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return ha("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return ha("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[ws]:{primaries:e,whitePoint:n,transfer:Rs,toXYZ:to,fromXYZ:no,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Wt},outputColorSpaceConfig:{drawingBufferColorSpace:Wt}},[Wt]:{primaries:e,whitePoint:n,transfer:rt,toXYZ:to,fromXYZ:no,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Wt}}}),i}const Ze=Lc();function _n(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function pi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Jn;class Dc{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Jn===void 0&&(Jn=Ui("canvas")),Jn.width=e.width,Jn.height=e.height;const s=Jn.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=Jn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Ui("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=_n(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(_n(t[n]/255)*255):t[n]=_n(t[n]);return{data:t,width:e.width,height:e.height}}else return Fe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ic=0;class wa{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ic++}),this.uuid=Fi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Xs(s[a].image)):r.push(Xs(s[a]))}else r=Xs(s);n.url=r}return t||(e.images[this.uuid]=n),n}}function Xs(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Dc.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Fe("Texture: Unable to serialize Texture."),{})}let Uc=0;const js=new V;class Nt extends jn{constructor(e=Nt.DEFAULT_IMAGE,t=Nt.DEFAULT_MAPPING,n=mn,s=mn,r=Pt,a=kn,o=Zt,c=Vt,l=Nt.DEFAULT_ANISOTROPY,f=Cn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Uc++}),this.uuid=Fi(),this.name="",this.source=new wa(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new it(0,0),this.repeat=new it(1,1),this.center=new it(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(js).x}get height(){return this.source.getSize(js).y}get depth(){return this.source.getSize(js).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Fe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Fe(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ll)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Dr:e.x=e.x-Math.floor(e.x);break;case mn:e.x=e.x<0?0:1;break;case Ir:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Dr:e.y=e.y-Math.floor(e.y);break;case mn:e.y=e.y<0?0:1;break;case Ir:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Nt.DEFAULT_IMAGE=null;Nt.DEFAULT_MAPPING=ll;Nt.DEFAULT_ANISOTROPY=1;const Ua=class Ua{constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r;const c=e.elements,l=c[0],f=c[4],p=c[8],u=c[1],m=c[5],_=c[9],E=c[2],h=c[6],d=c[10];if(Math.abs(f-u)<.01&&Math.abs(p-E)<.01&&Math.abs(_-h)<.01){if(Math.abs(f+u)<.1&&Math.abs(p+E)<.1&&Math.abs(_+h)<.1&&Math.abs(l+m+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const y=(l+1)/2,T=(m+1)/2,L=(d+1)/2,A=(f+u)/4,P=(p+E)/4,S=(_+h)/4;return y>T&&y>L?y<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(y),s=A/n,r=P/n):T>L?T<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(T),n=A/s,r=S/s):L<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(L),n=P/r,s=S/r),this.set(n,s,r,t),this}let M=Math.sqrt((h-_)*(h-_)+(p-E)*(p-E)+(u-f)*(u-f));return Math.abs(M)<.001&&(M=1),this.x=(h-_)/M,this.y=(p-E)/M,this.z=(u-f)/M,this.w=Math.acos((l+m+d-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this.w=Je(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this.w=Je(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ua.prototype.isVector4=!0;let gt=Ua;class Fc extends jn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new gt(0,0,e,t),this.scissorTest=!1,this.viewport=new gt(0,0,e,t),this.textures=[];const s={width:e,height:t,depth:n.depth},r=new Nt(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){const t={minFilter:Pt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const s=Object.assign({},e.textures[t].image);this.textures[t].source=new wa(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}}class an extends Fc{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class _l extends Nt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=At,this.minFilter=At,this.wrapR=mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Oc extends Nt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=At,this.minFilter=At,this.wrapR=mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Ds=class Ds{constructor(e,t,n,s,r,a,o,c,l,f,p,u,m,_,E,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,l,f,p,u,m,_,E,h)}set(e,t,n,s,r,a,o,c,l,f,p,u,m,_,E,h){const d=this.elements;return d[0]=e,d[4]=t,d[8]=n,d[12]=s,d[1]=r,d[5]=a,d[9]=o,d[13]=c,d[2]=l,d[6]=f,d[10]=p,d[14]=u,d[3]=m,d[7]=_,d[11]=E,d[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ds().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();const t=this.elements,n=e.elements,s=1/Qn.setFromMatrixColumn(e,0).length(),r=1/Qn.setFromMatrixColumn(e,1).length(),a=1/Qn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),f=Math.cos(r),p=Math.sin(r);if(e.order==="XYZ"){const u=a*f,m=a*p,_=o*f,E=o*p;t[0]=c*f,t[4]=-c*p,t[8]=l,t[1]=m+_*l,t[5]=u-E*l,t[9]=-o*c,t[2]=E-u*l,t[6]=_+m*l,t[10]=a*c}else if(e.order==="YXZ"){const u=c*f,m=c*p,_=l*f,E=l*p;t[0]=u+E*o,t[4]=_*o-m,t[8]=a*l,t[1]=a*p,t[5]=a*f,t[9]=-o,t[2]=m*o-_,t[6]=E+u*o,t[10]=a*c}else if(e.order==="ZXY"){const u=c*f,m=c*p,_=l*f,E=l*p;t[0]=u-E*o,t[4]=-a*p,t[8]=_+m*o,t[1]=m+_*o,t[5]=a*f,t[9]=E-u*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){const u=a*f,m=a*p,_=o*f,E=o*p;t[0]=c*f,t[4]=_*l-m,t[8]=u*l+E,t[1]=c*p,t[5]=E*l+u,t[9]=m*l-_,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){const u=a*c,m=a*l,_=o*c,E=o*l;t[0]=c*f,t[4]=E-u*p,t[8]=_*p+m,t[1]=p,t[5]=a*f,t[9]=-o*f,t[2]=-l*f,t[6]=m*p+_,t[10]=u-E*p}else if(e.order==="XZY"){const u=a*c,m=a*l,_=o*c,E=o*l;t[0]=c*f,t[4]=-p,t[8]=l*f,t[1]=u*p+E,t[5]=a*f,t[9]=m*p-_,t[2]=_*p-m,t[6]=o*f,t[10]=E*p+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Bc,e,zc)}lookAt(e,t,n){const s=this.elements;return Bt.subVectors(e,t),Bt.lengthSq()===0&&(Bt.z=1),Bt.normalize(),bn.crossVectors(n,Bt),bn.lengthSq()===0&&(Math.abs(n.z)===1?Bt.x+=1e-4:Bt.z+=1e-4,Bt.normalize(),bn.crossVectors(n,Bt)),bn.normalize(),Wi.crossVectors(Bt,bn),s[0]=bn.x,s[4]=Wi.x,s[8]=Bt.x,s[1]=bn.y,s[5]=Wi.y,s[9]=Bt.y,s[2]=bn.z,s[6]=Wi.z,s[10]=Bt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],f=n[1],p=n[5],u=n[9],m=n[13],_=n[2],E=n[6],h=n[10],d=n[14],M=n[3],y=n[7],T=n[11],L=n[15],A=s[0],P=s[4],S=s[8],w=s[12],O=s[1],R=s[5],I=s[9],G=s[13],Y=s[2],N=s[6],B=s[10],k=s[14],ee=s[3],ne=s[7],se=s[11],me=s[15];return r[0]=a*A+o*O+c*Y+l*ee,r[4]=a*P+o*R+c*N+l*ne,r[8]=a*S+o*I+c*B+l*se,r[12]=a*w+o*G+c*k+l*me,r[1]=f*A+p*O+u*Y+m*ee,r[5]=f*P+p*R+u*N+m*ne,r[9]=f*S+p*I+u*B+m*se,r[13]=f*w+p*G+u*k+m*me,r[2]=_*A+E*O+h*Y+d*ee,r[6]=_*P+E*R+h*N+d*ne,r[10]=_*S+E*I+h*B+d*se,r[14]=_*w+E*G+h*k+d*me,r[3]=M*A+y*O+T*Y+L*ee,r[7]=M*P+y*R+T*N+L*ne,r[11]=M*S+y*I+T*B+L*se,r[15]=M*w+y*G+T*k+L*me,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],c=e[9],l=e[13],f=e[2],p=e[6],u=e[10],m=e[14],_=e[3],E=e[7],h=e[11],d=e[15],M=c*m-l*u,y=o*m-l*p,T=o*u-c*p,L=a*m-l*f,A=a*u-c*f,P=a*p-o*f;return t*(E*M-h*y+d*T)-n*(_*M-h*L+d*A)+s*(_*y-E*L+d*P)-r*(_*T-E*A+h*P)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],f=e[8],p=e[9],u=e[10],m=e[11],_=e[12],E=e[13],h=e[14],d=e[15],M=t*o-n*a,y=t*c-s*a,T=t*l-r*a,L=n*c-s*o,A=n*l-r*o,P=s*l-r*c,S=f*E-p*_,w=f*h-u*_,O=f*d-m*_,R=p*h-u*E,I=p*d-m*E,G=u*d-m*h,Y=M*G-y*I+T*R+L*O-A*w+P*S;if(Y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const N=1/Y;return e[0]=(o*G-c*I+l*R)*N,e[1]=(s*I-n*G-r*R)*N,e[2]=(E*P-h*A+d*L)*N,e[3]=(u*A-p*P-m*L)*N,e[4]=(c*O-a*G-l*w)*N,e[5]=(t*G-s*O+r*w)*N,e[6]=(h*T-_*P-d*y)*N,e[7]=(f*P-u*T+m*y)*N,e[8]=(a*I-o*O+l*S)*N,e[9]=(n*O-t*I-r*S)*N,e[10]=(_*A-E*T+d*M)*N,e[11]=(p*T-f*A-m*M)*N,e[12]=(o*w-a*R-c*S)*N,e[13]=(t*R-n*w+s*S)*N,e[14]=(E*y-_*L-h*M)*N,e[15]=(f*L-p*y+u*M)*N,this}scale(e){const t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,c=e.z,l=r*a,f=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,f*o+n,f*c-s*a,0,l*c-s*o,f*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,r=t._x,a=t._y,o=t._z,c=t._w,l=r+r,f=a+a,p=o+o,u=r*l,m=r*f,_=r*p,E=a*f,h=a*p,d=o*p,M=c*l,y=c*f,T=c*p,L=n.x,A=n.y,P=n.z;return s[0]=(1-(E+d))*L,s[1]=(m+T)*L,s[2]=(_-y)*L,s[3]=0,s[4]=(m-T)*A,s[5]=(1-(u+d))*A,s[6]=(h+M)*A,s[7]=0,s[8]=(_+y)*P,s[9]=(h-M)*P,s[10]=(1-(u+E))*P,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];const r=this.determinant();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Qn.set(s[0],s[1],s[2]).length();const o=Qn.set(s[4],s[5],s[6]).length(),c=Qn.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Yt.copy(this);const l=1/a,f=1/o,p=1/c;return Yt.elements[0]*=l,Yt.elements[1]*=l,Yt.elements[2]*=l,Yt.elements[4]*=f,Yt.elements[5]*=f,Yt.elements[6]*=f,Yt.elements[8]*=p,Yt.elements[9]*=p,Yt.elements[10]*=p,t.setFromRotationMatrix(Yt),n.x=a,n.y=o,n.z=c,this}makePerspective(e,t,n,s,r,a,o=sn,c=!1){const l=this.elements,f=2*r/(t-e),p=2*r/(n-s),u=(t+e)/(t-e),m=(n+s)/(n-s);let _,E;if(c)_=r/(a-r),E=a*r/(a-r);else if(o===sn)_=-(a+r)/(a-r),E=-2*a*r/(a-r);else if(o===Ii)_=-a/(a-r),E=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=f,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=p,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=E,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=sn,c=!1){const l=this.elements,f=2/(t-e),p=2/(n-s),u=-(t+e)/(t-e),m=-(n+s)/(n-s);let _,E;if(c)_=1/(a-r),E=a/(a-r);else if(o===sn)_=-2/(a-r),E=-(a+r)/(a-r);else if(o===Ii)_=-1/(a-r),E=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=f,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=p,l[9]=0,l[13]=m,l[2]=0,l[6]=0,l[10]=_,l[14]=E,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Ds.prototype.isMatrix4=!0;let pt=Ds;const Qn=new V,Yt=new pt,Bc=new V(0,0,0),zc=new V(1,1,1),bn=new V,Wi=new V,Bt=new V,io=new pt,so=new vi;class Dn{constructor(e=0,t=0,n=0,s=Dn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],f=s[9],p=s[2],u=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(Je(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-f,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Je(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-p,r),this._z=0);break;case"ZXY":this._x=Math.asin(Je(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-p,m),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Je(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Je(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-f,l),this._y=Math.atan2(-p,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Je(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-f,m),this._y=0);break;default:Fe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return io.makeRotationFromQuaternion(e),this.setFromRotationMatrix(io,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return so.setFromEuler(this),this.setFromQuaternion(so,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Dn.DEFAULT_ORDER="XYZ";class xl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Gc=0;const ro=new V,ei=new vi,cn=new pt,Xi=new V,Ei=new V,Vc=new V,kc=new vi,ao=new V(1,0,0),oo=new V(0,1,0),lo=new V(0,0,1),co={type:"added"},Hc={type:"removed"},ti={type:"childadded",child:null},qs={type:"childremoved",child:null};class bt extends jn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Gc++}),this.uuid=Fi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=bt.DEFAULT_UP.clone();const e=new V,t=new Dn,n=new vi,s=new V(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new pt},normalMatrix:{value:new Xe}}),this.matrix=new pt,this.matrixWorld=new pt,this.matrixAutoUpdate=bt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=bt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new xl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ei.setFromAxisAngle(e,t),this.quaternion.multiply(ei),this}rotateOnWorldAxis(e,t){return ei.setFromAxisAngle(e,t),this.quaternion.premultiply(ei),this}rotateX(e){return this.rotateOnAxis(ao,e)}rotateY(e){return this.rotateOnAxis(oo,e)}rotateZ(e){return this.rotateOnAxis(lo,e)}translateOnAxis(e,t){return ro.copy(e).applyQuaternion(this.quaternion),this.position.add(ro.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ao,e)}translateY(e){return this.translateOnAxis(oo,e)}translateZ(e){return this.translateOnAxis(lo,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(cn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Xi.copy(e):Xi.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Ei.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?cn.lookAt(Ei,Xi,this.up):cn.lookAt(Xi,Ei,this.up),this.quaternion.setFromRotationMatrix(cn),s&&(cn.extractRotation(s.matrixWorld),ei.setFromRotationMatrix(cn),this.quaternion.premultiply(ei.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(tt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(co),ti.child=e,this.dispatchEvent(ti),ti.child=null):tt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Hc),qs.child=e,this.dispatchEvent(qs),qs.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),cn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),cn.multiply(e.parent.matrixWorld)),e.applyMatrix4(cn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(co),ti.child=e,this.dispatchEvent(ti),ti.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ei,e,Vc),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ei,kc,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,f=c.length;l<f;l++){const p=c[l];r(e.shapes,p)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(e.materials,this.material[c]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];s.animations.push(r(e.animations,c))}}if(t){const o=a(e.geometries),c=a(e.materials),l=a(e.textures),f=a(e.images),p=a(e.shapes),u=a(e.skeletons),m=a(e.animations),_=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),f.length>0&&(n.images=f),p.length>0&&(n.shapes=p),u.length>0&&(n.skeletons=u),m.length>0&&(n.animations=m),_.length>0&&(n.nodes=_)}return n.object=s,n;function a(o){const c=[];for(const l in o){const f=o[l];delete f.metadata,c.push(f)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}}bt.DEFAULT_UP=new V(0,1,0);bt.DEFAULT_MATRIX_AUTO_UPDATE=!0;bt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Pi extends bt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Wc={type:"move"};class Ys{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Pi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Pi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new V,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new V),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Pi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new V,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new V,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(const E of e.hand.values()){const h=t.getJointPose(E,n),d=this._getHandJoint(l,E);h!==null&&(d.matrix.fromArray(h.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=h.radius),d.visible=h!==null}const f=l.joints["index-finger-tip"],p=l.joints["thumb-tip"],u=f.position.distanceTo(p.position),m=.02,_=.005;l.inputState.pinching&&u>m+_?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&u<=m-_&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Wc)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Pi;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const vl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},yn={h:0,s:0,l:0},ji={h:0,s:0,l:0};function $s(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Qe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Wt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ze.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=Ze.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ze.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=Ze.workingColorSpace){if(e=Nc(e,1),t=Je(t,0,1),n=Je(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=$s(a,r,e+1/3),this.g=$s(a,r,e),this.b=$s(a,r,e-1/3)}return Ze.colorSpaceToWorking(this,s),this}setStyle(e,t=Wt){function n(r){r!==void 0&&parseFloat(r)<1&&Fe("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Fe("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Fe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Wt){const n=vl[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Fe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=_n(e.r),this.g=_n(e.g),this.b=_n(e.b),this}copyLinearToSRGB(e){return this.r=pi(e.r),this.g=pi(e.g),this.b=pi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Wt){return Ze.workingToColorSpace(Ct.copy(this),e),Math.round(Je(Ct.r*255,0,255))*65536+Math.round(Je(Ct.g*255,0,255))*256+Math.round(Je(Ct.b*255,0,255))}getHexString(e=Wt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ze.workingColorSpace){Ze.workingToColorSpace(Ct.copy(this),t);const n=Ct.r,s=Ct.g,r=Ct.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let c,l;const f=(o+a)/2;if(o===a)c=0,l=0;else{const p=a-o;switch(l=f<=.5?p/(a+o):p/(2-a-o),a){case n:c=(s-r)/p+(s<r?6:0);break;case s:c=(r-n)/p+2;break;case r:c=(n-s)/p+4;break}c/=6}return e.h=c,e.s=l,e.l=f,e}getRGB(e,t=Ze.workingColorSpace){return Ze.workingToColorSpace(Ct.copy(this),t),e.r=Ct.r,e.g=Ct.g,e.b=Ct.b,e}getStyle(e=Wt){Ze.workingToColorSpace(Ct.copy(this),e);const t=Ct.r,n=Ct.g,s=Ct.b;return e!==Wt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(yn),this.setHSL(yn.h+e,yn.s+t,yn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(yn),e.getHSL(ji);const n=ks(yn.h,ji.h,t),s=ks(yn.s,ji.s,t),r=ks(yn.l,ji.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ct=new Qe;Qe.NAMES=vl;class Xc extends bt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Dn,this.environmentIntensity=1,this.environmentRotation=new Dn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const $t=new V,un=new V,Ks=new V,dn=new V,ni=new V,ii=new V,uo=new V,Zs=new V,Js=new V,Qs=new V,er=new gt,tr=new gt,nr=new gt;class jt{constructor(e=new V,t=new V,n=new V){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),$t.subVectors(e,t),s.cross($t);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){$t.subVectors(s,t),un.subVectors(n,t),Ks.subVectors(e,t);const a=$t.dot($t),o=$t.dot(un),c=$t.dot(Ks),l=un.dot(un),f=un.dot(Ks),p=a*l-o*o;if(p===0)return r.set(0,0,0),null;const u=1/p,m=(l*c-o*f)*u,_=(a*f-o*c)*u;return r.set(1-m-_,_,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,dn)===null?!1:dn.x>=0&&dn.y>=0&&dn.x+dn.y<=1}static getInterpolation(e,t,n,s,r,a,o,c){return this.getBarycoord(e,t,n,s,dn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,dn.x),c.addScaledVector(a,dn.y),c.addScaledVector(o,dn.z),c)}static getInterpolatedAttribute(e,t,n,s,r,a){return er.setScalar(0),tr.setScalar(0),nr.setScalar(0),er.fromBufferAttribute(e,t),tr.fromBufferAttribute(e,n),nr.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(er,r.x),a.addScaledVector(tr,r.y),a.addScaledVector(nr,r.z),a}static isFrontFacing(e,t,n,s){return $t.subVectors(n,t),un.subVectors(e,t),$t.cross(un).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return $t.subVectors(this.c,this.b),un.subVectors(this.a,this.b),$t.cross(un).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return jt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return jt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return jt.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return jt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return jt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,r=this.c;let a,o;ni.subVectors(s,n),ii.subVectors(r,n),Zs.subVectors(e,n);const c=ni.dot(Zs),l=ii.dot(Zs);if(c<=0&&l<=0)return t.copy(n);Js.subVectors(e,s);const f=ni.dot(Js),p=ii.dot(Js);if(f>=0&&p<=f)return t.copy(s);const u=c*p-f*l;if(u<=0&&c>=0&&f<=0)return a=c/(c-f),t.copy(n).addScaledVector(ni,a);Qs.subVectors(e,r);const m=ni.dot(Qs),_=ii.dot(Qs);if(_>=0&&m<=_)return t.copy(r);const E=m*l-c*_;if(E<=0&&l>=0&&_<=0)return o=l/(l-_),t.copy(n).addScaledVector(ii,o);const h=f*_-m*p;if(h<=0&&p-f>=0&&m-_>=0)return uo.subVectors(r,s),o=(p-f)/(p-f+(m-_)),t.copy(s).addScaledVector(uo,o);const d=1/(h+E+u);return a=E*d,o=u*d,t.copy(n).addScaledVector(ni,a).addScaledVector(ii,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Oi{constructor(e=new V(1/0,1/0,1/0),t=new V(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Kt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Kt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Kt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Kt):Kt.fromBufferAttribute(r,a),Kt.applyMatrix4(e.matrixWorld),this.expandByPoint(Kt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),qi.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),qi.copy(n.boundingBox)),qi.applyMatrix4(e.matrixWorld),this.union(qi)}const s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Kt),Kt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(bi),Yi.subVectors(this.max,bi),si.subVectors(e.a,bi),ri.subVectors(e.b,bi),ai.subVectors(e.c,bi),Tn.subVectors(ri,si),An.subVectors(ai,ri),Un.subVectors(si,ai);let t=[0,-Tn.z,Tn.y,0,-An.z,An.y,0,-Un.z,Un.y,Tn.z,0,-Tn.x,An.z,0,-An.x,Un.z,0,-Un.x,-Tn.y,Tn.x,0,-An.y,An.x,0,-Un.y,Un.x,0];return!ir(t,si,ri,ai,Yi)||(t=[1,0,0,0,1,0,0,0,1],!ir(t,si,ri,ai,Yi))?!1:($i.crossVectors(Tn,An),t=[$i.x,$i.y,$i.z],ir(t,si,ri,ai,Yi))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Kt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Kt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(hn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),hn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),hn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),hn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),hn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),hn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),hn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),hn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(hn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const hn=[new V,new V,new V,new V,new V,new V,new V,new V],Kt=new V,qi=new Oi,si=new V,ri=new V,ai=new V,Tn=new V,An=new V,Un=new V,bi=new V,Yi=new V,$i=new V,Fn=new V;function ir(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Fn.fromArray(i,r);const o=s.x*Math.abs(Fn.x)+s.y*Math.abs(Fn.y)+s.z*Math.abs(Fn.z),c=e.dot(Fn),l=t.dot(Fn),f=n.dot(Fn);if(Math.max(-Math.max(c,l,f),Math.min(c,l,f))>o)return!1}return!0}const vt=new V,Ki=new it;let jc=0;class qt extends jn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:jc++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Ka,this.updateRanges=[],this.gpuType=nn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ki.fromBufferAttribute(this,t),Ki.applyMatrix3(e),this.setXY(t,Ki.x,Ki.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix3(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix4(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyNormalMatrix(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.transformDirection(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Mi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=It(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Mi(t,this.array)),t}setX(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Mi(t,this.array)),t}setY(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Mi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Mi(t,this.array)),t}setW(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),n=It(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),n=It(n,this.array),s=It(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),n=It(n,this.array),s=It(s,this.array),r=It(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Ka&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}class Sl extends qt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Ml extends qt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Dt extends qt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const qc=new Oi,yi=new V,sr=new V;class Bi{constructor(e=new V,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):qc.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;yi.subVectors(e,this.center);const t=yi.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(yi,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(sr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(yi.copy(e.center).add(sr)),this.expandByPoint(yi.copy(e.center).sub(sr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Yc=0;const Ht=new pt,rr=new bt,oi=new V,zt=new Oi,Ti=new Oi,Et=new V;class Ft extends jn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Yc++}),this.uuid=Fi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(wc(e)?Ml:Sl)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Xe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Ht.makeRotationFromQuaternion(e),this.applyMatrix4(Ht),this}rotateX(e){return Ht.makeRotationX(e),this.applyMatrix4(Ht),this}rotateY(e){return Ht.makeRotationY(e),this.applyMatrix4(Ht),this}rotateZ(e){return Ht.makeRotationZ(e),this.applyMatrix4(Ht),this}translate(e,t,n){return Ht.makeTranslation(e,t,n),this.applyMatrix4(Ht),this}scale(e,t,n){return Ht.makeScale(e,t,n),this.applyMatrix4(Ht),this}lookAt(e){return rr.lookAt(e),rr.updateMatrix(),this.applyMatrix4(rr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(oi).negate(),this.translate(oi.x,oi.y,oi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let s=0,r=e.length;s<r;s++){const a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Dt(n,3))}else{const n=Math.min(e.length,t.count);for(let s=0;s<n;s++){const r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Fe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Oi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){tt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new V(-1/0,-1/0,-1/0),new V(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const r=t[n];zt.setFromBufferAttribute(r),this.morphTargetsRelative?(Et.addVectors(this.boundingBox.min,zt.min),this.boundingBox.expandByPoint(Et),Et.addVectors(this.boundingBox.max,zt.max),this.boundingBox.expandByPoint(Et)):(this.boundingBox.expandByPoint(zt.min),this.boundingBox.expandByPoint(zt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&tt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Bi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){tt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new V,1/0);return}if(e){const n=this.boundingSphere.center;if(zt.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];Ti.setFromBufferAttribute(o),this.morphTargetsRelative?(Et.addVectors(zt.min,Ti.min),zt.expandByPoint(Et),Et.addVectors(zt.max,Ti.max),zt.expandByPoint(Et)):(zt.expandByPoint(Ti.min),zt.expandByPoint(Ti.max))}zt.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Et.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Et));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],c=this.morphTargetsRelative;for(let l=0,f=o.count;l<f;l++)Et.fromBufferAttribute(o,l),c&&(oi.fromBufferAttribute(e,l),Et.add(oi)),s=Math.max(s,n.distanceToSquared(Et))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&tt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){tt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new qt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],c=[];for(let S=0;S<n.count;S++)o[S]=new V,c[S]=new V;const l=new V,f=new V,p=new V,u=new it,m=new it,_=new it,E=new V,h=new V;function d(S,w,O){l.fromBufferAttribute(n,S),f.fromBufferAttribute(n,w),p.fromBufferAttribute(n,O),u.fromBufferAttribute(r,S),m.fromBufferAttribute(r,w),_.fromBufferAttribute(r,O),f.sub(l),p.sub(l),m.sub(u),_.sub(u);const R=1/(m.x*_.y-_.x*m.y);isFinite(R)&&(E.copy(f).multiplyScalar(_.y).addScaledVector(p,-m.y).multiplyScalar(R),h.copy(p).multiplyScalar(m.x).addScaledVector(f,-_.x).multiplyScalar(R),o[S].add(E),o[w].add(E),o[O].add(E),c[S].add(h),c[w].add(h),c[O].add(h))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let S=0,w=M.length;S<w;++S){const O=M[S],R=O.start,I=O.count;for(let G=R,Y=R+I;G<Y;G+=3)d(e.getX(G+0),e.getX(G+1),e.getX(G+2))}const y=new V,T=new V,L=new V,A=new V;function P(S){L.fromBufferAttribute(s,S),A.copy(L);const w=o[S];y.copy(w),y.sub(L.multiplyScalar(L.dot(w))).normalize(),T.crossVectors(A,w);const R=T.dot(c[S])<0?-1:1;a.setXYZW(S,y.x,y.y,y.z,R)}for(let S=0,w=M.length;S<w;++S){const O=M[S],R=O.start,I=O.count;for(let G=R,Y=R+I;G<Y;G+=3)P(e.getX(G+0)),P(e.getX(G+1)),P(e.getX(G+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new qt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,m=n.count;u<m;u++)n.setXYZ(u,0,0,0);const s=new V,r=new V,a=new V,o=new V,c=new V,l=new V,f=new V,p=new V;if(e)for(let u=0,m=e.count;u<m;u+=3){const _=e.getX(u+0),E=e.getX(u+1),h=e.getX(u+2);s.fromBufferAttribute(t,_),r.fromBufferAttribute(t,E),a.fromBufferAttribute(t,h),f.subVectors(a,r),p.subVectors(s,r),f.cross(p),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,E),l.fromBufferAttribute(n,h),o.add(f),c.add(f),l.add(f),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(E,c.x,c.y,c.z),n.setXYZ(h,l.x,l.y,l.z)}else for(let u=0,m=t.count;u<m;u+=3)s.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),f.subVectors(a,r),p.subVectors(s,r),f.cross(p),n.setXYZ(u+0,f.x,f.y,f.z),n.setXYZ(u+1,f.x,f.y,f.z),n.setXYZ(u+2,f.x,f.y,f.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Et.fromBufferAttribute(e,t),Et.normalize(),e.setXYZ(t,Et.x,Et.y,Et.z)}toNonIndexed(){function e(o,c){const l=o.array,f=o.itemSize,p=o.normalized,u=new l.constructor(c.length*f);let m=0,_=0;for(let E=0,h=c.length;E<h;E++){o.isInterleavedBufferAttribute?m=c[E]*o.data.stride+o.offset:m=c[E]*f;for(let d=0;d<f;d++)u[_++]=l[m++]}return new qt(u,f,p)}if(this.index===null)return Fe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Ft,n=this.index.array,s=this.attributes;for(const o in s){const c=s[o],l=e(c,n);t.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let f=0,p=l.length;f<p;f++){const u=l[f],m=e(u,n);c.push(m)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],f=[];for(let p=0,u=l.length;p<u;p++){const m=l[p];f.push(m.toJSON(e.data))}f.length>0&&(s[c]=f,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const s=e.attributes;for(const l in s){const f=s[l];this.setAttribute(l,f.clone(t))}const r=e.morphAttributes;for(const l in r){const f=[],p=r[l];for(let u=0,m=p.length;u<m;u++)f.push(p[u].clone(t));this.morphAttributes[l]=f}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let l=0,f=a.length;l<f;l++){const p=a[l];this.addGroup(p.start,p.count,p.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}let $c=0;class qn extends jn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:$c++}),this.uuid=Fi(),this.name="",this.type="Material",this.blending=fi,this.side=Ln,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=yr,this.blendDst=Tr,this.blendEquation=Gn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Qe(0,0,0),this.blendAlpha=0,this.depthFunc=mi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=$a,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Zn,this.stencilZFail=Zn,this.stencilZPass=Zn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Fe(`Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Fe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==fi&&(n.blending=this.blending),this.side!==Ln&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==yr&&(n.blendSrc=this.blendSrc),this.blendDst!==Tr&&(n.blendDst=this.blendDst),this.blendEquation!==Gn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==mi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==$a&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Zn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Zn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Zn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(t){const r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const fn=new V,ar=new V,Zi=new V,wn=new V,or=new V,Ji=new V,lr=new V;class Ra{constructor(e=new V,t=new V(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,fn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=fn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(fn.copy(this.origin).addScaledVector(this.direction,t),fn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){ar.copy(e).add(t).multiplyScalar(.5),Zi.copy(t).sub(e).normalize(),wn.copy(this.origin).sub(ar);const r=e.distanceTo(t)*.5,a=-this.direction.dot(Zi),o=wn.dot(this.direction),c=-wn.dot(Zi),l=wn.lengthSq(),f=Math.abs(1-a*a);let p,u,m,_;if(f>0)if(p=a*c-o,u=a*o-c,_=r*f,p>=0)if(u>=-_)if(u<=_){const E=1/f;p*=E,u*=E,m=p*(p+a*u+2*o)+u*(a*p+u+2*c)+l}else u=r,p=Math.max(0,-(a*u+o)),m=-p*p+u*(u+2*c)+l;else u=-r,p=Math.max(0,-(a*u+o)),m=-p*p+u*(u+2*c)+l;else u<=-_?(p=Math.max(0,-(-a*r+o)),u=p>0?-r:Math.min(Math.max(-r,-c),r),m=-p*p+u*(u+2*c)+l):u<=_?(p=0,u=Math.min(Math.max(-r,-c),r),m=u*(u+2*c)+l):(p=Math.max(0,-(a*r+o)),u=p>0?r:Math.min(Math.max(-r,-c),r),m=-p*p+u*(u+2*c)+l);else u=a>0?-r:r,p=Math.max(0,-(a*u+o)),m=-p*p+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,p),s&&s.copy(ar).addScaledVector(Zi,u),m}intersectSphere(e,t){fn.subVectors(e.center,this.origin);const n=fn.dot(this.direction),s=fn.dot(fn)-n*n,r=e.radius*e.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,c;const l=1/this.direction.x,f=1/this.direction.y,p=1/this.direction.z,u=this.origin;return l>=0?(n=(e.min.x-u.x)*l,s=(e.max.x-u.x)*l):(n=(e.max.x-u.x)*l,s=(e.min.x-u.x)*l),f>=0?(r=(e.min.y-u.y)*f,a=(e.max.y-u.y)*f):(r=(e.max.y-u.y)*f,a=(e.min.y-u.y)*f),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),p>=0?(o=(e.min.z-u.z)*p,c=(e.max.z-u.z)*p):(o=(e.max.z-u.z)*p,c=(e.min.z-u.z)*p),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,fn)!==null}intersectTriangle(e,t,n,s,r){or.subVectors(t,e),Ji.subVectors(n,e),lr.crossVectors(or,Ji);let a=this.direction.dot(lr),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;wn.subVectors(this.origin,e);const c=o*this.direction.dot(Ji.crossVectors(wn,Ji));if(c<0)return null;const l=o*this.direction.dot(or.cross(wn));if(l<0||c+l>a)return null;const f=-o*wn.dot(lr);return f<0?null:this.at(f/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Cs extends qn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Qe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dn,this.combine=xa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ho=new pt,On=new Ra,Qi=new Bi,fo=new V,es=new V,ts=new V,ns=new V,cr=new V,is=new V,po=new V,ss=new V;class Tt extends bt{constructor(e=new Ft,t=new Cs){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const o=this.morphTargetInfluences;if(r&&o){is.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const f=o[c],p=r[c];f!==0&&(cr.fromBufferAttribute(p,e),a?is.addScaledVector(cr,f):is.addScaledVector(cr.sub(t),f))}t.add(is)}return t}raycast(e,t){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Qi.copy(n.boundingSphere),Qi.applyMatrix4(r),On.copy(e.ray).recast(e.near),!(Qi.containsPoint(On.origin)===!1&&(On.intersectSphere(Qi,fo)===null||On.origin.distanceToSquared(fo)>(e.far-e.near)**2))&&(ho.copy(r).invert(),On.copy(e.ray).applyMatrix4(ho),!(n.boundingBox!==null&&On.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,On)))}_computeIntersections(e,t,n){let s;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,f=r.attributes.uv1,p=r.attributes.normal,u=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,E=u.length;_<E;_++){const h=u[_],d=a[h.materialIndex],M=Math.max(h.start,m.start),y=Math.min(o.count,Math.min(h.start+h.count,m.start+m.count));for(let T=M,L=y;T<L;T+=3){const A=o.getX(T),P=o.getX(T+1),S=o.getX(T+2);s=rs(this,d,e,n,l,f,p,A,P,S),s&&(s.faceIndex=Math.floor(T/3),s.face.materialIndex=h.materialIndex,t.push(s))}}else{const _=Math.max(0,m.start),E=Math.min(o.count,m.start+m.count);for(let h=_,d=E;h<d;h+=3){const M=o.getX(h),y=o.getX(h+1),T=o.getX(h+2);s=rs(this,a,e,n,l,f,p,M,y,T),s&&(s.faceIndex=Math.floor(h/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,E=u.length;_<E;_++){const h=u[_],d=a[h.materialIndex],M=Math.max(h.start,m.start),y=Math.min(c.count,Math.min(h.start+h.count,m.start+m.count));for(let T=M,L=y;T<L;T+=3){const A=T,P=T+1,S=T+2;s=rs(this,d,e,n,l,f,p,A,P,S),s&&(s.faceIndex=Math.floor(T/3),s.face.materialIndex=h.materialIndex,t.push(s))}}else{const _=Math.max(0,m.start),E=Math.min(c.count,m.start+m.count);for(let h=_,d=E;h<d;h+=3){const M=h,y=h+1,T=h+2;s=rs(this,a,e,n,l,f,p,M,y,T),s&&(s.faceIndex=Math.floor(h/3),t.push(s))}}}}function Kc(i,e,t,n,s,r,a,o){let c;if(e.side===Ut?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,e.side===Ln,o),c===null)return null;ss.copy(o),ss.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(ss);return l<t.near||l>t.far?null:{distance:l,point:ss.clone(),object:i}}function rs(i,e,t,n,s,r,a,o,c,l){i.getVertexPosition(o,es),i.getVertexPosition(c,ts),i.getVertexPosition(l,ns);const f=Kc(i,e,t,n,es,ts,ns,po);if(f){const p=new V;jt.getBarycoord(po,es,ts,ns,p),s&&(f.uv=jt.getInterpolatedAttribute(s,o,c,l,p,new it)),r&&(f.uv1=jt.getInterpolatedAttribute(r,o,c,l,p,new it)),a&&(f.normal=jt.getInterpolatedAttribute(a,o,c,l,p,new V),f.normal.dot(n.direction)>0&&f.normal.multiplyScalar(-1));const u={a:o,b:c,c:l,normal:new V,materialIndex:0};jt.getNormal(es,ts,ns,u.normal),f.face=u,f.barycoord=p}return f}class Zc extends Nt{constructor(e=null,t=1,n=1,s,r,a,o,c,l=At,f=At,p,u){super(null,a,o,c,l,f,s,r,p,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ur=new V,Jc=new V,Qc=new Xe;class zn{constructor(e=new V(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=ur.subVectors(n,t).cross(Jc.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const s=e.delta(ur),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Qc.getNormalMatrix(e),s=this.coplanarPoint(ur).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Bn=new Bi,eu=new it(.5,.5),as=new V;class Ca{constructor(e=new zn,t=new zn,n=new zn,s=new zn,r=new zn,a=new zn){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=sn,n=!1){const s=this.planes,r=e.elements,a=r[0],o=r[1],c=r[2],l=r[3],f=r[4],p=r[5],u=r[6],m=r[7],_=r[8],E=r[9],h=r[10],d=r[11],M=r[12],y=r[13],T=r[14],L=r[15];if(s[0].setComponents(l-a,m-f,d-_,L-M).normalize(),s[1].setComponents(l+a,m+f,d+_,L+M).normalize(),s[2].setComponents(l+o,m+p,d+E,L+y).normalize(),s[3].setComponents(l-o,m-p,d-E,L-y).normalize(),n)s[4].setComponents(c,u,h,T).normalize(),s[5].setComponents(l-c,m-u,d-h,L-T).normalize();else if(s[4].setComponents(l-c,m-u,d-h,L-T).normalize(),t===sn)s[5].setComponents(l+c,m+u,d+h,L+T).normalize();else if(t===Ii)s[5].setComponents(c,u,h,T).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Bn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Bn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Bn)}intersectsSprite(e){Bn.center.set(0,0,0);const t=eu.distanceTo(e.center);return Bn.radius=.7071067811865476+t,Bn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Bn)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(as.x=s.normal.x>0?e.max.x:e.min.x,as.y=s.normal.y>0?e.max.y:e.min.y,as.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(as)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class El extends qn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Qe(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Ps=new V,Ns=new V,mo=new pt,Ai=new Ra,os=new Bi,dr=new V,go=new V;class tu extends bt{constructor(e=new Ft,t=new El){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)Ps.fromBufferAttribute(t,s-1),Ns.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=Ps.distanceTo(Ns);e.setAttribute("lineDistance",new Dt(n,1))}else Fe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),os.copy(n.boundingSphere),os.applyMatrix4(s),os.radius+=r,e.ray.intersectsSphere(os)===!1)return;mo.copy(s).invert(),Ai.copy(e.ray).applyMatrix4(mo);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,f=n.index,u=n.attributes.position;if(f!==null){const m=Math.max(0,a.start),_=Math.min(f.count,a.start+a.count);for(let E=m,h=_-1;E<h;E+=l){const d=f.getX(E),M=f.getX(E+1),y=ls(this,e,Ai,c,d,M,E);y&&t.push(y)}if(this.isLineLoop){const E=f.getX(_-1),h=f.getX(m),d=ls(this,e,Ai,c,E,h,_-1);d&&t.push(d)}}else{const m=Math.max(0,a.start),_=Math.min(u.count,a.start+a.count);for(let E=m,h=_-1;E<h;E+=l){const d=ls(this,e,Ai,c,E,E+1,E);d&&t.push(d)}if(this.isLineLoop){const E=ls(this,e,Ai,c,_-1,m,_-1);E&&t.push(E)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ls(i,e,t,n,s,r,a){const o=i.geometry.attributes.position;if(Ps.fromBufferAttribute(o,s),Ns.fromBufferAttribute(o,r),t.distanceSqToSegment(Ps,Ns,dr,go)>n)return;dr.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(dr);if(!(l<e.near||l>e.far))return{distance:l,point:go.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}const _o=new V,xo=new V;class nu extends tu{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)_o.fromBufferAttribute(t,s),xo.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+_o.distanceTo(xo);e.setAttribute("lineDistance",new Dt(n,1))}else Fe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class bl extends qn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Qe(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const vo=new pt,pa=new Ra,cs=new Bi,us=new V;class iu extends bt{constructor(e=new Ft,t=new bl){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),cs.copy(n.boundingSphere),cs.applyMatrix4(s),cs.radius+=r,e.ray.intersectsSphere(cs)===!1)return;vo.copy(s).invert(),pa.copy(e.ray).applyMatrix4(vo);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,p=n.attributes.position;if(l!==null){const u=Math.max(0,a.start),m=Math.min(l.count,a.start+a.count);for(let _=u,E=m;_<E;_++){const h=l.getX(_);us.fromBufferAttribute(p,h),So(us,h,c,s,e,t,this)}}else{const u=Math.max(0,a.start),m=Math.min(p.count,a.start+a.count);for(let _=u,E=m;_<E;_++)us.fromBufferAttribute(p,_),So(us,_,c,s,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function So(i,e,t,n,s,r,a){const o=pa.distanceSqToPoint(i);if(o<t){const c=new V;pa.closestPointToPoint(i,c),c.applyMatrix4(n);const l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class yl extends Nt{constructor(e=[],t=Wn,n,s,r,a,o,c,l,f){super(e,t,n,s,r,a,o,c,l,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class _i extends Nt{constructor(e,t,n=on,s,r,a,o=At,c=At,l,f=vn,p=1){if(f!==vn&&f!==Hn)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:p};super(u,s,r,a,o,c,f,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new wa(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class su extends _i{constructor(e,t=on,n=Wn,s,r,a=At,o=At,c,l=vn){const f={width:e,height:e,depth:1},p=[f,f,f,f,f,f];super(e,e,t,n,s,r,a,o,c,l),this.image=p,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Tl extends Nt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class zi extends Ft{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const c=[],l=[],f=[],p=[];let u=0,m=0;_("z","y","x",-1,-1,n,t,e,a,r,0),_("z","y","x",1,-1,n,t,-e,a,r,1),_("x","z","y",1,1,e,n,t,s,a,2),_("x","z","y",1,-1,e,n,-t,s,a,3),_("x","y","z",1,-1,e,t,n,s,r,4),_("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Dt(l,3)),this.setAttribute("normal",new Dt(f,3)),this.setAttribute("uv",new Dt(p,2));function _(E,h,d,M,y,T,L,A,P,S,w){const O=T/P,R=L/S,I=T/2,G=L/2,Y=A/2,N=P+1,B=S+1;let k=0,ee=0;const ne=new V;for(let se=0;se<B;se++){const me=se*R-G;for(let Se=0;Se<N;Se++){const ze=Se*O-I;ne[E]=ze*M,ne[h]=me*y,ne[d]=Y,l.push(ne.x,ne.y,ne.z),ne[E]=0,ne[h]=0,ne[d]=A>0?1:-1,f.push(ne.x,ne.y,ne.z),p.push(Se/P),p.push(1-se/S),k+=1}}for(let se=0;se<S;se++)for(let me=0;me<P;me++){const Se=u+me+N*se,ze=u+me+N*(se+1),Ve=u+(me+1)+N*(se+1),De=u+(me+1)+N*se;c.push(Se,ze,De),c.push(ze,Ve,De),ee+=6}o.addGroup(m,ee,w),m+=ee,u+=k}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new zi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}const ds=new V,hs=new V,hr=new V,fs=new jt;class ru extends Ft{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){const s=Math.pow(10,4),r=Math.cos(bs*t),a=e.getIndex(),o=e.getAttribute("position"),c=a?a.count:o.count,l=[0,0,0],f=["a","b","c"],p=new Array(3),u={},m=[];for(let _=0;_<c;_+=3){a?(l[0]=a.getX(_),l[1]=a.getX(_+1),l[2]=a.getX(_+2)):(l[0]=_,l[1]=_+1,l[2]=_+2);const{a:E,b:h,c:d}=fs;if(E.fromBufferAttribute(o,l[0]),h.fromBufferAttribute(o,l[1]),d.fromBufferAttribute(o,l[2]),fs.getNormal(hr),p[0]=`${Math.round(E.x*s)},${Math.round(E.y*s)},${Math.round(E.z*s)}`,p[1]=`${Math.round(h.x*s)},${Math.round(h.y*s)},${Math.round(h.z*s)}`,p[2]=`${Math.round(d.x*s)},${Math.round(d.y*s)},${Math.round(d.z*s)}`,!(p[0]===p[1]||p[1]===p[2]||p[2]===p[0]))for(let M=0;M<3;M++){const y=(M+1)%3,T=p[M],L=p[y],A=fs[f[M]],P=fs[f[y]],S=`${T}_${L}`,w=`${L}_${T}`;w in u&&u[w]?(hr.dot(u[w].normal)<=r&&(m.push(A.x,A.y,A.z),m.push(P.x,P.y,P.z)),u[w]=null):S in u||(u[S]={index0:l[M],index1:l[y],normal:hr.clone()})}}for(const _ in u)if(u[_]){const{index0:E,index1:h}=u[_];ds.fromBufferAttribute(o,E),hs.fromBufferAttribute(o,h),m.push(ds.x,ds.y,ds.z),m.push(hs.x,hs.y,hs.z)}this.setAttribute("position",new Dt(m,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class Pn extends Ft{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const r=e/2,a=t/2,o=Math.floor(n),c=Math.floor(s),l=o+1,f=c+1,p=e/o,u=t/c,m=[],_=[],E=[],h=[];for(let d=0;d<f;d++){const M=d*u-a;for(let y=0;y<l;y++){const T=y*p-r;_.push(T,-M,0),E.push(0,0,1),h.push(y/o),h.push(1-d/c)}}for(let d=0;d<c;d++)for(let M=0;M<o;M++){const y=M+l*d,T=M+l*(d+1),L=M+1+l*(d+1),A=M+1+l*d;m.push(y,T,A),m.push(T,L,A)}this.setIndex(m),this.setAttribute("position",new Dt(_,3)),this.setAttribute("normal",new Dt(E,3)),this.setAttribute("uv",new Dt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Pn(e.width,e.height,e.widthSegments,e.heightSegments)}}class Ls extends Ft{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);const c=[],l=[],f=[],p=[],u=new V,m=new V,_=new V;for(let E=0;E<=n;E++){const h=a+E/n*o;for(let d=0;d<=s;d++){const M=d/s*r;m.x=(e+t*Math.cos(h))*Math.cos(M),m.y=(e+t*Math.cos(h))*Math.sin(M),m.z=t*Math.sin(h),l.push(m.x,m.y,m.z),u.x=e*Math.cos(M),u.y=e*Math.sin(M),_.subVectors(m,u).normalize(),f.push(_.x,_.y,_.z),p.push(d/s),p.push(E/n)}}for(let E=1;E<=n;E++)for(let h=1;h<=s;h++){const d=(s+1)*E+h-1,M=(s+1)*(E-1)+h-1,y=(s+1)*(E-1)+h,T=(s+1)*E+h;c.push(d,M,T),c.push(M,y,T)}this.setIndex(c),this.setAttribute("position",new Dt(l,3)),this.setAttribute("normal",new Dt(f,3)),this.setAttribute("uv",new Dt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ls(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}function xi(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const s=i[t][n];if(Mo(s))s.isRenderTargetTexture?(Fe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(Mo(s[0])){const r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Lt(i){const e={};for(let t=0;t<i.length;t++){const n=xi(i[t]);for(const s in n)e[s]=n[s]}return e}function Mo(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function au(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Al(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ze.workingColorSpace}const ou={clone:xi,merge:Lt};var lu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,cu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ln extends qn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=lu,this.fragmentShader=cu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=xi(e.uniforms),this.uniformsGroups=au(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class uu extends ln{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class li extends qn{constructor(e){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new Qe(16777215),this.specular=new Qe(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Qe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=da,this.normalScale=new it(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dn,this.combine=xa,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class du extends qn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=vc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class hu extends qn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const fr={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(Eo(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!Eo(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function Eo(i){try{const e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class fu{constructor(e,t,n){const s=this;let r=!1,a=0,o=0,c;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(f){o++,r===!1&&s.onStart!==void 0&&s.onStart(f,a,o),r=!0},this.itemEnd=function(f){a++,s.onProgress!==void 0&&s.onProgress(f,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(f){s.onError!==void 0&&s.onError(f)},this.resolveURL=function(f){return c?c(f):f},this.setURLModifier=function(f){return c=f,this},this.addHandler=function(f,p){return l.push(f,p),this},this.removeHandler=function(f){const p=l.indexOf(f);return p!==-1&&l.splice(p,2),this},this.getHandler=function(f){for(let p=0,u=l.length;p<u;p+=2){const m=l[p],_=l[p+1];if(m.global&&(m.lastIndex=0),m.test(f))return _}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const pu=new fu;class Pa{constructor(e){this.manager=e!==void 0?e:pu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}Pa.DEFAULT_MATERIAL_NAME="__DEFAULT";const ci=new WeakMap;class mu extends Pa{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=fr.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let p=ci.get(a);p===void 0&&(p=[],ci.set(a,p)),p.push({onLoad:t,onError:s})}return a}const o=Ui("img");function c(){f(),t&&t(this);const p=ci.get(this)||[];for(let u=0;u<p.length;u++){const m=p[u];m.onLoad&&m.onLoad(this)}ci.delete(this),r.manager.itemEnd(e)}function l(p){f(),s&&s(p),fr.remove(`image:${e}`);const u=ci.get(this)||[];for(let m=0;m<u.length;m++){const _=u[m];_.onError&&_.onError(p)}ci.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function f(){o.removeEventListener("load",c,!1),o.removeEventListener("error",l,!1)}return o.addEventListener("load",c,!1),o.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),fr.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}}class bo extends Pa{constructor(e){super(e)}load(e,t,n,s){const r=new Nt,a=new mu(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}}class wl extends bt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Qe(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}const pr=new pt,yo=new V,To=new V;class gu{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new it(512,512),this.mapType=Vt,this.map=null,this.mapPass=null,this.matrix=new pt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ca,this._frameExtents=new it(1,1),this._viewportCount=1,this._viewports=[new gt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;yo.setFromMatrixPosition(e.matrixWorld),t.position.copy(yo),To.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(To),t.updateMatrixWorld(),pr.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(pr,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===Ii||t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(pr)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const ps=new V,ms=new vi,Qt=new V;class Rl extends bt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pt,this.projectionMatrix=new pt,this.projectionMatrixInverse=new pt,this.coordinateSystem=sn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ps,ms,Qt),Qt.x===1&&Qt.y===1&&Qt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ps,ms,Qt.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(ps,ms,Qt),Qt.x===1&&Qt.y===1&&Qt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ps,ms,Qt.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Rn=new V,Ao=new it,wo=new it;class Xt extends Rl{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=fa*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(bs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return fa*2*Math.atan(Math.tan(bs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Rn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Rn.x,Rn.y).multiplyScalar(-e/Rn.z),Rn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Rn.x,Rn.y).multiplyScalar(-e/Rn.z)}getViewSize(e,t){return this.getViewBounds(e,Ao,wo),t.subVectors(wo,Ao)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(bs*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,t-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Na extends Rl{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=s+t,c=s-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=f*this.view.offsetY,c=o-f*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class _u extends gu{constructor(){super(new Na(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class mr extends wl{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(bt.DEFAULT_UP),this.updateMatrix(),this.target=new bt,this.shadow=new _u}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class xu extends wl{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}const ui=-90,di=1;class vu extends bt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Xt(ui,di,e,t);s.layers=this.layers,this.add(s);const r=new Xt(ui,di,e,t);r.layers=this.layers,this.add(r);const a=new Xt(ui,di,e,t);a.layers=this.layers,this.add(a);const o=new Xt(ui,di,e,t);o.layers=this.layers,this.add(o);const c=new Xt(ui,di,e,t);c.layers=this.layers,this.add(c);const l=new Xt(ui,di,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,c]=t;for(const l of t)this.remove(l);if(e===sn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Ii)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,l,f]=this.children,p=e.getRenderTarget(),u=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const E=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;e.isWebGLRenderer===!0?h=e.state.buffers.depth.getReversed():h=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(n,4,s),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),n.texture.generateMipmaps=E,e.setRenderTarget(n,5,s),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,f),e.setRenderTarget(p,u,m),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class Su extends Xt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const Fa=class Fa{constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){const r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};Fa.prototype.isMatrix2=!0;let Ro=Fa;function Co(i,e,t,n){const s=Mu(n);switch(t){case fl:return i*e;case ml:return i*e/s.components*s.byteLength;case Ea:return i*e/s.components*s.byteLength;case Xn:return i*e*2/s.components*s.byteLength;case ba:return i*e*2/s.components*s.byteLength;case pl:return i*e*3/s.components*s.byteLength;case Zt:return i*e*4/s.components*s.byteLength;case ya:return i*e*4/s.components*s.byteLength;case vs:case Ss:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ms:case Es:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Fr:case Br:return Math.max(i,16)*Math.max(e,8)/4;case Ur:case Or:return Math.max(i,8)*Math.max(e,8)/2;case zr:case Gr:case kr:case Hr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Vr:case Ts:case Wr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Xr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case jr:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case qr:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Yr:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case $r:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Kr:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Zr:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Jr:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Qr:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case ea:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case ta:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case na:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ia:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case sa:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case ra:case aa:case oa:return Math.ceil(i/4)*Math.ceil(e/4)*16;case la:case ca:return Math.ceil(i/4)*Math.ceil(e/4)*8;case As:case ua:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Mu(i){switch(i){case Vt:case cl:return{byteLength:1,components:1};case Li:case ul:case xn:return{byteLength:2,components:1};case Sa:case Ma:return{byteLength:2,components:4};case on:case va:case nn:return{byteLength:4,components:1};case dl:case hl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:_a}}));typeof window<"u"&&(window.__THREE__?Fe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=_a);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Cl(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Eu(i){const e=new WeakMap;function t(o,c){const l=o.array,f=o.usage,p=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,f),o.onUploadCallback();let m;if(l instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)m=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)m=i.SHORT;else if(l instanceof Uint32Array)m=i.UNSIGNED_INT;else if(l instanceof Int32Array)m=i.INT;else if(l instanceof Int8Array)m=i.BYTE;else if(l instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:m,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:p}}function n(o,c,l){const f=c.array,p=c.updateRanges;if(i.bindBuffer(l,o),p.length===0)i.bufferSubData(l,0,f);else{p.sort((m,_)=>m.start-_.start);let u=0;for(let m=1;m<p.length;m++){const _=p[u],E=p[m];E.start<=_.start+_.count+1?_.count=Math.max(_.count,E.start+E.count-_.start):(++u,p[u]=E)}p.length=u+1;for(let m=0,_=p.length;m<_;m++){const E=p[m];i.bufferSubData(l,E.start*f.BYTES_PER_ELEMENT,f,E.start,E.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const f=e.get(o);(!f||f.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var bu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,yu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Tu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Au=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,wu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ru=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Cu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Pu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Nu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Lu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Du=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Iu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Uu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Fu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ou=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Bu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,zu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Gu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Vu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ku=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Hu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Wu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Xu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,ju=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,qu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Yu=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,$u=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ku=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Zu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ju=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Qu="gl_FragColor = linearToOutputTexel( gl_FragColor );",ed=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,td=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,nd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,id=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,sd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,rd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,ad=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,od=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ld=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,cd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ud=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,dd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,hd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,fd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,pd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,md=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,gd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,_d=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,xd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,vd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Sd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Md=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ed=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = inverseTransformDirection( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,bd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,yd=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Td=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Ad=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,wd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Rd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Cd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Pd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Nd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ld=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Dd=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Id=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ud=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Fd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Od=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Bd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Gd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Vd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,kd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Hd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Xd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,jd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,qd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Yd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,$d=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Kd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Zd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Jd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Qd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,eh=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,th=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,nh=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,ih=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,sh=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,rh=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,ah=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,oh=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,lh=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ch=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,uh=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,dh=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,hh=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,fh=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ph=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,mh=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,gh=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,_h=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,xh=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,vh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Sh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Mh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Eh=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const bh=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,yh=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Th=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ah=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rh=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ch=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Ph=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Nh=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Lh=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Dh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ih=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Uh=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Fh=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Oh=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Bh=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zh=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Gh=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vh=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,kh=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hh=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Wh=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Xh=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jh=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qh=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Yh=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$h=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Kh=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zh=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Jh=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qh=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ef=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,tf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,nf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ye={alphahash_fragment:bu,alphahash_pars_fragment:yu,alphamap_fragment:Tu,alphamap_pars_fragment:Au,alphatest_fragment:wu,alphatest_pars_fragment:Ru,aomap_fragment:Cu,aomap_pars_fragment:Pu,batching_pars_vertex:Nu,batching_vertex:Lu,begin_vertex:Du,beginnormal_vertex:Iu,bsdfs:Uu,iridescence_fragment:Fu,bumpmap_pars_fragment:Ou,clipping_planes_fragment:Bu,clipping_planes_pars_fragment:zu,clipping_planes_pars_vertex:Gu,clipping_planes_vertex:Vu,color_fragment:ku,color_pars_fragment:Hu,color_pars_vertex:Wu,color_vertex:Xu,common:ju,cube_uv_reflection_fragment:qu,defaultnormal_vertex:Yu,displacementmap_pars_vertex:$u,displacementmap_vertex:Ku,emissivemap_fragment:Zu,emissivemap_pars_fragment:Ju,colorspace_fragment:Qu,colorspace_pars_fragment:ed,envmap_fragment:td,envmap_common_pars_fragment:nd,envmap_pars_fragment:id,envmap_pars_vertex:sd,envmap_physical_pars_fragment:md,envmap_vertex:rd,fog_vertex:ad,fog_pars_vertex:od,fog_fragment:ld,fog_pars_fragment:cd,gradientmap_pars_fragment:ud,lightmap_pars_fragment:dd,lights_lambert_fragment:hd,lights_lambert_pars_fragment:fd,lights_pars_begin:pd,lights_toon_fragment:gd,lights_toon_pars_fragment:_d,lights_phong_fragment:xd,lights_phong_pars_fragment:vd,lights_physical_fragment:Sd,lights_physical_pars_fragment:Md,lights_fragment_begin:Ed,lights_fragment_maps:bd,lights_fragment_end:yd,lightprobes_pars_fragment:Td,logdepthbuf_fragment:Ad,logdepthbuf_pars_fragment:wd,logdepthbuf_pars_vertex:Rd,logdepthbuf_vertex:Cd,map_fragment:Pd,map_pars_fragment:Nd,map_particle_fragment:Ld,map_particle_pars_fragment:Dd,metalnessmap_fragment:Id,metalnessmap_pars_fragment:Ud,morphinstance_vertex:Fd,morphcolor_vertex:Od,morphnormal_vertex:Bd,morphtarget_pars_vertex:zd,morphtarget_vertex:Gd,normal_fragment_begin:Vd,normal_fragment_maps:kd,normal_pars_fragment:Hd,normal_pars_vertex:Wd,normal_vertex:Xd,normalmap_pars_fragment:jd,clearcoat_normal_fragment_begin:qd,clearcoat_normal_fragment_maps:Yd,clearcoat_pars_fragment:$d,iridescence_pars_fragment:Kd,opaque_fragment:Zd,packing:Jd,premultiplied_alpha_fragment:Qd,project_vertex:eh,dithering_fragment:th,dithering_pars_fragment:nh,roughnessmap_fragment:ih,roughnessmap_pars_fragment:sh,shadowmap_pars_fragment:rh,shadowmap_pars_vertex:ah,shadowmap_vertex:oh,shadowmask_pars_fragment:lh,skinbase_vertex:ch,skinning_pars_vertex:uh,skinning_vertex:dh,skinnormal_vertex:hh,specularmap_fragment:fh,specularmap_pars_fragment:ph,tonemapping_fragment:mh,tonemapping_pars_fragment:gh,transmission_fragment:_h,transmission_pars_fragment:xh,uv_pars_fragment:vh,uv_pars_vertex:Sh,uv_vertex:Mh,worldpos_vertex:Eh,background_vert:bh,background_frag:yh,backgroundCube_vert:Th,backgroundCube_frag:Ah,cube_vert:wh,cube_frag:Rh,depth_vert:Ch,depth_frag:Ph,distance_vert:Nh,distance_frag:Lh,equirect_vert:Dh,equirect_frag:Ih,linedashed_vert:Uh,linedashed_frag:Fh,meshbasic_vert:Oh,meshbasic_frag:Bh,meshlambert_vert:zh,meshlambert_frag:Gh,meshmatcap_vert:Vh,meshmatcap_frag:kh,meshnormal_vert:Hh,meshnormal_frag:Wh,meshphong_vert:Xh,meshphong_frag:jh,meshphysical_vert:qh,meshphysical_frag:Yh,meshtoon_vert:$h,meshtoon_frag:Kh,points_vert:Zh,points_frag:Jh,shadow_vert:Qh,shadow_frag:ef,sprite_vert:tf,sprite_frag:nf},Me={common:{diffuse:{value:new Qe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xe}},envmap:{envMap:{value:null},envMapRotation:{value:new Xe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xe},normalScale:{value:new it(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Qe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new V},probesMax:{value:new V},probesResolution:{value:new V}},points:{diffuse:{value:new Qe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0},uvTransform:{value:new Xe}},sprite:{diffuse:{value:new Qe(16777215)},opacity:{value:1},center:{value:new it(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}}},tn={basic:{uniforms:Lt([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.fog]),vertexShader:Ye.meshbasic_vert,fragmentShader:Ye.meshbasic_frag},lambert:{uniforms:Lt([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Qe(0)},envMapIntensity:{value:1}}]),vertexShader:Ye.meshlambert_vert,fragmentShader:Ye.meshlambert_frag},phong:{uniforms:Lt([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Qe(0)},specular:{value:new Qe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ye.meshphong_vert,fragmentShader:Ye.meshphong_frag},standard:{uniforms:Lt([Me.common,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.roughnessmap,Me.metalnessmap,Me.fog,Me.lights,{emissive:{value:new Qe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag},toon:{uniforms:Lt([Me.common,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.gradientmap,Me.fog,Me.lights,{emissive:{value:new Qe(0)}}]),vertexShader:Ye.meshtoon_vert,fragmentShader:Ye.meshtoon_frag},matcap:{uniforms:Lt([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,{matcap:{value:null}}]),vertexShader:Ye.meshmatcap_vert,fragmentShader:Ye.meshmatcap_frag},points:{uniforms:Lt([Me.points,Me.fog]),vertexShader:Ye.points_vert,fragmentShader:Ye.points_frag},dashed:{uniforms:Lt([Me.common,Me.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ye.linedashed_vert,fragmentShader:Ye.linedashed_frag},depth:{uniforms:Lt([Me.common,Me.displacementmap]),vertexShader:Ye.depth_vert,fragmentShader:Ye.depth_frag},normal:{uniforms:Lt([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,{opacity:{value:1}}]),vertexShader:Ye.meshnormal_vert,fragmentShader:Ye.meshnormal_frag},sprite:{uniforms:Lt([Me.sprite,Me.fog]),vertexShader:Ye.sprite_vert,fragmentShader:Ye.sprite_frag},background:{uniforms:{uvTransform:{value:new Xe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ye.background_vert,fragmentShader:Ye.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Xe}},vertexShader:Ye.backgroundCube_vert,fragmentShader:Ye.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ye.cube_vert,fragmentShader:Ye.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ye.equirect_vert,fragmentShader:Ye.equirect_frag},distance:{uniforms:Lt([Me.common,Me.displacementmap,{referencePosition:{value:new V},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ye.distance_vert,fragmentShader:Ye.distance_frag},shadow:{uniforms:Lt([Me.lights,Me.fog,{color:{value:new Qe(0)},opacity:{value:1}}]),vertexShader:Ye.shadow_vert,fragmentShader:Ye.shadow_frag}};tn.physical={uniforms:Lt([tn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xe},clearcoatNormalScale:{value:new it(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xe},sheen:{value:0},sheenColor:{value:new Qe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xe},transmissionSamplerSize:{value:new it},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xe},attenuationDistance:{value:0},attenuationColor:{value:new Qe(0)},specularColor:{value:new Qe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xe},anisotropyVector:{value:new it},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xe}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag};const gs={r:0,b:0,g:0},sf=new pt,Pl=new Xe;Pl.set(-1,0,0,0,1,0,0,0,1);function rf(i,e,t,n,s,r){const a=new Qe(0);let o=s===!0?0:1,c,l,f=null,p=0,u=null;function m(M){let y=M.isScene===!0?M.background:null;if(y&&y.isTexture){const T=M.backgroundBlurriness>0;y=e.get(y,T)}return y}function _(M){let y=!1;const T=m(M);T===null?h(a,o):T&&T.isColor&&(h(T,1),y=!0);const L=i.xr.getEnvironmentBlendMode();L==="additive"?t.buffers.color.setClear(0,0,0,1,r):L==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||y)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function E(M,y){const T=m(y);T&&(T.isCubeTexture||T.mapping===Is)?(l===void 0&&(l=new Tt(new zi(1,1,1),new ln({name:"BackgroundCubeMaterial",uniforms:xi(tn.backgroundCube.uniforms),vertexShader:tn.backgroundCube.vertexShader,fragmentShader:tn.backgroundCube.fragmentShader,side:Ut,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(L,A,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=T,l.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(sf.makeRotationFromEuler(y.backgroundRotation)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Pl),l.material.toneMapped=Ze.getTransfer(T.colorSpace)!==rt,(f!==T||p!==T.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,f=T,p=T.version,u=i.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null)):T&&T.isTexture&&(c===void 0&&(c=new Tt(new Pn(2,2),new ln({name:"BackgroundMaterial",uniforms:xi(tn.background.uniforms),vertexShader:tn.background.vertexShader,fragmentShader:tn.background.fragmentShader,side:Ln,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=T,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Ze.getTransfer(T.colorSpace)!==rt,T.matrixAutoUpdate===!0&&T.updateMatrix(),c.material.uniforms.uvTransform.value.copy(T.matrix),(f!==T||p!==T.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,f=T,p=T.version,u=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function h(M,y){M.getRGB(gs,Al(i)),t.buffers.color.setClear(gs.r,gs.g,gs.b,y,r)}function d(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,y=1){a.set(M),o=y,h(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,h(a,o)},render:_,addToRenderList:E,dispose:d}}function af(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null);let r=s,a=!1;function o(R,I,G,Y,N){let B=!1;const k=p(R,Y,G,I);r!==k&&(r=k,l(r.object)),B=m(R,Y,G,N),B&&_(R,Y,G,N),N!==null&&e.update(N,i.ELEMENT_ARRAY_BUFFER),(B||a)&&(a=!1,T(R,I,G,Y),N!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function c(){return i.createVertexArray()}function l(R){return i.bindVertexArray(R)}function f(R){return i.deleteVertexArray(R)}function p(R,I,G,Y){const N=Y.wireframe===!0;let B=n[I.id];B===void 0&&(B={},n[I.id]=B);const k=R.isInstancedMesh===!0?R.id:0;let ee=B[k];ee===void 0&&(ee={},B[k]=ee);let ne=ee[G.id];ne===void 0&&(ne={},ee[G.id]=ne);let se=ne[N];return se===void 0&&(se=u(c()),ne[N]=se),se}function u(R){const I=[],G=[],Y=[];for(let N=0;N<t;N++)I[N]=0,G[N]=0,Y[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:G,attributeDivisors:Y,object:R,attributes:{},index:null}}function m(R,I,G,Y){const N=r.attributes,B=I.attributes;let k=0;const ee=G.getAttributes();for(const ne in ee)if(ee[ne].location>=0){const me=N[ne];let Se=B[ne];if(Se===void 0&&(ne==="instanceMatrix"&&R.instanceMatrix&&(Se=R.instanceMatrix),ne==="instanceColor"&&R.instanceColor&&(Se=R.instanceColor)),me===void 0||me.attribute!==Se||Se&&me.data!==Se.data)return!0;k++}return r.attributesNum!==k||r.index!==Y}function _(R,I,G,Y){const N={},B=I.attributes;let k=0;const ee=G.getAttributes();for(const ne in ee)if(ee[ne].location>=0){let me=B[ne];me===void 0&&(ne==="instanceMatrix"&&R.instanceMatrix&&(me=R.instanceMatrix),ne==="instanceColor"&&R.instanceColor&&(me=R.instanceColor));const Se={};Se.attribute=me,me&&me.data&&(Se.data=me.data),N[ne]=Se,k++}r.attributes=N,r.attributesNum=k,r.index=Y}function E(){const R=r.newAttributes;for(let I=0,G=R.length;I<G;I++)R[I]=0}function h(R){d(R,0)}function d(R,I){const G=r.newAttributes,Y=r.enabledAttributes,N=r.attributeDivisors;G[R]=1,Y[R]===0&&(i.enableVertexAttribArray(R),Y[R]=1),N[R]!==I&&(i.vertexAttribDivisor(R,I),N[R]=I)}function M(){const R=r.newAttributes,I=r.enabledAttributes;for(let G=0,Y=I.length;G<Y;G++)I[G]!==R[G]&&(i.disableVertexAttribArray(G),I[G]=0)}function y(R,I,G,Y,N,B,k){k===!0?i.vertexAttribIPointer(R,I,G,N,B):i.vertexAttribPointer(R,I,G,Y,N,B)}function T(R,I,G,Y){E();const N=Y.attributes,B=G.getAttributes(),k=I.defaultAttributeValues;for(const ee in B){const ne=B[ee];if(ne.location>=0){let se=N[ee];if(se===void 0&&(ee==="instanceMatrix"&&R.instanceMatrix&&(se=R.instanceMatrix),ee==="instanceColor"&&R.instanceColor&&(se=R.instanceColor)),se!==void 0){const me=se.normalized,Se=se.itemSize,ze=e.get(se);if(ze===void 0)continue;const Ve=ze.buffer,De=ze.type,q=ze.bytesPerElement,he=De===i.INT||De===i.UNSIGNED_INT||se.gpuType===va;if(se.isInterleavedBufferAttribute){const H=se.data,ce=H.stride,ve=se.offset;if(H.isInstancedInterleavedBuffer){for(let F=0;F<ne.locationSize;F++)d(ne.location+F,H.meshPerAttribute);R.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=H.meshPerAttribute*H.count)}else for(let F=0;F<ne.locationSize;F++)h(ne.location+F);i.bindBuffer(i.ARRAY_BUFFER,Ve);for(let F=0;F<ne.locationSize;F++)y(ne.location+F,Se/ne.locationSize,De,me,ce*q,(ve+Se/ne.locationSize*F)*q,he)}else{if(se.isInstancedBufferAttribute){for(let H=0;H<ne.locationSize;H++)d(ne.location+H,se.meshPerAttribute);R.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let H=0;H<ne.locationSize;H++)h(ne.location+H);i.bindBuffer(i.ARRAY_BUFFER,Ve);for(let H=0;H<ne.locationSize;H++)y(ne.location+H,Se/ne.locationSize,De,me,Se*q,Se/ne.locationSize*H*q,he)}}else if(k!==void 0){const me=k[ee];if(me!==void 0)switch(me.length){case 2:i.vertexAttrib2fv(ne.location,me);break;case 3:i.vertexAttrib3fv(ne.location,me);break;case 4:i.vertexAttrib4fv(ne.location,me);break;default:i.vertexAttrib1fv(ne.location,me)}}}}M()}function L(){w();for(const R in n){const I=n[R];for(const G in I){const Y=I[G];for(const N in Y){const B=Y[N];for(const k in B)f(B[k].object),delete B[k];delete Y[N]}}delete n[R]}}function A(R){if(n[R.id]===void 0)return;const I=n[R.id];for(const G in I){const Y=I[G];for(const N in Y){const B=Y[N];for(const k in B)f(B[k].object),delete B[k];delete Y[N]}}delete n[R.id]}function P(R){for(const I in n){const G=n[I];for(const Y in G){const N=G[Y];if(N[R.id]===void 0)continue;const B=N[R.id];for(const k in B)f(B[k].object),delete B[k];delete N[R.id]}}}function S(R){for(const I in n){const G=n[I],Y=R.isInstancedMesh===!0?R.id:0,N=G[Y];if(N!==void 0){for(const B in N){const k=N[B];for(const ee in k)f(k[ee].object),delete k[ee];delete N[B]}delete G[Y],Object.keys(G).length===0&&delete n[I]}}}function w(){O(),a=!0,r!==s&&(r=s,l(r.object))}function O(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:w,resetDefaultState:O,dispose:L,releaseStatesOfGeometry:A,releaseStatesOfObject:S,releaseStatesOfProgram:P,initAttributes:E,enableAttribute:h,disableUnusedAttributes:M}}function of(i,e,t){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),t.update(l,n,1)}function a(c,l,f){f!==0&&(i.drawArraysInstanced(n,c,l,f),t.update(l,n,f))}function o(c,l,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,f);let u=0;for(let m=0;m<f;m++)u+=l[m];t.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function lf(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){const P=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(P){return!(P!==Zt&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(P){const S=P===xn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(P!==Vt&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==nn&&!S)}function c(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const f=c(l);f!==l&&(Fe("WebGLRenderer:",l,"not supported, using",f,"instead."),l=f);const p=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Fe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),E=i.getParameter(i.MAX_TEXTURE_SIZE),h=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),d=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),y=i.getParameter(i.MAX_VARYING_VECTORS),T=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),L=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:p,reversedDepthBuffer:u,maxTextures:m,maxVertexTextures:_,maxTextureSize:E,maxCubemapSize:h,maxAttributes:d,maxVertexUniforms:M,maxVaryings:y,maxFragmentUniforms:T,maxSamples:L,samples:A}}function cf(i){const e=this;let t=null,n=0,s=!1,r=!1;const a=new zn,o=new Xe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(p,u){const m=p.length!==0||u||n!==0||s;return s=u,n=p.length,m},this.beginShadows=function(){r=!0,f(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(p,u){t=f(p,u,0)},this.setState=function(p,u,m){const _=p.clippingPlanes,E=p.clipIntersection,h=p.clipShadows,d=i.get(p);if(!s||_===null||_.length===0||r&&!h)r?f(null):l();else{const M=r?0:n,y=M*4;let T=d.clippingState||null;c.value=T,T=f(_,u,y,m);for(let L=0;L!==y;++L)T[L]=t[L];d.clippingState=T,this.numIntersection=E?this.numPlanes:0,this.numPlanes+=M}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function f(p,u,m,_){const E=p!==null?p.length:0;let h=null;if(E!==0){if(h=c.value,_!==!0||h===null){const d=m+E*4,M=u.matrixWorldInverse;o.getNormalMatrix(M),(h===null||h.length<d)&&(h=new Float32Array(d));for(let y=0,T=m;y!==E;++y,T+=4)a.copy(p[y]).applyMatrix4(M,o),a.normal.toArray(h,T),h[T+3]=a.constant}c.value=h,c.needsUpdate=!0}return e.numPlanes=E,e.numIntersection=0,h}}const Nn=4,Po=[.125,.215,.35,.446,.526,.582],Vn=20,uf=256,wi=new Na,No=new Qe;let gr=null,_r=0,xr=0,vr=!1;const df=new V;class Lo{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){const{size:a=256,position:o=df}=r;gr=this._renderer.getRenderTarget(),_r=this._renderer.getActiveCubeFace(),xr=this._renderer.getActiveMipmapLevel(),vr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,s,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Uo(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Io(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(gr,_r,xr),this._renderer.xr.enabled=vr,e.scissorTest=!1,hi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Wn||e.mapping===gi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),gr=this._renderer.getRenderTarget(),_r=this._renderer.getActiveCubeFace(),xr=this._renderer.getActiveMipmapLevel(),vr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Pt,minFilter:Pt,generateMipmaps:!1,type:xn,format:Zt,colorSpace:ws,depthBuffer:!1},s=Do(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Do(e,t,n);const{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=hf(r)),this._blurMaterial=pf(r,e,t),this._ggxMaterial=ff(r,e,t)}return s}_compileMaterial(e){const t=new Tt(new Ft,e);this._renderer.compile(t,wi)}_sceneToCubeUV(e,t,n,s,r){const c=new Xt(90,1,t,n),l=[1,-1,1,1,1,1],f=[1,1,1,-1,-1,-1],p=this._renderer,u=p.autoClear,m=p.toneMapping;p.getClearColor(No),p.toneMapping=rn,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(s),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Tt(new zi,new Cs({name:"PMREM.Background",side:Ut,depthWrite:!1,depthTest:!1})));const E=this._backgroundBox,h=E.material;let d=!1;const M=e.background;M?M.isColor&&(h.color.copy(M),e.background=null,d=!0):(h.color.copy(No),d=!0);for(let y=0;y<6;y++){const T=y%3;T===0?(c.up.set(0,l[y],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+f[y],r.y,r.z)):T===1?(c.up.set(0,0,l[y]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+f[y],r.z)):(c.up.set(0,l[y],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+f[y]));const L=this._cubeSize;hi(s,T*L,y>2?L:0,L,L),p.setRenderTarget(s),d&&p.render(E,c),p.render(e,c)}p.toneMapping=m,p.autoClear=u,e.background=M}_textureToCubeUV(e,t){const n=this._renderer,s=e.mapping===Wn||e.mapping===gi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Uo()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Io());const r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;const o=r.uniforms;o.envMap.value=e;const c=this._cubeSize;hi(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(a,wi)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){const s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const c=a.uniforms,l=n/(this._lodMeshes.length-1),f=t/(this._lodMeshes.length-1),p=Math.sqrt(l*l-f*f),u=0+l*1.25,m=p*u,{_lodMax:_}=this,E=this._sizeLods[n],h=3*E*(n>_-Nn?n-_+Nn:0),d=4*(this._cubeSize-E);c.envMap.value=e.texture,c.roughness.value=m,c.mipInt.value=_-t,hi(r,h,d,3*E,2*E),s.setRenderTarget(r),s.render(o,wi),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=_-n,hi(e,h,d,3*E,2*E),s.setRenderTarget(e),s.render(o,wi)}_blur(e,t,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){const c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&tt("blur direction must be either latitudinal or longitudinal!");const f=3,p=this._lodMeshes[s];p.material=l;const u=l.uniforms,m=this._sizeLods[n]-1,_=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Vn-1),E=r/_,h=isFinite(r)?1+Math.floor(f*E):Vn;h>Vn&&Fe(`sigmaRadians, ${r}, is too large and will clip, as it requested ${h} samples when the maximum is set to ${Vn}`);const d=[];let M=0;for(let P=0;P<Vn;++P){const S=P/E,w=Math.exp(-S*S/2);d.push(w),P===0?M+=w:P<h&&(M+=2*w)}for(let P=0;P<d.length;P++)d[P]=d[P]/M;u.envMap.value=e.texture,u.samples.value=h,u.weights.value=d,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:y}=this;u.dTheta.value=_,u.mipInt.value=y-n;const T=this._sizeLods[s],L=3*T*(s>y-Nn?s-y+Nn:0),A=4*(this._cubeSize-T);hi(t,L,A,3*T,2*T),c.setRenderTarget(t),c.render(p,wi)}}function hf(i){const e=[],t=[],n=[];let s=i;const r=i-Nn+1+Po.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);e.push(o);let c=1/o;a>i-Nn?c=Po[a-i+Nn-1]:a===0&&(c=0),t.push(c);const l=1/(o-2),f=-l,p=1+l,u=[f,f,p,f,p,p,f,f,p,p,f,p],m=6,_=6,E=3,h=2,d=1,M=new Float32Array(E*_*m),y=new Float32Array(h*_*m),T=new Float32Array(d*_*m);for(let A=0;A<m;A++){const P=A%3*2/3-1,S=A>2?0:-1,w=[P,S,0,P+2/3,S,0,P+2/3,S+1,0,P,S,0,P+2/3,S+1,0,P,S+1,0];M.set(w,E*_*A),y.set(u,h*_*A);const O=[A,A,A,A,A,A];T.set(O,d*_*A)}const L=new Ft;L.setAttribute("position",new qt(M,E)),L.setAttribute("uv",new qt(y,h)),L.setAttribute("faceIndex",new qt(T,d)),n.push(new Tt(L,null)),s>Nn&&s--}return{lodMeshes:n,sizeLods:e,sigmas:t}}function Do(i,e,t){const n=new an(i,e,t);return n.texture.mapping=Is,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function hi(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function ff(i,e,t){return new ln({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:uf,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Us(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function pf(i,e,t){const n=new Float32Array(Vn),s=new V(0,1,0);return new ln({name:"SphericalGaussianBlur",defines:{n:Vn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Us(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Io(){return new ln({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Us(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Uo(){return new ln({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Us(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Us(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class Nl extends an{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new yl(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new zi(5,5,5),r=new ln({name:"CubemapFromEquirect",uniforms:xi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ut,blending:gn});r.uniforms.tEquirect.value=t;const a=new Tt(s,r),o=t.minFilter;return t.minFilter===kn&&(t.minFilter=Pt),new vu(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}}function mf(i){let e=new WeakMap,t=new WeakMap,n=null;function s(u,m=!1){return u==null?null:m?a(u):r(u)}function r(u){if(u&&u.isTexture){const m=u.mapping;if(m===zs||m===Gs)if(e.has(u)){const _=e.get(u).texture;return o(_,u.mapping)}else{const _=u.image;if(_&&_.height>0){const E=new Nl(_.height);return E.fromEquirectangularTexture(i,u),e.set(u,E),u.addEventListener("dispose",l),o(E.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){const m=u.mapping,_=m===zs||m===Gs,E=m===Wn||m===gi;if(_||E){let h=t.get(u);const d=h!==void 0?h.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==d)return n===null&&(n=new Lo(i)),h=_?n.fromEquirectangular(u,h):n.fromCubemap(u,h),h.texture.pmremVersion=u.pmremVersion,t.set(u,h),h.texture;if(h!==void 0)return h.texture;{const M=u.image;return _&&M&&M.height>0||E&&M&&c(M)?(n===null&&(n=new Lo(i)),h=_?n.fromEquirectangular(u):n.fromCubemap(u),h.texture.pmremVersion=u.pmremVersion,t.set(u,h),u.addEventListener("dispose",f),h.texture):null}}}return u}function o(u,m){return m===zs?u.mapping=Wn:m===Gs&&(u.mapping=gi),u}function c(u){let m=0;const _=6;for(let E=0;E<_;E++)u[E]!==void 0&&m++;return m===_}function l(u){const m=u.target;m.removeEventListener("dispose",l);const _=e.get(m);_!==void 0&&(e.delete(m),_.dispose())}function f(u){const m=u.target;m.removeEventListener("dispose",f);const _=t.get(m);_!==void 0&&(t.delete(m),_.dispose())}function p(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:p}}function gf(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const s=t(n);return s===null&&ha("WebGLRenderer: "+n+" extension not supported."),s}}}function _f(i,e,t,n){const s={},r=new WeakMap;function a(p){const u=p.target;u.index!==null&&e.remove(u.index);for(const _ in u.attributes)e.remove(u.attributes[_]);u.removeEventListener("dispose",a),delete s[u.id];const m=r.get(u);m&&(e.remove(m),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(p,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,t.memory.geometries++),u}function c(p){const u=p.attributes;for(const m in u)e.update(u[m],i.ARRAY_BUFFER)}function l(p){const u=[],m=p.index,_=p.attributes.position;let E=0;if(_===void 0)return;if(m!==null){const M=m.array;E=m.version;for(let y=0,T=M.length;y<T;y+=3){const L=M[y+0],A=M[y+1],P=M[y+2];u.push(L,A,A,P,P,L)}}else{const M=_.array;E=_.version;for(let y=0,T=M.length/3-1;y<T;y+=3){const L=y+0,A=y+1,P=y+2;u.push(L,A,A,P,P,L)}}const h=new(_.count>=65535?Ml:Sl)(u,1);h.version=E;const d=r.get(p);d&&e.remove(d),r.set(p,h)}function f(p){const u=r.get(p);if(u){const m=p.index;m!==null&&u.version<m.version&&l(p)}else l(p);return r.get(p)}return{get:o,update:c,getWireframeAttribute:f}}function xf(i,e,t){let n;function s(p){n=p}let r,a;function o(p){r=p.type,a=p.bytesPerElement}function c(p,u){i.drawElements(n,u,r,p*a),t.update(u,n,1)}function l(p,u,m){m!==0&&(i.drawElementsInstanced(n,u,r,p*a,m),t.update(u,n,m))}function f(p,u,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,p,0,m);let E=0;for(let h=0;h<m;h++)E+=u[h];t.update(E,n,1)}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=f}function vf(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:tt("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Sf(i,e,t){const n=new WeakMap,s=new gt;function r(a,o,c){const l=a.morphTargetInfluences,f=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=f!==void 0?f.length:0;let u=n.get(o);if(u===void 0||u.count!==p){let w=function(){P.dispose(),n.delete(o),o.removeEventListener("dispose",w)};u!==void 0&&u.texture.dispose();const m=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,E=o.morphAttributes.color!==void 0,h=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let y=0;m===!0&&(y=1),_===!0&&(y=2),E===!0&&(y=3);let T=o.attributes.position.count*y,L=1;T>e.maxTextureSize&&(L=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const A=new Float32Array(T*L*4*p),P=new _l(A,T,L,p);P.type=nn,P.needsUpdate=!0;const S=y*4;for(let O=0;O<p;O++){const R=h[O],I=d[O],G=M[O],Y=T*L*4*O;for(let N=0;N<R.count;N++){const B=N*S;m===!0&&(s.fromBufferAttribute(R,N),A[Y+B+0]=s.x,A[Y+B+1]=s.y,A[Y+B+2]=s.z,A[Y+B+3]=0),_===!0&&(s.fromBufferAttribute(I,N),A[Y+B+4]=s.x,A[Y+B+5]=s.y,A[Y+B+6]=s.z,A[Y+B+7]=0),E===!0&&(s.fromBufferAttribute(G,N),A[Y+B+8]=s.x,A[Y+B+9]=s.y,A[Y+B+10]=s.z,A[Y+B+11]=G.itemSize===4?s.w:1)}}u={count:p,texture:P,size:new it(T,L)},n.set(o,u),o.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let E=0;E<l.length;E++)m+=l[E];const _=o.morphTargetsRelative?1:1-m;c.getUniforms().setValue(i,"morphTargetBaseInfluence",_),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",u.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function Mf(i,e,t,n,s){let r=new WeakMap;function a(l){const f=s.render.frame,p=l.geometry,u=e.get(l,p);if(r.get(u)!==f&&(e.update(u),r.set(u,f)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==f&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,f))),l.isSkinnedMesh){const m=l.skeleton;r.get(m)!==f&&(m.update(),r.set(m,f))}return u}function o(){r=new WeakMap}function c(l){const f=l.target;f.removeEventListener("dispose",c),n.releaseStatesOfObject(f),t.remove(f.instanceMatrix),f.instanceColor!==null&&t.remove(f.instanceColor)}return{update:a,dispose:o}}const Ef={[tl]:"LINEAR_TONE_MAPPING",[nl]:"REINHARD_TONE_MAPPING",[il]:"CINEON_TONE_MAPPING",[sl]:"ACES_FILMIC_TONE_MAPPING",[al]:"AGX_TONE_MAPPING",[ol]:"NEUTRAL_TONE_MAPPING",[rl]:"CUSTOM_TONE_MAPPING"};function bf(i,e,t,n,s){const r=new an(e,t,{type:i,depthBuffer:n,stencilBuffer:s,depthTexture:n?new _i(e,t):void 0}),a=new an(e,t,{type:xn,depthBuffer:!1,stencilBuffer:!1}),o=new Ft;o.setAttribute("position",new Dt([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new Dt([0,2,0,0,2,0],2));const c=new uu({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),l=new Tt(o,c),f=new Na(-1,1,1,-1,0,1);let p=null,u=null,m=!1,_,E=null,h=[],d=!1;this.setSize=function(M,y){r.setSize(M,y),a.setSize(M,y);for(let T=0;T<h.length;T++){const L=h[T];L.setSize&&L.setSize(M,y)}},this.setEffects=function(M){h=M,d=h.length>0&&h[0].isRenderPass===!0;const y=r.width,T=r.height;for(let L=0;L<h.length;L++){const A=h[L];A.setSize&&A.setSize(y,T)}},this.begin=function(M,y){if(m||M.toneMapping===rn&&h.length===0)return!1;if(E=y,y!==null){const T=y.width,L=y.height;(r.width!==T||r.height!==L)&&this.setSize(T,L)}return d===!1&&M.setRenderTarget(r),_=M.toneMapping,M.toneMapping=rn,!0},this.hasRenderPass=function(){return d},this.end=function(M,y){M.toneMapping=_,m=!0;let T=r,L=a;for(let A=0;A<h.length;A++){const P=h[A];if(P.enabled!==!1&&(P.render(M,L,T,y),P.needsSwap!==!1)){const S=T;T=L,L=S}}if(p!==M.outputColorSpace||u!==M.toneMapping){p=M.outputColorSpace,u=M.toneMapping,c.defines={},Ze.getTransfer(p)===rt&&(c.defines.SRGB_TRANSFER="");const A=Ef[u];A&&(c.defines[A]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=T.texture,M.setRenderTarget(E),M.render(l,f),E=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){r.depthTexture&&r.depthTexture.dispose(),r.dispose(),a.dispose(),o.dispose(),c.dispose()}}const Ll=new Nt,ma=new _i(1,1),Dl=new _l,Il=new Oc,Ul=new yl,Fo=[],Oo=[],Bo=new Float32Array(16),zo=new Float32Array(9),Go=new Float32Array(4);function Si(i,e,t){const n=i[0];if(n<=0||n>0)return i;const s=e*t;let r=Fo[s];if(r===void 0&&(r=new Float32Array(s),Fo[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function St(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Mt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Fs(i,e){let t=Oo[e];t===void 0&&(t=new Int32Array(e),Oo[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function yf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Tf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;i.uniform2fv(this.addr,e),Mt(t,e)}}function Af(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(St(t,e))return;i.uniform3fv(this.addr,e),Mt(t,e)}}function wf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;i.uniform4fv(this.addr,e),Mt(t,e)}}function Rf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,n))return;Go.set(n),i.uniformMatrix2fv(this.addr,!1,Go),Mt(t,n)}}function Cf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,n))return;zo.set(n),i.uniformMatrix3fv(this.addr,!1,zo),Mt(t,n)}}function Pf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,n))return;Bo.set(n),i.uniformMatrix4fv(this.addr,!1,Bo),Mt(t,n)}}function Nf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Lf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;i.uniform2iv(this.addr,e),Mt(t,e)}}function Df(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;i.uniform3iv(this.addr,e),Mt(t,e)}}function If(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;i.uniform4iv(this.addr,e),Mt(t,e)}}function Uf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Ff(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;i.uniform2uiv(this.addr,e),Mt(t,e)}}function Of(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;i.uniform3uiv(this.addr,e),Mt(t,e)}}function Bf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;i.uniform4uiv(this.addr,e),Mt(t,e)}}function zf(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(ma.compareFunction=t.isReversedDepthBuffer()?Aa:Ta,r=ma):r=Ll,t.setTexture2D(e||r,s)}function Gf(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Il,s)}function Vf(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Ul,s)}function kf(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Dl,s)}function Hf(i){switch(i){case 5126:return yf;case 35664:return Tf;case 35665:return Af;case 35666:return wf;case 35674:return Rf;case 35675:return Cf;case 35676:return Pf;case 5124:case 35670:return Nf;case 35667:case 35671:return Lf;case 35668:case 35672:return Df;case 35669:case 35673:return If;case 5125:return Uf;case 36294:return Ff;case 36295:return Of;case 36296:return Bf;case 35678:case 36198:case 36298:case 36306:case 35682:return zf;case 35679:case 36299:case 36307:return Gf;case 35680:case 36300:case 36308:case 36293:return Vf;case 36289:case 36303:case 36311:case 36292:return kf}}function Wf(i,e){i.uniform1fv(this.addr,e)}function Xf(i,e){const t=Si(e,this.size,2);i.uniform2fv(this.addr,t)}function jf(i,e){const t=Si(e,this.size,3);i.uniform3fv(this.addr,t)}function qf(i,e){const t=Si(e,this.size,4);i.uniform4fv(this.addr,t)}function Yf(i,e){const t=Si(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function $f(i,e){const t=Si(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Kf(i,e){const t=Si(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Zf(i,e){i.uniform1iv(this.addr,e)}function Jf(i,e){i.uniform2iv(this.addr,e)}function Qf(i,e){i.uniform3iv(this.addr,e)}function ep(i,e){i.uniform4iv(this.addr,e)}function tp(i,e){i.uniform1uiv(this.addr,e)}function np(i,e){i.uniform2uiv(this.addr,e)}function ip(i,e){i.uniform3uiv(this.addr,e)}function sp(i,e){i.uniform4uiv(this.addr,e)}function rp(i,e,t){const n=this.cache,s=e.length,r=Fs(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Mt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=ma:a=Ll;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function ap(i,e,t){const n=this.cache,s=e.length,r=Fs(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Mt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Il,r[a])}function op(i,e,t){const n=this.cache,s=e.length,r=Fs(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Mt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Ul,r[a])}function lp(i,e,t){const n=this.cache,s=e.length,r=Fs(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Mt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Dl,r[a])}function cp(i){switch(i){case 5126:return Wf;case 35664:return Xf;case 35665:return jf;case 35666:return qf;case 35674:return Yf;case 35675:return $f;case 35676:return Kf;case 5124:case 35670:return Zf;case 35667:case 35671:return Jf;case 35668:case 35672:return Qf;case 35669:case 35673:return ep;case 5125:return tp;case 36294:return np;case 36295:return ip;case 36296:return sp;case 35678:case 36198:case 36298:case 36306:case 35682:return rp;case 35679:case 36299:case 36307:return ap;case 35680:case 36300:case 36308:case 36293:return op;case 36289:case 36303:case 36311:case 36292:return lp}}class up{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Hf(t.type)}}class dp{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=cp(t.type)}}class hp{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(e,t[o.id],n)}}}const Sr=/(\w+)(\])?(\[|\.)?/g;function Vo(i,e){i.seq.push(e),i.map[e.id]=e}function fp(i,e,t){const n=i.name,s=n.length;for(Sr.lastIndex=0;;){const r=Sr.exec(n),a=Sr.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){Vo(t,l===void 0?new up(o,i,e):new dp(o,i,e));break}else{let p=t.map[o];p===void 0&&(p=new hp(o),Vo(t,p)),t=p}}}class ys{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),c=e.getUniformLocation(t,o.name);fp(o,c,this)}const s=[],r=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){const r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){const o=t[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,r=e.length;s!==r;++s){const a=e[s];a.id in t&&n.push(a)}return n}}function ko(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const pp=37297;let mp=0;function gp(i,e){const t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const Ho=new Xe;function _p(i){Ze._getMatrix(Ho,Ze.workingColorSpace,i);const e=`mat3( ${Ho.elements.map(t=>t.toFixed(4))} )`;switch(Ze.getTransfer(i)){case Rs:return[e,"LinearTransferOETF"];case rt:return[e,"sRGBTransferOETF"];default:return Fe("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Wo(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+gp(i.getShaderSource(e),o)}else return r}function xp(i,e){const t=_p(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const vp={[tl]:"Linear",[nl]:"Reinhard",[il]:"Cineon",[sl]:"ACESFilmic",[al]:"AgX",[ol]:"Neutral",[rl]:"Custom"};function Sp(i,e){const t=vp[e];return t===void 0?(Fe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const _s=new V;function Mp(){Ze.getLuminanceCoefficients(_s);const i=_s.x.toFixed(4),e=_s.y.toFixed(4),t=_s.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Ep(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ni).join(`
`)}function bp(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function yp(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(e,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Ni(i){return i!==""}function Xo(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function jo(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Tp=/^[ \t]*#include +<([\w\d./]+)>/gm;function ga(i){return i.replace(Tp,wp)}const Ap=new Map;function wp(i,e){let t=Ye[e];if(t===void 0){const n=Ap.get(e);if(n!==void 0)t=Ye[n],Fe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return ga(t)}const Rp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function qo(i){return i.replace(Rp,Cp)}function Cp(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Yo(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Pp={[xs]:"SHADOWMAP_TYPE_PCF",[Ci]:"SHADOWMAP_TYPE_VSM"};function Np(i){return Pp[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Lp={[Wn]:"ENVMAP_TYPE_CUBE",[gi]:"ENVMAP_TYPE_CUBE",[Is]:"ENVMAP_TYPE_CUBE_UV"};function Dp(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Lp[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const Ip={[gi]:"ENVMAP_MODE_REFRACTION"};function Up(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Ip[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Fp={[xa]:"ENVMAP_BLENDING_MULTIPLY",[gc]:"ENVMAP_BLENDING_MIX",[_c]:"ENVMAP_BLENDING_ADD"};function Op(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Fp[i.combine]||"ENVMAP_BLENDING_NONE"}function Bp(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function zp(i,e,t,n){const s=i.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const c=Np(t),l=Dp(t),f=Up(t),p=Op(t),u=Bp(t),m=Ep(t),_=bp(r),E=s.createProgram();let h,d,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Ni).join(`
`),h.length>0&&(h+=`
`),d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Ni).join(`
`),d.length>0&&(d+=`
`)):(h=[Yo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ni).join(`
`),d=[Yo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+f:"",t.envMap?"#define "+p:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==rn?"#define TONE_MAPPING":"",t.toneMapping!==rn?Ye.tonemapping_pars_fragment:"",t.toneMapping!==rn?Sp("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ye.colorspace_pars_fragment,xp("linearToOutputTexel",t.outputColorSpace),Mp(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ni).join(`
`)),a=ga(a),a=Xo(a,t),a=jo(a,t),o=ga(o),o=Xo(o,t),o=jo(o,t),a=qo(a),o=qo(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,h=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+h,d=["#define varying in",t.glslVersion===Za?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Za?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);const y=M+h+a,T=M+d+o,L=ko(s,s.VERTEX_SHADER,y),A=ko(s,s.FRAGMENT_SHADER,T);s.attachShader(E,L),s.attachShader(E,A),t.index0AttributeName!==void 0?s.bindAttribLocation(E,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(E,0,"position"),s.linkProgram(E);function P(R){if(i.debug.checkShaderErrors){const I=s.getProgramInfoLog(E)||"",G=s.getShaderInfoLog(L)||"",Y=s.getShaderInfoLog(A)||"",N=I.trim(),B=G.trim(),k=Y.trim();let ee=!0,ne=!0;if(s.getProgramParameter(E,s.LINK_STATUS)===!1)if(ee=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,E,L,A);else{const se=Wo(s,L,"vertex"),me=Wo(s,A,"fragment");tt("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(E,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+N+`
`+se+`
`+me)}else N!==""?Fe("WebGLProgram: Program Info Log:",N):(B===""||k==="")&&(ne=!1);ne&&(R.diagnostics={runnable:ee,programLog:N,vertexShader:{log:B,prefix:h},fragmentShader:{log:k,prefix:d}})}s.deleteShader(L),s.deleteShader(A),S=new ys(s,E),w=yp(s,E)}let S;this.getUniforms=function(){return S===void 0&&P(this),S};let w;this.getAttributes=function(){return w===void 0&&P(this),w};let O=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return O===!1&&(O=s.getProgramParameter(E,pp)),O},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(E),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=mp++,this.cacheKey=e,this.usedTimes=1,this.program=E,this.vertexShader=L,this.fragmentShader=A,this}let Gp=0;class Vp{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new kp(e),t.set(e,n)),n}}class kp{constructor(e){this.id=Gp++,this.code=e,this.usedTimes=0}}function Hp(i){return i===Xn||i===Ts||i===As}function Wp(i,e,t,n,s,r){const a=new xl,o=new Vp,c=new Set,l=[],f=new Map,p=n.logarithmicDepthBuffer;let u=n.precision;const m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return c.add(S),S===0?"uv":`uv${S}`}function E(S,w,O,R,I,G){const Y=R.fog,N=I.geometry,B=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?R.environment:null,k=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap,ee=e.get(S.envMap||B,k),ne=ee&&ee.mapping===Is?ee.image.height:null,se=m[S.type];S.precision!==null&&(u=n.getMaxPrecision(S.precision),u!==S.precision&&Fe("WebGLProgram.getParameters:",S.precision,"not supported, using",u,"instead."));const me=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,Se=me!==void 0?me.length:0;let ze=0;N.morphAttributes.position!==void 0&&(ze=1),N.morphAttributes.normal!==void 0&&(ze=2),N.morphAttributes.color!==void 0&&(ze=3);let Ve,De,q,he;if(se){const Ge=tn[se];Ve=Ge.vertexShader,De=Ge.fragmentShader}else Ve=S.vertexShader,De=S.fragmentShader,o.update(S),q=o.getVertexShaderID(S),he=o.getFragmentShaderID(S);const H=i.getRenderTarget(),ce=i.state.buffers.depth.getReversed(),ve=I.isInstancedMesh===!0,F=I.isBatchedMesh===!0,_e=!!S.map,ge=!!S.matcap,xe=!!ee,Oe=!!S.aoMap,Ce=!!S.lightMap,Ke=!!S.bumpMap,qe=!!S.normalMap,dt=!!S.displacementMap,D=!!S.emissiveMap,ot=!!S.metalnessMap,Ue=!!S.roughnessMap,nt=S.anisotropy>0,fe=S.clearcoat>0,st=S.dispersion>0,b=S.iridescence>0,g=S.sheen>0,z=S.transmission>0,Z=nt&&!!S.anisotropyMap,te=fe&&!!S.clearcoatMap,ae=fe&&!!S.clearcoatNormalMap,pe=fe&&!!S.clearcoatRoughnessMap,$=b&&!!S.iridescenceMap,J=b&&!!S.iridescenceThicknessMap,Ee=g&&!!S.sheenColorMap,Ae=g&&!!S.sheenRoughnessMap,ue=!!S.specularMap,le=!!S.specularColorMap,Be=!!S.specularIntensityMap,ke=z&&!!S.transmissionMap,He=z&&!!S.thicknessMap,C=!!S.gradientMap,oe=!!S.alphaMap,K=S.alphaTest>0,Te=!!S.alphaHash,de=!!S.extensions;let ie=rn;S.toneMapped&&(H===null||H.isXRRenderTarget===!0)&&(ie=i.toneMapping);const Pe={shaderID:se,shaderType:S.type,shaderName:S.name,vertexShader:Ve,fragmentShader:De,defines:S.defines,customVertexShaderID:q,customFragmentShaderID:he,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:u,batching:F,batchingColor:F&&I._colorsTexture!==null,instancing:ve,instancingColor:ve&&I.instanceColor!==null,instancingMorph:ve&&I.morphTexture!==null,outputColorSpace:H===null?i.outputColorSpace:H.isXRRenderTarget===!0?H.texture.colorSpace:Ze.workingColorSpace,alphaToCoverage:!!S.alphaToCoverage,map:_e,matcap:ge,envMap:xe,envMapMode:xe&&ee.mapping,envMapCubeUVHeight:ne,aoMap:Oe,lightMap:Ce,bumpMap:Ke,normalMap:qe,displacementMap:dt,emissiveMap:D,normalMapObjectSpace:qe&&S.normalMapType===Sc,normalMapTangentSpace:qe&&S.normalMapType===da,packedNormalMap:qe&&S.normalMapType===da&&Hp(S.normalMap.format),metalnessMap:ot,roughnessMap:Ue,anisotropy:nt,anisotropyMap:Z,clearcoat:fe,clearcoatMap:te,clearcoatNormalMap:ae,clearcoatRoughnessMap:pe,dispersion:st,iridescence:b,iridescenceMap:$,iridescenceThicknessMap:J,sheen:g,sheenColorMap:Ee,sheenRoughnessMap:Ae,specularMap:ue,specularColorMap:le,specularIntensityMap:Be,transmission:z,transmissionMap:ke,thicknessMap:He,gradientMap:C,opaque:S.transparent===!1&&S.blending===fi&&S.alphaToCoverage===!1,alphaMap:oe,alphaTest:K,alphaHash:Te,combine:S.combine,mapUv:_e&&_(S.map.channel),aoMapUv:Oe&&_(S.aoMap.channel),lightMapUv:Ce&&_(S.lightMap.channel),bumpMapUv:Ke&&_(S.bumpMap.channel),normalMapUv:qe&&_(S.normalMap.channel),displacementMapUv:dt&&_(S.displacementMap.channel),emissiveMapUv:D&&_(S.emissiveMap.channel),metalnessMapUv:ot&&_(S.metalnessMap.channel),roughnessMapUv:Ue&&_(S.roughnessMap.channel),anisotropyMapUv:Z&&_(S.anisotropyMap.channel),clearcoatMapUv:te&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:ae&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:pe&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:$&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:J&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:Ee&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:Ae&&_(S.sheenRoughnessMap.channel),specularMapUv:ue&&_(S.specularMap.channel),specularColorMapUv:le&&_(S.specularColorMap.channel),specularIntensityMapUv:Be&&_(S.specularIntensityMap.channel),transmissionMapUv:ke&&_(S.transmissionMap.channel),thicknessMapUv:He&&_(S.thicknessMap.channel),alphaMapUv:oe&&_(S.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(qe||nt),vertexNormals:!!N.attributes.normal,vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!N.attributes.uv&&(_e||oe),fog:!!Y,useFog:S.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:S.wireframe===!1&&(S.flatShading===!0||N.attributes.normal===void 0&&qe===!1&&(S.isMeshLambertMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isMeshPhysicalMaterial)),sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:ce,skinning:I.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:Se,morphTextureStride:ze,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:S.dithering,shadowMapEnabled:i.shadowMap.enabled&&O.length>0,shadowMapType:i.shadowMap.type,toneMapping:ie,decodeVideoTexture:_e&&S.map.isVideoTexture===!0&&Ze.getTransfer(S.map.colorSpace)===rt,decodeVideoTextureEmissive:D&&S.emissiveMap.isVideoTexture===!0&&Ze.getTransfer(S.emissiveMap.colorSpace)===rt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===pn,flipSided:S.side===Ut,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:de&&S.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(de&&S.extensions.multiDraw===!0||F)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Pe.vertexUv1s=c.has(1),Pe.vertexUv2s=c.has(2),Pe.vertexUv3s=c.has(3),c.clear(),Pe}function h(S){const w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(const O in S.defines)w.push(O),w.push(S.defines[O]);return S.isRawShaderMaterial===!1&&(d(w,S),M(w,S),w.push(i.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function d(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function M(S,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),S.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),S.push(a.mask)}function y(S){const w=m[S.type];let O;if(w){const R=tn[w];O=ou.clone(R.uniforms)}else O=S.uniforms;return O}function T(S,w){let O=f.get(w);return O!==void 0?++O.usedTimes:(O=new zp(i,w,S,s),l.push(O),f.set(w,O)),O}function L(S){if(--S.usedTimes===0){const w=l.indexOf(S);l[w]=l[l.length-1],l.pop(),f.delete(S.cacheKey),S.destroy()}}function A(S){o.remove(S)}function P(){o.dispose()}return{getParameters:E,getProgramCacheKey:h,getUniforms:y,acquireProgram:T,releaseProgram:L,releaseShaderCache:A,programs:l,dispose:P}}function Xp(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function jp(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function $o(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Ko(){const i=[];let e=0;const t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u){let m=0;return u.isInstancedMesh&&(m+=2),u.isSkinnedMesh&&(m+=1),m}function o(u,m,_,E,h,d){let M=i[e];return M===void 0?(M={id:u.id,object:u,geometry:m,material:_,materialVariant:a(u),groupOrder:E,renderOrder:u.renderOrder,z:h,group:d},i[e]=M):(M.id=u.id,M.object=u,M.geometry=m,M.material=_,M.materialVariant=a(u),M.groupOrder=E,M.renderOrder=u.renderOrder,M.z=h,M.group=d),e++,M}function c(u,m,_,E,h,d){const M=o(u,m,_,E,h,d);_.transmission>0?n.push(M):_.transparent===!0?s.push(M):t.push(M)}function l(u,m,_,E,h,d){const M=o(u,m,_,E,h,d);_.transmission>0?n.unshift(M):_.transparent===!0?s.unshift(M):t.unshift(M)}function f(u,m){t.length>1&&t.sort(u||jp),n.length>1&&n.sort(m||$o),s.length>1&&s.sort(m||$o)}function p(){for(let u=e,m=i.length;u<m;u++){const _=i[u];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:p,sort:f}}function qp(){let i=new WeakMap;function e(n,s){const r=i.get(n);let a;return r===void 0?(a=new Ko,i.set(n,[a])):s>=r.length?(a=new Ko,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function Yp(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new V,color:new Qe};break;case"SpotLight":t={position:new V,direction:new V,color:new Qe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new V,color:new Qe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new V,skyColor:new Qe,groundColor:new Qe};break;case"RectAreaLight":t={color:new Qe,position:new V,halfWidth:new V,halfHeight:new V};break}return i[e.id]=t,t}}}function $p(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Kp=0;function Zp(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Jp(i){const e=new Yp,t=$p(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new V);const s=new V,r=new pt,a=new pt;function o(l){let f=0,p=0,u=0;for(let w=0;w<9;w++)n.probe[w].set(0,0,0);let m=0,_=0,E=0,h=0,d=0,M=0,y=0,T=0,L=0,A=0,P=0;l.sort(Zp);for(let w=0,O=l.length;w<O;w++){const R=l[w],I=R.color,G=R.intensity,Y=R.distance;let N=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===Xn?N=R.shadow.map.texture:N=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)f+=I.r*G,p+=I.g*G,u+=I.b*G;else if(R.isLightProbe){for(let B=0;B<9;B++)n.probe[B].addScaledVector(R.sh.coefficients[B],G);P++}else if(R.isDirectionalLight){const B=e.get(R);if(B.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const k=R.shadow,ee=t.get(R);ee.shadowIntensity=k.intensity,ee.shadowBias=k.bias,ee.shadowNormalBias=k.normalBias,ee.shadowRadius=k.radius,ee.shadowMapSize=k.mapSize,n.directionalShadow[m]=ee,n.directionalShadowMap[m]=N,n.directionalShadowMatrix[m]=R.shadow.matrix,M++}n.directional[m]=B,m++}else if(R.isSpotLight){const B=e.get(R);B.position.setFromMatrixPosition(R.matrixWorld),B.color.copy(I).multiplyScalar(G),B.distance=Y,B.coneCos=Math.cos(R.angle),B.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),B.decay=R.decay,n.spot[E]=B;const k=R.shadow;if(R.map&&(n.spotLightMap[L]=R.map,L++,k.updateMatrices(R),R.castShadow&&A++),n.spotLightMatrix[E]=k.matrix,R.castShadow){const ee=t.get(R);ee.shadowIntensity=k.intensity,ee.shadowBias=k.bias,ee.shadowNormalBias=k.normalBias,ee.shadowRadius=k.radius,ee.shadowMapSize=k.mapSize,n.spotShadow[E]=ee,n.spotShadowMap[E]=N,T++}E++}else if(R.isRectAreaLight){const B=e.get(R);B.color.copy(I).multiplyScalar(G),B.halfWidth.set(R.width*.5,0,0),B.halfHeight.set(0,R.height*.5,0),n.rectArea[h]=B,h++}else if(R.isPointLight){const B=e.get(R);if(B.color.copy(R.color).multiplyScalar(R.intensity),B.distance=R.distance,B.decay=R.decay,R.castShadow){const k=R.shadow,ee=t.get(R);ee.shadowIntensity=k.intensity,ee.shadowBias=k.bias,ee.shadowNormalBias=k.normalBias,ee.shadowRadius=k.radius,ee.shadowMapSize=k.mapSize,ee.shadowCameraNear=k.camera.near,ee.shadowCameraFar=k.camera.far,n.pointShadow[_]=ee,n.pointShadowMap[_]=N,n.pointShadowMatrix[_]=R.shadow.matrix,y++}n.point[_]=B,_++}else if(R.isHemisphereLight){const B=e.get(R);B.skyColor.copy(R.color).multiplyScalar(G),B.groundColor.copy(R.groundColor).multiplyScalar(G),n.hemi[d]=B,d++}}h>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Me.LTC_FLOAT_1,n.rectAreaLTC2=Me.LTC_FLOAT_2):(n.rectAreaLTC1=Me.LTC_HALF_1,n.rectAreaLTC2=Me.LTC_HALF_2)),n.ambient[0]=f,n.ambient[1]=p,n.ambient[2]=u;const S=n.hash;(S.directionalLength!==m||S.pointLength!==_||S.spotLength!==E||S.rectAreaLength!==h||S.hemiLength!==d||S.numDirectionalShadows!==M||S.numPointShadows!==y||S.numSpotShadows!==T||S.numSpotMaps!==L||S.numLightProbes!==P)&&(n.directional.length=m,n.spot.length=E,n.rectArea.length=h,n.point.length=_,n.hemi.length=d,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=T,n.spotShadowMap.length=T,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=T+L-A,n.spotLightMap.length=L,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=P,S.directionalLength=m,S.pointLength=_,S.spotLength=E,S.rectAreaLength=h,S.hemiLength=d,S.numDirectionalShadows=M,S.numPointShadows=y,S.numSpotShadows=T,S.numSpotMaps=L,S.numLightProbes=P,n.version=Kp++)}function c(l,f){let p=0,u=0,m=0,_=0,E=0;const h=f.matrixWorldInverse;for(let d=0,M=l.length;d<M;d++){const y=l[d];if(y.isDirectionalLight){const T=n.directional[p];T.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(h),p++}else if(y.isSpotLight){const T=n.spot[m];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(h),T.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(h),m++}else if(y.isRectAreaLight){const T=n.rectArea[_];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(h),a.identity(),r.copy(y.matrixWorld),r.premultiply(h),a.extractRotation(r),T.halfWidth.set(y.width*.5,0,0),T.halfHeight.set(0,y.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),_++}else if(y.isPointLight){const T=n.point[u];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(h),u++}else if(y.isHemisphereLight){const T=n.hemi[E];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(h),E++}}}return{setup:o,setupView:c,state:n}}function Zo(i){const e=new Jp(i),t=[],n=[],s=[];function r(u){p.camera=u,t.length=0,n.length=0,s.length=0}function a(u){t.push(u)}function o(u){n.push(u)}function c(u){s.push(u)}function l(){e.setup(t)}function f(u){e.setupView(t,u)}const p={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:p,setupLights:l,setupLightsView:f,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function Qp(i){let e=new WeakMap;function t(s,r=0){const a=e.get(s);let o;return a===void 0?(o=new Zo(i),e.set(s,[o])):r>=a.length?(o=new Zo(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const em=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,tm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,nm=[new V(1,0,0),new V(-1,0,0),new V(0,1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1)],im=[new V(0,-1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1),new V(0,-1,0),new V(0,-1,0)],Jo=new pt,Ri=new V,Mr=new V;function sm(i,e,t){let n=new Ca;const s=new it,r=new it,a=new gt,o=new du,c=new hu,l={},f=t.maxTextureSize,p={[Ln]:Ut,[Ut]:Ln,[pn]:pn},u=new ln({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new it},radius:{value:4}},vertexShader:em,fragmentShader:tm}),m=u.clone();m.defines.HORIZONTAL_PASS=1;const _=new Ft;_.setAttribute("position",new qt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const E=new Tt(_,u),h=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=xs;let d=this.type;this.render=function(A,P,S){if(h.enabled===!1||h.autoUpdate===!1&&h.needsUpdate===!1||A.length===0)return;this.type===el&&(Fe("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=xs);const w=i.getRenderTarget(),O=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),I=i.state;I.setBlending(gn),I.buffers.depth.getReversed()===!0?I.buffers.color.setClear(0,0,0,0):I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);const G=d!==this.type;G&&P.traverse(function(Y){Y.material&&(Array.isArray(Y.material)?Y.material.forEach(N=>N.needsUpdate=!0):Y.material.needsUpdate=!0)});for(let Y=0,N=A.length;Y<N;Y++){const B=A[Y],k=B.shadow;if(k===void 0){Fe("WebGLShadowMap:",B,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;s.copy(k.mapSize);const ee=k.getFrameExtents();s.multiply(ee),r.copy(k.mapSize),(s.x>f||s.y>f)&&(s.x>f&&(r.x=Math.floor(f/ee.x),s.x=r.x*ee.x,k.mapSize.x=r.x),s.y>f&&(r.y=Math.floor(f/ee.y),s.y=r.y*ee.y,k.mapSize.y=r.y));const ne=i.state.buffers.depth.getReversed();if(k.camera._reversedDepth=ne,k.map===null||G===!0){if(k.map!==null&&(k.map.depthTexture!==null&&(k.map.depthTexture.dispose(),k.map.depthTexture=null),k.map.dispose()),this.type===Ci){if(B.isPointLight){Fe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}k.map=new an(s.x,s.y,{format:Xn,type:xn,minFilter:Pt,magFilter:Pt,generateMipmaps:!1}),k.map.texture.name=B.name+".shadowMap",k.map.depthTexture=new _i(s.x,s.y,nn),k.map.depthTexture.name=B.name+".shadowMapDepth",k.map.depthTexture.format=vn,k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=At,k.map.depthTexture.magFilter=At}else B.isPointLight?(k.map=new Nl(s.x),k.map.depthTexture=new su(s.x,on)):(k.map=new an(s.x,s.y),k.map.depthTexture=new _i(s.x,s.y,on)),k.map.depthTexture.name=B.name+".shadowMap",k.map.depthTexture.format=vn,this.type===xs?(k.map.depthTexture.compareFunction=ne?Aa:Ta,k.map.depthTexture.minFilter=Pt,k.map.depthTexture.magFilter=Pt):(k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=At,k.map.depthTexture.magFilter=At);k.camera.updateProjectionMatrix()}const se=k.map.isWebGLCubeRenderTarget?6:1;for(let me=0;me<se;me++){if(k.map.isWebGLCubeRenderTarget)i.setRenderTarget(k.map,me),i.clear();else{me===0&&(i.setRenderTarget(k.map),i.clear());const Se=k.getViewport(me);a.set(r.x*Se.x,r.y*Se.y,r.x*Se.z,r.y*Se.w),I.viewport(a)}if(B.isPointLight){const Se=k.camera,ze=k.matrix,Ve=B.distance||Se.far;Ve!==Se.far&&(Se.far=Ve,Se.updateProjectionMatrix()),Ri.setFromMatrixPosition(B.matrixWorld),Se.position.copy(Ri),Mr.copy(Se.position),Mr.add(nm[me]),Se.up.copy(im[me]),Se.lookAt(Mr),Se.updateMatrixWorld(),ze.makeTranslation(-Ri.x,-Ri.y,-Ri.z),Jo.multiplyMatrices(Se.projectionMatrix,Se.matrixWorldInverse),k._frustum.setFromProjectionMatrix(Jo,Se.coordinateSystem,Se.reversedDepth)}else k.updateMatrices(B);n=k.getFrustum(),T(P,S,k.camera,B,this.type)}k.isPointLightShadow!==!0&&this.type===Ci&&M(k,S),k.needsUpdate=!1}d=this.type,h.needsUpdate=!1,i.setRenderTarget(w,O,R)};function M(A,P){const S=e.update(E);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,m.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,m.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new an(s.x,s.y,{format:Xn,type:xn})),u.uniforms.shadow_pass.value=A.map.depthTexture,u.uniforms.resolution.value=A.mapSize,u.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(P,null,S,u,E,null),m.uniforms.shadow_pass.value=A.mapPass.texture,m.uniforms.resolution.value=A.mapSize,m.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(P,null,S,m,E,null)}function y(A,P,S,w){let O=null;const R=S.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(R!==void 0)O=R;else if(O=S.isPointLight===!0?c:o,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const I=O.uuid,G=P.uuid;let Y=l[I];Y===void 0&&(Y={},l[I]=Y);let N=Y[G];N===void 0&&(N=O.clone(),Y[G]=N,P.addEventListener("dispose",L)),O=N}if(O.visible=P.visible,O.wireframe=P.wireframe,w===Ci?O.side=P.shadowSide!==null?P.shadowSide:P.side:O.side=P.shadowSide!==null?P.shadowSide:p[P.side],O.alphaMap=P.alphaMap,O.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,O.map=P.map,O.clipShadows=P.clipShadows,O.clippingPlanes=P.clippingPlanes,O.clipIntersection=P.clipIntersection,O.displacementMap=P.displacementMap,O.displacementScale=P.displacementScale,O.displacementBias=P.displacementBias,O.wireframeLinewidth=P.wireframeLinewidth,O.linewidth=P.linewidth,S.isPointLight===!0&&O.isMeshDistanceMaterial===!0){const I=i.properties.get(O);I.light=S}return O}function T(A,P,S,w,O){if(A.visible===!1)return;if(A.layers.test(P.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&O===Ci)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,A.matrixWorld);const G=e.update(A),Y=A.material;if(Array.isArray(Y)){const N=G.groups;for(let B=0,k=N.length;B<k;B++){const ee=N[B],ne=Y[ee.materialIndex];if(ne&&ne.visible){const se=y(A,ne,w,O);A.onBeforeShadow(i,A,P,S,G,se,ee),i.renderBufferDirect(S,null,G,se,A,ee),A.onAfterShadow(i,A,P,S,G,se,ee)}}}else if(Y.visible){const N=y(A,Y,w,O);A.onBeforeShadow(i,A,P,S,G,N,null),i.renderBufferDirect(S,null,G,N,A,null),A.onAfterShadow(i,A,P,S,G,N,null)}}const I=A.children;for(let G=0,Y=I.length;G<Y;G++)T(I[G],P,S,w,O)}function L(A){A.target.removeEventListener("dispose",L);for(const S in l){const w=l[S],O=A.target.uuid;O in w&&(w[O].dispose(),delete w[O])}}}function rm(i,e){function t(){let C=!1;const oe=new gt;let K=null;const Te=new gt(0,0,0,0);return{setMask:function(de){K!==de&&!C&&(i.colorMask(de,de,de,de),K=de)},setLocked:function(de){C=de},setClear:function(de,ie,Pe,Ge,ft){ft===!0&&(de*=Ge,ie*=Ge,Pe*=Ge),oe.set(de,ie,Pe,Ge),Te.equals(oe)===!1&&(i.clearColor(de,ie,Pe,Ge),Te.copy(oe))},reset:function(){C=!1,K=null,Te.set(-1,0,0,0)}}}function n(){let C=!1,oe=!1,K=null,Te=null,de=null;return{setReversed:function(ie){if(oe!==ie){const Pe=e.get("EXT_clip_control");ie?Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.ZERO_TO_ONE_EXT):Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.NEGATIVE_ONE_TO_ONE_EXT),oe=ie;const Ge=de;de=null,this.setClear(Ge)}},getReversed:function(){return oe},setTest:function(ie){ie?H(i.DEPTH_TEST):ce(i.DEPTH_TEST)},setMask:function(ie){K!==ie&&!C&&(i.depthMask(ie),K=ie)},setFunc:function(ie){if(oe&&(ie=Pc[ie]),Te!==ie){switch(ie){case Ar:i.depthFunc(i.NEVER);break;case wr:i.depthFunc(i.ALWAYS);break;case Rr:i.depthFunc(i.LESS);break;case mi:i.depthFunc(i.LEQUAL);break;case Cr:i.depthFunc(i.EQUAL);break;case Pr:i.depthFunc(i.GEQUAL);break;case Nr:i.depthFunc(i.GREATER);break;case Lr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Te=ie}},setLocked:function(ie){C=ie},setClear:function(ie){de!==ie&&(de=ie,oe&&(ie=1-ie),i.clearDepth(ie))},reset:function(){C=!1,K=null,Te=null,de=null,oe=!1}}}function s(){let C=!1,oe=null,K=null,Te=null,de=null,ie=null,Pe=null,Ge=null,ft=null;return{setTest:function(Q){C||(Q?H(i.STENCIL_TEST):ce(i.STENCIL_TEST))},setMask:function(Q){oe!==Q&&!C&&(i.stencilMask(Q),oe=Q)},setFunc:function(Q,We,lt){(K!==Q||Te!==We||de!==lt)&&(i.stencilFunc(Q,We,lt),K=Q,Te=We,de=lt)},setOp:function(Q,We,lt){(ie!==Q||Pe!==We||Ge!==lt)&&(i.stencilOp(Q,We,lt),ie=Q,Pe=We,Ge=lt)},setLocked:function(Q){C=Q},setClear:function(Q){ft!==Q&&(i.clearStencil(Q),ft=Q)},reset:function(){C=!1,oe=null,K=null,Te=null,de=null,ie=null,Pe=null,Ge=null,ft=null}}}const r=new t,a=new n,o=new s,c=new WeakMap,l=new WeakMap;let f={},p={},u={},m=new WeakMap,_=[],E=null,h=!1,d=null,M=null,y=null,T=null,L=null,A=null,P=null,S=new Qe(0,0,0),w=0,O=!1,R=null,I=null,G=null,Y=null,N=null;const B=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let k=!1,ee=0;const ne=i.getParameter(i.VERSION);ne.indexOf("WebGL")!==-1?(ee=parseFloat(/^WebGL (\d)/.exec(ne)[1]),k=ee>=1):ne.indexOf("OpenGL ES")!==-1&&(ee=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),k=ee>=2);let se=null,me={};const Se=i.getParameter(i.SCISSOR_BOX),ze=i.getParameter(i.VIEWPORT),Ve=new gt().fromArray(Se),De=new gt().fromArray(ze);function q(C,oe,K,Te){const de=new Uint8Array(4),ie=i.createTexture();i.bindTexture(C,ie),i.texParameteri(C,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(C,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Pe=0;Pe<K;Pe++)C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY?i.texImage3D(oe,0,i.RGBA,1,1,Te,0,i.RGBA,i.UNSIGNED_BYTE,de):i.texImage2D(oe+Pe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,de);return ie}const he={};he[i.TEXTURE_2D]=q(i.TEXTURE_2D,i.TEXTURE_2D,1),he[i.TEXTURE_CUBE_MAP]=q(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),he[i.TEXTURE_2D_ARRAY]=q(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),he[i.TEXTURE_3D]=q(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),H(i.DEPTH_TEST),a.setFunc(mi),Ke(!1),qe(ja),H(i.CULL_FACE),Oe(gn);function H(C){f[C]!==!0&&(i.enable(C),f[C]=!0)}function ce(C){f[C]!==!1&&(i.disable(C),f[C]=!1)}function ve(C,oe){return u[C]!==oe?(i.bindFramebuffer(C,oe),u[C]=oe,C===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=oe),C===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=oe),!0):!1}function F(C,oe){let K=_,Te=!1;if(C){K=m.get(oe),K===void 0&&(K=[],m.set(oe,K));const de=C.textures;if(K.length!==de.length||K[0]!==i.COLOR_ATTACHMENT0){for(let ie=0,Pe=de.length;ie<Pe;ie++)K[ie]=i.COLOR_ATTACHMENT0+ie;K.length=de.length,Te=!0}}else K[0]!==i.BACK&&(K[0]=i.BACK,Te=!0);Te&&i.drawBuffers(K)}function _e(C){return E!==C?(i.useProgram(C),E=C,!0):!1}const ge={[Gn]:i.FUNC_ADD,[Ql]:i.FUNC_SUBTRACT,[ec]:i.FUNC_REVERSE_SUBTRACT};ge[tc]=i.MIN,ge[nc]=i.MAX;const xe={[ic]:i.ZERO,[sc]:i.ONE,[rc]:i.SRC_COLOR,[yr]:i.SRC_ALPHA,[dc]:i.SRC_ALPHA_SATURATE,[cc]:i.DST_COLOR,[oc]:i.DST_ALPHA,[ac]:i.ONE_MINUS_SRC_COLOR,[Tr]:i.ONE_MINUS_SRC_ALPHA,[uc]:i.ONE_MINUS_DST_COLOR,[lc]:i.ONE_MINUS_DST_ALPHA,[hc]:i.CONSTANT_COLOR,[fc]:i.ONE_MINUS_CONSTANT_COLOR,[pc]:i.CONSTANT_ALPHA,[mc]:i.ONE_MINUS_CONSTANT_ALPHA};function Oe(C,oe,K,Te,de,ie,Pe,Ge,ft,Q){if(C===gn){h===!0&&(ce(i.BLEND),h=!1);return}if(h===!1&&(H(i.BLEND),h=!0),C!==Jl){if(C!==d||Q!==O){if((M!==Gn||L!==Gn)&&(i.blendEquation(i.FUNC_ADD),M=Gn,L=Gn),Q)switch(C){case fi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case br:i.blendFunc(i.ONE,i.ONE);break;case qa:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ya:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:tt("WebGLState: Invalid blending: ",C);break}else switch(C){case fi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case br:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case qa:tt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ya:tt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:tt("WebGLState: Invalid blending: ",C);break}y=null,T=null,A=null,P=null,S.set(0,0,0),w=0,d=C,O=Q}return}de=de||oe,ie=ie||K,Pe=Pe||Te,(oe!==M||de!==L)&&(i.blendEquationSeparate(ge[oe],ge[de]),M=oe,L=de),(K!==y||Te!==T||ie!==A||Pe!==P)&&(i.blendFuncSeparate(xe[K],xe[Te],xe[ie],xe[Pe]),y=K,T=Te,A=ie,P=Pe),(Ge.equals(S)===!1||ft!==w)&&(i.blendColor(Ge.r,Ge.g,Ge.b,ft),S.copy(Ge),w=ft),d=C,O=!1}function Ce(C,oe){C.side===pn?ce(i.CULL_FACE):H(i.CULL_FACE);let K=C.side===Ut;oe&&(K=!K),Ke(K),C.blending===fi&&C.transparent===!1?Oe(gn):Oe(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),a.setFunc(C.depthFunc),a.setTest(C.depthTest),a.setMask(C.depthWrite),r.setMask(C.colorWrite);const Te=C.stencilWrite;o.setTest(Te),Te&&(o.setMask(C.stencilWriteMask),o.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),o.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),D(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?H(i.SAMPLE_ALPHA_TO_COVERAGE):ce(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ke(C){R!==C&&(C?i.frontFace(i.CW):i.frontFace(i.CCW),R=C)}function qe(C){C!==Kl?(H(i.CULL_FACE),C!==I&&(C===ja?i.cullFace(i.BACK):C===Zl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ce(i.CULL_FACE),I=C}function dt(C){C!==G&&(k&&i.lineWidth(C),G=C)}function D(C,oe,K){C?(H(i.POLYGON_OFFSET_FILL),(Y!==oe||N!==K)&&(Y=oe,N=K,a.getReversed()&&(oe=-oe),i.polygonOffset(oe,K))):ce(i.POLYGON_OFFSET_FILL)}function ot(C){C?H(i.SCISSOR_TEST):ce(i.SCISSOR_TEST)}function Ue(C){C===void 0&&(C=i.TEXTURE0+B-1),se!==C&&(i.activeTexture(C),se=C)}function nt(C,oe,K){K===void 0&&(se===null?K=i.TEXTURE0+B-1:K=se);let Te=me[K];Te===void 0&&(Te={type:void 0,texture:void 0},me[K]=Te),(Te.type!==C||Te.texture!==oe)&&(se!==K&&(i.activeTexture(K),se=K),i.bindTexture(C,oe||he[C]),Te.type=C,Te.texture=oe)}function fe(){const C=me[se];C!==void 0&&C.type!==void 0&&(i.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function st(){try{i.compressedTexImage2D(...arguments)}catch(C){tt("WebGLState:",C)}}function b(){try{i.compressedTexImage3D(...arguments)}catch(C){tt("WebGLState:",C)}}function g(){try{i.texSubImage2D(...arguments)}catch(C){tt("WebGLState:",C)}}function z(){try{i.texSubImage3D(...arguments)}catch(C){tt("WebGLState:",C)}}function Z(){try{i.compressedTexSubImage2D(...arguments)}catch(C){tt("WebGLState:",C)}}function te(){try{i.compressedTexSubImage3D(...arguments)}catch(C){tt("WebGLState:",C)}}function ae(){try{i.texStorage2D(...arguments)}catch(C){tt("WebGLState:",C)}}function pe(){try{i.texStorage3D(...arguments)}catch(C){tt("WebGLState:",C)}}function $(){try{i.texImage2D(...arguments)}catch(C){tt("WebGLState:",C)}}function J(){try{i.texImage3D(...arguments)}catch(C){tt("WebGLState:",C)}}function Ee(C){return p[C]!==void 0?p[C]:i.getParameter(C)}function Ae(C,oe){p[C]!==oe&&(i.pixelStorei(C,oe),p[C]=oe)}function ue(C){Ve.equals(C)===!1&&(i.scissor(C.x,C.y,C.z,C.w),Ve.copy(C))}function le(C){De.equals(C)===!1&&(i.viewport(C.x,C.y,C.z,C.w),De.copy(C))}function Be(C,oe){let K=l.get(oe);K===void 0&&(K=new WeakMap,l.set(oe,K));let Te=K.get(C);Te===void 0&&(Te=i.getUniformBlockIndex(oe,C.name),K.set(C,Te))}function ke(C,oe){const Te=l.get(oe).get(C);c.get(oe)!==Te&&(i.uniformBlockBinding(oe,Te,C.__bindingPointIndex),c.set(oe,Te))}function He(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),f={},p={},se=null,me={},u={},m=new WeakMap,_=[],E=null,h=!1,d=null,M=null,y=null,T=null,L=null,A=null,P=null,S=new Qe(0,0,0),w=0,O=!1,R=null,I=null,G=null,Y=null,N=null,Ve.set(0,0,i.canvas.width,i.canvas.height),De.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:H,disable:ce,bindFramebuffer:ve,drawBuffers:F,useProgram:_e,setBlending:Oe,setMaterial:Ce,setFlipSided:Ke,setCullFace:qe,setLineWidth:dt,setPolygonOffset:D,setScissorTest:ot,activeTexture:Ue,bindTexture:nt,unbindTexture:fe,compressedTexImage2D:st,compressedTexImage3D:b,texImage2D:$,texImage3D:J,pixelStorei:Ae,getParameter:Ee,updateUBOMapping:Be,uniformBlockBinding:ke,texStorage2D:ae,texStorage3D:pe,texSubImage2D:g,texSubImage3D:z,compressedTexSubImage2D:Z,compressedTexSubImage3D:te,scissor:ue,viewport:le,reset:He}}function am(i,e,t,n,s,r,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new it,f=new WeakMap,p=new Set;let u;const m=new WeakMap;let _=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function E(b,g){return _?new OffscreenCanvas(b,g):Ui("canvas")}function h(b,g,z){let Z=1;const te=st(b);if((te.width>z||te.height>z)&&(Z=z/Math.max(te.width,te.height)),Z<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){const ae=Math.floor(Z*te.width),pe=Math.floor(Z*te.height);u===void 0&&(u=E(ae,pe));const $=g?E(ae,pe):u;return $.width=ae,$.height=pe,$.getContext("2d").drawImage(b,0,0,ae,pe),Fe("WebGLRenderer: Texture has been resized from ("+te.width+"x"+te.height+") to ("+ae+"x"+pe+")."),$}else return"data"in b&&Fe("WebGLRenderer: Image in DataTexture is too big ("+te.width+"x"+te.height+")."),b;return b}function d(b){return b.generateMipmaps}function M(b){i.generateMipmap(b)}function y(b){return b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?i.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function T(b,g,z,Z,te,ae=!1){if(b!==null){if(i[b]!==void 0)return i[b];Fe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let pe;Z&&(pe=e.get("EXT_texture_norm16"),pe||Fe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=g;if(g===i.RED&&(z===i.FLOAT&&($=i.R32F),z===i.HALF_FLOAT&&($=i.R16F),z===i.UNSIGNED_BYTE&&($=i.R8),z===i.UNSIGNED_SHORT&&pe&&($=pe.R16_EXT),z===i.SHORT&&pe&&($=pe.R16_SNORM_EXT)),g===i.RED_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.R8UI),z===i.UNSIGNED_SHORT&&($=i.R16UI),z===i.UNSIGNED_INT&&($=i.R32UI),z===i.BYTE&&($=i.R8I),z===i.SHORT&&($=i.R16I),z===i.INT&&($=i.R32I)),g===i.RG&&(z===i.FLOAT&&($=i.RG32F),z===i.HALF_FLOAT&&($=i.RG16F),z===i.UNSIGNED_BYTE&&($=i.RG8),z===i.UNSIGNED_SHORT&&pe&&($=pe.RG16_EXT),z===i.SHORT&&pe&&($=pe.RG16_SNORM_EXT)),g===i.RG_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.RG8UI),z===i.UNSIGNED_SHORT&&($=i.RG16UI),z===i.UNSIGNED_INT&&($=i.RG32UI),z===i.BYTE&&($=i.RG8I),z===i.SHORT&&($=i.RG16I),z===i.INT&&($=i.RG32I)),g===i.RGB_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.RGB8UI),z===i.UNSIGNED_SHORT&&($=i.RGB16UI),z===i.UNSIGNED_INT&&($=i.RGB32UI),z===i.BYTE&&($=i.RGB8I),z===i.SHORT&&($=i.RGB16I),z===i.INT&&($=i.RGB32I)),g===i.RGBA_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.RGBA8UI),z===i.UNSIGNED_SHORT&&($=i.RGBA16UI),z===i.UNSIGNED_INT&&($=i.RGBA32UI),z===i.BYTE&&($=i.RGBA8I),z===i.SHORT&&($=i.RGBA16I),z===i.INT&&($=i.RGBA32I)),g===i.RGB&&(z===i.UNSIGNED_SHORT&&pe&&($=pe.RGB16_EXT),z===i.SHORT&&pe&&($=pe.RGB16_SNORM_EXT),z===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),z===i.UNSIGNED_INT_10F_11F_11F_REV&&($=i.R11F_G11F_B10F)),g===i.RGBA){const J=ae?Rs:Ze.getTransfer(te);z===i.FLOAT&&($=i.RGBA32F),z===i.HALF_FLOAT&&($=i.RGBA16F),z===i.UNSIGNED_BYTE&&($=J===rt?i.SRGB8_ALPHA8:i.RGBA8),z===i.UNSIGNED_SHORT&&pe&&($=pe.RGBA16_EXT),z===i.SHORT&&pe&&($=pe.RGBA16_SNORM_EXT),z===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),z===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function L(b,g){let z;return b?g===null||g===on||g===Di?z=i.DEPTH24_STENCIL8:g===nn?z=i.DEPTH32F_STENCIL8:g===Li&&(z=i.DEPTH24_STENCIL8,Fe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===on||g===Di?z=i.DEPTH_COMPONENT24:g===nn?z=i.DEPTH_COMPONENT32F:g===Li&&(z=i.DEPTH_COMPONENT16),z}function A(b,g){return d(b)===!0||b.isFramebufferTexture&&b.minFilter!==At&&b.minFilter!==Pt?Math.log2(Math.max(g.width,g.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?g.mipmaps.length:1}function P(b){const g=b.target;g.removeEventListener("dispose",P),w(g),g.isVideoTexture&&f.delete(g),g.isHTMLTexture&&p.delete(g)}function S(b){const g=b.target;g.removeEventListener("dispose",S),R(g)}function w(b){const g=n.get(b);if(g.__webglInit===void 0)return;const z=b.source,Z=m.get(z);if(Z){const te=Z[g.__cacheKey];te.usedTimes--,te.usedTimes===0&&O(b),Object.keys(Z).length===0&&m.delete(z)}n.remove(b)}function O(b){const g=n.get(b);i.deleteTexture(g.__webglTexture);const z=b.source,Z=m.get(z);delete Z[g.__cacheKey],a.memory.textures--}function R(b){const g=n.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),n.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(g.__webglFramebuffer[Z]))for(let te=0;te<g.__webglFramebuffer[Z].length;te++)i.deleteFramebuffer(g.__webglFramebuffer[Z][te]);else i.deleteFramebuffer(g.__webglFramebuffer[Z]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[Z])}else{if(Array.isArray(g.__webglFramebuffer))for(let Z=0;Z<g.__webglFramebuffer.length;Z++)i.deleteFramebuffer(g.__webglFramebuffer[Z]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let Z=0;Z<g.__webglColorRenderbuffer.length;Z++)g.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[Z]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const z=b.textures;for(let Z=0,te=z.length;Z<te;Z++){const ae=n.get(z[Z]);ae.__webglTexture&&(i.deleteTexture(ae.__webglTexture),a.memory.textures--),n.remove(z[Z])}n.remove(b)}let I=0;function G(){I=0}function Y(){return I}function N(b){I=b}function B(){const b=I;return b>=s.maxTextures&&Fe("WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+s.maxTextures),I+=1,b}function k(b){const g=[];return g.push(b.wrapS),g.push(b.wrapT),g.push(b.wrapR||0),g.push(b.magFilter),g.push(b.minFilter),g.push(b.anisotropy),g.push(b.internalFormat),g.push(b.format),g.push(b.type),g.push(b.generateMipmaps),g.push(b.premultiplyAlpha),g.push(b.flipY),g.push(b.unpackAlignment),g.push(b.colorSpace),g.join()}function ee(b,g){const z=n.get(b);if(b.isVideoTexture&&nt(b),b.isRenderTargetTexture===!1&&b.isExternalTexture!==!0&&b.version>0&&z.__version!==b.version){const Z=b.image;if(Z===null)Fe("WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)Fe("WebGLRenderer: Texture marked for update but image is incomplete");else{ce(z,b,g);return}}else b.isExternalTexture&&(z.__webglTexture=b.sourceTexture?b.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,z.__webglTexture,i.TEXTURE0+g)}function ne(b,g){const z=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&z.__version!==b.version){ce(z,b,g);return}else b.isExternalTexture&&(z.__webglTexture=b.sourceTexture?b.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,z.__webglTexture,i.TEXTURE0+g)}function se(b,g){const z=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&z.__version!==b.version){ce(z,b,g);return}t.bindTexture(i.TEXTURE_3D,z.__webglTexture,i.TEXTURE0+g)}function me(b,g){const z=n.get(b);if(b.isCubeDepthTexture!==!0&&b.version>0&&z.__version!==b.version){ve(z,b,g);return}t.bindTexture(i.TEXTURE_CUBE_MAP,z.__webglTexture,i.TEXTURE0+g)}const Se={[Dr]:i.REPEAT,[mn]:i.CLAMP_TO_EDGE,[Ir]:i.MIRRORED_REPEAT},ze={[At]:i.NEAREST,[xc]:i.NEAREST_MIPMAP_NEAREST,[Hi]:i.NEAREST_MIPMAP_LINEAR,[Pt]:i.LINEAR,[Vs]:i.LINEAR_MIPMAP_NEAREST,[kn]:i.LINEAR_MIPMAP_LINEAR},Ve={[Mc]:i.NEVER,[Ac]:i.ALWAYS,[Ec]:i.LESS,[Ta]:i.LEQUAL,[bc]:i.EQUAL,[Aa]:i.GEQUAL,[yc]:i.GREATER,[Tc]:i.NOTEQUAL};function De(b,g){if(g.type===nn&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===Pt||g.magFilter===Vs||g.magFilter===Hi||g.magFilter===kn||g.minFilter===Pt||g.minFilter===Vs||g.minFilter===Hi||g.minFilter===kn)&&Fe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(b,i.TEXTURE_WRAP_S,Se[g.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,Se[g.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,Se[g.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,ze[g.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,ze[g.minFilter]),g.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,Ve[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===At||g.minFilter!==Hi&&g.minFilter!==kn||g.type===nn&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){const z=e.get("EXT_texture_filter_anisotropic");i.texParameterf(b,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function q(b,g){let z=!1;b.__webglInit===void 0&&(b.__webglInit=!0,g.addEventListener("dispose",P));const Z=g.source;let te=m.get(Z);te===void 0&&(te={},m.set(Z,te));const ae=k(g);if(ae!==b.__cacheKey){te[ae]===void 0&&(te[ae]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,z=!0),te[ae].usedTimes++;const pe=te[b.__cacheKey];pe!==void 0&&(te[b.__cacheKey].usedTimes--,pe.usedTimes===0&&O(g)),b.__cacheKey=ae,b.__webglTexture=te[ae].texture}return z}function he(b,g,z){return Math.floor(Math.floor(b/z)/g)}function H(b,g,z,Z){const ae=b.updateRanges;if(ae.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,z,Z,g.data);else{ae.sort((Ae,ue)=>Ae.start-ue.start);let pe=0;for(let Ae=1;Ae<ae.length;Ae++){const ue=ae[pe],le=ae[Ae],Be=ue.start+ue.count,ke=he(le.start,g.width,4),He=he(ue.start,g.width,4);le.start<=Be+1&&ke===He&&he(le.start+le.count-1,g.width,4)===ke?ue.count=Math.max(ue.count,le.start+le.count-ue.start):(++pe,ae[pe]=le)}ae.length=pe+1;const $=t.getParameter(i.UNPACK_ROW_LENGTH),J=t.getParameter(i.UNPACK_SKIP_PIXELS),Ee=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let Ae=0,ue=ae.length;Ae<ue;Ae++){const le=ae[Ae],Be=Math.floor(le.start/4),ke=Math.ceil(le.count/4),He=Be%g.width,C=Math.floor(Be/g.width),oe=ke,K=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,He),t.pixelStorei(i.UNPACK_SKIP_ROWS,C),t.texSubImage2D(i.TEXTURE_2D,0,He,C,oe,K,z,Z,g.data)}b.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,$),t.pixelStorei(i.UNPACK_SKIP_PIXELS,J),t.pixelStorei(i.UNPACK_SKIP_ROWS,Ee)}}function ce(b,g,z){let Z=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(Z=i.TEXTURE_3D);const te=q(b,g),ae=g.source;t.bindTexture(Z,b.__webglTexture,i.TEXTURE0+z);const pe=n.get(ae);if(ae.version!==pe.__version||te===!0){if(t.activeTexture(i.TEXTURE0+z),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){const K=Ze.getPrimaries(Ze.workingColorSpace),Te=g.colorSpace===Cn?null:Ze.getPrimaries(g.colorSpace),de=g.colorSpace===Cn||K===Te?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,de)}t.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment);let J=h(g.image,!1,s.maxTextureSize);J=fe(g,J);const Ee=r.convert(g.format,g.colorSpace),Ae=r.convert(g.type);let ue=T(g.internalFormat,Ee,Ae,g.normalized,g.colorSpace,g.isVideoTexture);De(Z,g);let le;const Be=g.mipmaps,ke=g.isVideoTexture!==!0,He=pe.__version===void 0||te===!0,C=ae.dataReady,oe=A(g,J);if(g.isDepthTexture)ue=L(g.format===Hn,g.type),He&&(ke?t.texStorage2D(i.TEXTURE_2D,1,ue,J.width,J.height):t.texImage2D(i.TEXTURE_2D,0,ue,J.width,J.height,0,Ee,Ae,null));else if(g.isDataTexture)if(Be.length>0){ke&&He&&t.texStorage2D(i.TEXTURE_2D,oe,ue,Be[0].width,Be[0].height);for(let K=0,Te=Be.length;K<Te;K++)le=Be[K],ke?C&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,Ee,Ae,le.data):t.texImage2D(i.TEXTURE_2D,K,ue,le.width,le.height,0,Ee,Ae,le.data);g.generateMipmaps=!1}else ke?(He&&t.texStorage2D(i.TEXTURE_2D,oe,ue,J.width,J.height),C&&H(g,J,Ee,Ae)):t.texImage2D(i.TEXTURE_2D,0,ue,J.width,J.height,0,Ee,Ae,J.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){ke&&He&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,ue,Be[0].width,Be[0].height,J.depth);for(let K=0,Te=Be.length;K<Te;K++)if(le=Be[K],g.format!==Zt)if(Ee!==null)if(ke){if(C)if(g.layerUpdates.size>0){const de=Co(le.width,le.height,g.format,g.type);for(const ie of g.layerUpdates){const Pe=le.data.subarray(ie*de/le.data.BYTES_PER_ELEMENT,(ie+1)*de/le.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,ie,le.width,le.height,1,Ee,Pe)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,le.width,le.height,J.depth,Ee,le.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,K,ue,le.width,le.height,J.depth,0,le.data,0,0);else Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ke?C&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,le.width,le.height,J.depth,Ee,Ae,le.data):t.texImage3D(i.TEXTURE_2D_ARRAY,K,ue,le.width,le.height,J.depth,0,Ee,Ae,le.data)}else{ke&&He&&t.texStorage2D(i.TEXTURE_2D,oe,ue,Be[0].width,Be[0].height);for(let K=0,Te=Be.length;K<Te;K++)le=Be[K],g.format!==Zt?Ee!==null?ke?C&&t.compressedTexSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,Ee,le.data):t.compressedTexImage2D(i.TEXTURE_2D,K,ue,le.width,le.height,0,le.data):Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ke?C&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,Ee,Ae,le.data):t.texImage2D(i.TEXTURE_2D,K,ue,le.width,le.height,0,Ee,Ae,le.data)}else if(g.isDataArrayTexture)if(ke){if(He&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,ue,J.width,J.height,J.depth),C)if(g.layerUpdates.size>0){const K=Co(J.width,J.height,g.format,g.type);for(const Te of g.layerUpdates){const de=J.data.subarray(Te*K/J.data.BYTES_PER_ELEMENT,(Te+1)*K/J.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Te,J.width,J.height,1,Ee,Ae,de)}g.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,Ee,Ae,J.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ue,J.width,J.height,J.depth,0,Ee,Ae,J.data);else if(g.isData3DTexture)ke?(He&&t.texStorage3D(i.TEXTURE_3D,oe,ue,J.width,J.height,J.depth),C&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,Ee,Ae,J.data)):t.texImage3D(i.TEXTURE_3D,0,ue,J.width,J.height,J.depth,0,Ee,Ae,J.data);else if(g.isFramebufferTexture){if(He)if(ke)t.texStorage2D(i.TEXTURE_2D,oe,ue,J.width,J.height);else{let K=J.width,Te=J.height;for(let de=0;de<oe;de++)t.texImage2D(i.TEXTURE_2D,de,ue,K,Te,0,Ee,Ae,null),K>>=1,Te>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in i){const K=i.canvas;if(K.hasAttribute("layoutsubtree")||K.setAttribute("layoutsubtree","true"),J.parentNode!==K){K.appendChild(J),p.add(g),K.onpaint=Ge=>{const ft=Ge.changedElements;for(const Q of p)ft.includes(Q.image)&&(Q.needsUpdate=!0)},K.requestPaint();return}const Te=0,de=i.RGBA,ie=i.RGBA,Pe=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,Te,de,ie,Pe,J),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Be.length>0){if(ke&&He){const K=st(Be[0]);t.texStorage2D(i.TEXTURE_2D,oe,ue,K.width,K.height)}for(let K=0,Te=Be.length;K<Te;K++)le=Be[K],ke?C&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,Ee,Ae,le):t.texImage2D(i.TEXTURE_2D,K,ue,Ee,Ae,le);g.generateMipmaps=!1}else if(ke){if(He){const K=st(J);t.texStorage2D(i.TEXTURE_2D,oe,ue,K.width,K.height)}C&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Ee,Ae,J)}else t.texImage2D(i.TEXTURE_2D,0,ue,Ee,Ae,J);d(g)&&M(Z),pe.__version=ae.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function ve(b,g,z){if(g.image.length!==6)return;const Z=q(b,g),te=g.source;t.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+z);const ae=n.get(te);if(te.version!==ae.__version||Z===!0){t.activeTexture(i.TEXTURE0+z);const pe=Ze.getPrimaries(Ze.workingColorSpace),$=g.colorSpace===Cn?null:Ze.getPrimaries(g.colorSpace),J=g.colorSpace===Cn||pe===$?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);const Ee=g.isCompressedTexture||g.image[0].isCompressedTexture,Ae=g.image[0]&&g.image[0].isDataTexture,ue=[];for(let ie=0;ie<6;ie++)!Ee&&!Ae?ue[ie]=h(g.image[ie],!0,s.maxCubemapSize):ue[ie]=Ae?g.image[ie].image:g.image[ie],ue[ie]=fe(g,ue[ie]);const le=ue[0],Be=r.convert(g.format,g.colorSpace),ke=r.convert(g.type),He=T(g.internalFormat,Be,ke,g.normalized,g.colorSpace),C=g.isVideoTexture!==!0,oe=ae.__version===void 0||Z===!0,K=te.dataReady;let Te=A(g,le);De(i.TEXTURE_CUBE_MAP,g);let de;if(Ee){C&&oe&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Te,He,le.width,le.height);for(let ie=0;ie<6;ie++){de=ue[ie].mipmaps;for(let Pe=0;Pe<de.length;Pe++){const Ge=de[Pe];g.format!==Zt?Be!==null?C?K&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe,0,0,Ge.width,Ge.height,Be,Ge.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe,He,Ge.width,Ge.height,0,Ge.data):Fe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):C?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe,0,0,Ge.width,Ge.height,Be,ke,Ge.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe,He,Ge.width,Ge.height,0,Be,ke,Ge.data)}}}else{if(de=g.mipmaps,C&&oe){de.length>0&&Te++;const ie=st(ue[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Te,He,ie.width,ie.height)}for(let ie=0;ie<6;ie++)if(Ae){C?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,ue[ie].width,ue[ie].height,Be,ke,ue[ie].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,He,ue[ie].width,ue[ie].height,0,Be,ke,ue[ie].data);for(let Pe=0;Pe<de.length;Pe++){const ft=de[Pe].image[ie].image;C?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe+1,0,0,ft.width,ft.height,Be,ke,ft.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe+1,He,ft.width,ft.height,0,Be,ke,ft.data)}}else{C?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,Be,ke,ue[ie]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,He,Be,ke,ue[ie]);for(let Pe=0;Pe<de.length;Pe++){const Ge=de[Pe];C?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe+1,0,0,Be,ke,Ge.image[ie]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Pe+1,He,Be,ke,Ge.image[ie])}}}d(g)&&M(i.TEXTURE_CUBE_MAP),ae.__version=te.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function F(b,g,z,Z,te,ae){const pe=r.convert(z.format,z.colorSpace),$=r.convert(z.type),J=T(z.internalFormat,pe,$,z.normalized,z.colorSpace),Ee=n.get(g),Ae=n.get(z);if(Ae.__renderTarget=g,!Ee.__hasExternalTextures){const ue=Math.max(1,g.width>>ae),le=Math.max(1,g.height>>ae);te===i.TEXTURE_3D||te===i.TEXTURE_2D_ARRAY?t.texImage3D(te,ae,J,ue,le,g.depth,0,pe,$,null):t.texImage2D(te,ae,J,ue,le,0,pe,$,null)}t.bindFramebuffer(i.FRAMEBUFFER,b),Ue(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,te,Ae.__webglTexture,0,ot(g)):(te===i.TEXTURE_2D||te>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&te<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,te,Ae.__webglTexture,ae),t.bindFramebuffer(i.FRAMEBUFFER,null)}function _e(b,g,z){if(i.bindRenderbuffer(i.RENDERBUFFER,b),g.depthBuffer){const Z=g.depthTexture,te=Z&&Z.isDepthTexture?Z.type:null,ae=L(g.stencilBuffer,te),pe=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;Ue(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ot(g),ae,g.width,g.height):z?i.renderbufferStorageMultisample(i.RENDERBUFFER,ot(g),ae,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,ae,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,pe,i.RENDERBUFFER,b)}else{const Z=g.textures;for(let te=0;te<Z.length;te++){const ae=Z[te],pe=r.convert(ae.format,ae.colorSpace),$=r.convert(ae.type),J=T(ae.internalFormat,pe,$,ae.normalized,ae.colorSpace);Ue(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ot(g),J,g.width,g.height):z?i.renderbufferStorageMultisample(i.RENDERBUFFER,ot(g),J,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,J,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ge(b,g,z){const Z=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,b),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const te=n.get(g.depthTexture);if(te.__renderTarget=g,(!te.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),Z){if(te.__webglInit===void 0&&(te.__webglInit=!0,g.depthTexture.addEventListener("dispose",P)),te.__webglTexture===void 0){te.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,te.__webglTexture),De(i.TEXTURE_CUBE_MAP,g.depthTexture);const Ee=r.convert(g.depthTexture.format),Ae=r.convert(g.depthTexture.type);let ue;g.depthTexture.format===vn?ue=i.DEPTH_COMPONENT24:g.depthTexture.format===Hn&&(ue=i.DEPTH24_STENCIL8);for(let le=0;le<6;le++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,ue,g.width,g.height,0,Ee,Ae,null)}}else ee(g.depthTexture,0);const ae=te.__webglTexture,pe=ot(g),$=Z?i.TEXTURE_CUBE_MAP_POSITIVE_X+z:i.TEXTURE_2D,J=g.depthTexture.format===Hn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(g.depthTexture.format===vn)Ue(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,$,ae,0,pe):i.framebufferTexture2D(i.FRAMEBUFFER,J,$,ae,0);else if(g.depthTexture.format===Hn)Ue(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,$,ae,0,pe):i.framebufferTexture2D(i.FRAMEBUFFER,J,$,ae,0);else throw new Error("Unknown depthTexture format")}function xe(b){const g=n.get(b),z=b.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==b.depthTexture){const Z=b.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),Z){const te=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,Z.removeEventListener("dispose",te)};Z.addEventListener("dispose",te),g.__depthDisposeCallback=te}g.__boundDepthTexture=Z}if(b.depthTexture&&!g.__autoAllocateDepthBuffer)if(z)for(let Z=0;Z<6;Z++)ge(g.__webglFramebuffer[Z],b,Z);else{const Z=b.texture.mipmaps;Z&&Z.length>0?ge(g.__webglFramebuffer[0],b,0):ge(g.__webglFramebuffer,b,0)}else if(z){g.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[Z]),g.__webglDepthbuffer[Z]===void 0)g.__webglDepthbuffer[Z]=i.createRenderbuffer(),_e(g.__webglDepthbuffer[Z],b,!1);else{const te=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=g.__webglDepthbuffer[Z];i.bindRenderbuffer(i.RENDERBUFFER,ae),i.framebufferRenderbuffer(i.FRAMEBUFFER,te,i.RENDERBUFFER,ae)}}else{const Z=b.texture.mipmaps;if(Z&&Z.length>0?t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),_e(g.__webglDepthbuffer,b,!1);else{const te=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ae),i.framebufferRenderbuffer(i.FRAMEBUFFER,te,i.RENDERBUFFER,ae)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Oe(b,g,z){const Z=n.get(b);g!==void 0&&F(Z.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),z!==void 0&&xe(b)}function Ce(b){const g=b.texture,z=n.get(b),Z=n.get(g);b.addEventListener("dispose",S);const te=b.textures,ae=b.isWebGLCubeRenderTarget===!0,pe=te.length>1;if(pe||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=g.version,a.memory.textures++),ae){z.__webglFramebuffer=[];for(let $=0;$<6;$++)if(g.mipmaps&&g.mipmaps.length>0){z.__webglFramebuffer[$]=[];for(let J=0;J<g.mipmaps.length;J++)z.__webglFramebuffer[$][J]=i.createFramebuffer()}else z.__webglFramebuffer[$]=i.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){z.__webglFramebuffer=[];for(let $=0;$<g.mipmaps.length;$++)z.__webglFramebuffer[$]=i.createFramebuffer()}else z.__webglFramebuffer=i.createFramebuffer();if(pe)for(let $=0,J=te.length;$<J;$++){const Ee=n.get(te[$]);Ee.__webglTexture===void 0&&(Ee.__webglTexture=i.createTexture(),a.memory.textures++)}if(b.samples>0&&Ue(b)===!1){z.__webglMultisampledFramebuffer=i.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let $=0;$<te.length;$++){const J=te[$];z.__webglColorRenderbuffer[$]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,z.__webglColorRenderbuffer[$]);const Ee=r.convert(J.format,J.colorSpace),Ae=r.convert(J.type),ue=T(J.internalFormat,Ee,Ae,J.normalized,J.colorSpace,b.isXRRenderTarget===!0),le=ot(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,le,ue,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+$,i.RENDERBUFFER,z.__webglColorRenderbuffer[$])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(z.__webglDepthRenderbuffer=i.createRenderbuffer(),_e(z.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ae){t.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),De(i.TEXTURE_CUBE_MAP,g);for(let $=0;$<6;$++)if(g.mipmaps&&g.mipmaps.length>0)for(let J=0;J<g.mipmaps.length;J++)F(z.__webglFramebuffer[$][J],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,J);else F(z.__webglFramebuffer[$],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);d(g)&&M(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(pe){for(let $=0,J=te.length;$<J;$++){const Ee=te[$],Ae=n.get(Ee);let ue=i.TEXTURE_2D;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(ue=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ue,Ae.__webglTexture),De(ue,Ee),F(z.__webglFramebuffer,b,Ee,i.COLOR_ATTACHMENT0+$,ue,0),d(Ee)&&M(ue)}t.unbindTexture()}else{let $=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&($=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture($,Z.__webglTexture),De($,g),g.mipmaps&&g.mipmaps.length>0)for(let J=0;J<g.mipmaps.length;J++)F(z.__webglFramebuffer[J],b,g,i.COLOR_ATTACHMENT0,$,J);else F(z.__webglFramebuffer,b,g,i.COLOR_ATTACHMENT0,$,0);d(g)&&M($),t.unbindTexture()}b.depthBuffer&&xe(b)}function Ke(b){const g=b.textures;for(let z=0,Z=g.length;z<Z;z++){const te=g[z];if(d(te)){const ae=y(b),pe=n.get(te).__webglTexture;t.bindTexture(ae,pe),M(ae),t.unbindTexture()}}}const qe=[],dt=[];function D(b){if(b.samples>0){if(Ue(b)===!1){const g=b.textures,z=b.width,Z=b.height;let te=i.COLOR_BUFFER_BIT;const ae=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,pe=n.get(b),$=g.length>1;if($)for(let Ee=0;Ee<g.length;Ee++)t.bindFramebuffer(i.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,pe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,pe.__webglMultisampledFramebuffer);const J=b.texture.mipmaps;J&&J.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,pe.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,pe.__webglFramebuffer);for(let Ee=0;Ee<g.length;Ee++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(te|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(te|=i.STENCIL_BUFFER_BIT)),$){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,pe.__webglColorRenderbuffer[Ee]);const Ae=n.get(g[Ee]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ae,0)}i.blitFramebuffer(0,0,z,Z,0,0,z,Z,te,i.NEAREST),c===!0&&(qe.length=0,dt.length=0,qe.push(i.COLOR_ATTACHMENT0+Ee),b.depthBuffer&&b.resolveDepthBuffer===!1&&(qe.push(ae),dt.push(ae),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,dt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,qe))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),$)for(let Ee=0;Ee<g.length;Ee++){t.bindFramebuffer(i.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.RENDERBUFFER,pe.__webglColorRenderbuffer[Ee]);const Ae=n.get(g[Ee]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,pe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.TEXTURE_2D,Ae,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,pe.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.resolveDepthBuffer===!1&&c){const g=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function ot(b){return Math.min(s.maxSamples,b.samples)}function Ue(b){const g=n.get(b);return b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function nt(b){const g=a.render.frame;f.get(b)!==g&&(f.set(b,g),b.update())}function fe(b,g){const z=b.colorSpace,Z=b.format,te=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||z!==ws&&z!==Cn&&(Ze.getTransfer(z)===rt?(Z!==Zt||te!==Vt)&&Fe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):tt("WebGLTextures: Unsupported texture color space:",z)),g}function st(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(l.width=b.naturalWidth||b.width,l.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(l.width=b.displayWidth,l.height=b.displayHeight):(l.width=b.width,l.height=b.height),l}this.allocateTextureUnit=B,this.resetTextureUnits=G,this.getTextureUnits=Y,this.setTextureUnits=N,this.setTexture2D=ee,this.setTexture2DArray=ne,this.setTexture3D=se,this.setTextureCube=me,this.rebindTextures=Oe,this.setupRenderTarget=Ce,this.updateRenderTargetMipmap=Ke,this.updateMultisampleRenderTarget=D,this.setupDepthRenderbuffer=xe,this.setupFrameBufferTexture=F,this.useMultisampledRTT=Ue,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function om(i,e){function t(n,s=Cn){let r;const a=Ze.getTransfer(s);if(n===Vt)return i.UNSIGNED_BYTE;if(n===Sa)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ma)return i.UNSIGNED_SHORT_5_5_5_1;if(n===dl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===hl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===cl)return i.BYTE;if(n===ul)return i.SHORT;if(n===Li)return i.UNSIGNED_SHORT;if(n===va)return i.INT;if(n===on)return i.UNSIGNED_INT;if(n===nn)return i.FLOAT;if(n===xn)return i.HALF_FLOAT;if(n===fl)return i.ALPHA;if(n===pl)return i.RGB;if(n===Zt)return i.RGBA;if(n===vn)return i.DEPTH_COMPONENT;if(n===Hn)return i.DEPTH_STENCIL;if(n===ml)return i.RED;if(n===Ea)return i.RED_INTEGER;if(n===Xn)return i.RG;if(n===ba)return i.RG_INTEGER;if(n===ya)return i.RGBA_INTEGER;if(n===vs||n===Ss||n===Ms||n===Es)if(a===rt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===vs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ss)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Ms)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Es)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===vs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ss)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Ms)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Es)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ur||n===Fr||n===Or||n===Br)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ur)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Fr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Or)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Br)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===zr||n===Gr||n===Vr||n===kr||n===Hr||n===Ts||n===Wr)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===zr||n===Gr)return a===rt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Vr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===kr)return r.COMPRESSED_R11_EAC;if(n===Hr)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ts)return r.COMPRESSED_RG11_EAC;if(n===Wr)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Xr||n===jr||n===qr||n===Yr||n===$r||n===Kr||n===Zr||n===Jr||n===Qr||n===ea||n===ta||n===na||n===ia||n===sa)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Xr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===jr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===qr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Yr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===$r)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Kr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Zr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Jr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Qr)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ea)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ta)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===na)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ia)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===sa)return a===rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ra||n===aa||n===oa)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===ra)return a===rt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===aa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===oa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===la||n===ca||n===As||n===ua)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===la)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ca)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===As)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ua)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Di?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const lm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,cm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class um{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new Tl(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new ln({vertexShader:lm,fragmentShader:cm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Tt(new Pn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class dm extends jn{constructor(e,t){super();const n=this;let s=null,r=1,a=null,o="local-floor",c=1,l=null,f=null,p=null,u=null,m=null,_=null;const E=typeof XRWebGLBinding<"u",h=new um,d={},M=t.getContextAttributes();let y=null,T=null;const L=[],A=[],P=new it;let S=null;const w=new Xt;w.viewport=new gt;const O=new Xt;O.viewport=new gt;const R=[w,O],I=new Su;let G=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let he=L[q];return he===void 0&&(he=new Ys,L[q]=he),he.getTargetRaySpace()},this.getControllerGrip=function(q){let he=L[q];return he===void 0&&(he=new Ys,L[q]=he),he.getGripSpace()},this.getHand=function(q){let he=L[q];return he===void 0&&(he=new Ys,L[q]=he),he.getHandSpace()};function N(q){const he=A.indexOf(q.inputSource);if(he===-1)return;const H=L[he];H!==void 0&&(H.update(q.inputSource,q.frame,l||a),H.dispatchEvent({type:q.type,data:q.inputSource}))}function B(){s.removeEventListener("select",N),s.removeEventListener("selectstart",N),s.removeEventListener("selectend",N),s.removeEventListener("squeeze",N),s.removeEventListener("squeezestart",N),s.removeEventListener("squeezeend",N),s.removeEventListener("end",B),s.removeEventListener("inputsourceschange",k);for(let q=0;q<L.length;q++){const he=A[q];he!==null&&(A[q]=null,L[q].disconnect(he))}G=null,Y=null,h.reset();for(const q in d)delete d[q];e.setRenderTarget(y),m=null,u=null,p=null,s=null,T=null,De.stop(),n.isPresenting=!1,e.setPixelRatio(S),e.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&Fe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,n.isPresenting===!0&&Fe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(q){l=q},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return p===null&&E&&(p=new XRWebGLBinding(s,t)),p},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(y=e.getRenderTarget(),s.addEventListener("select",N),s.addEventListener("selectstart",N),s.addEventListener("selectend",N),s.addEventListener("squeeze",N),s.addEventListener("squeezestart",N),s.addEventListener("squeezeend",N),s.addEventListener("end",B),s.addEventListener("inputsourceschange",k),M.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(P),E&&"createProjectionLayer"in XRWebGLBinding.prototype){let H=null,ce=null,ve=null;M.depth&&(ve=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,H=M.stencil?Hn:vn,ce=M.stencil?Di:on);const F={colorFormat:t.RGBA8,depthFormat:ve,scaleFactor:r};p=this.getBinding(),u=p.createProjectionLayer(F),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),T=new an(u.textureWidth,u.textureHeight,{format:Zt,type:Vt,depthTexture:new _i(u.textureWidth,u.textureHeight,ce,void 0,void 0,void 0,void 0,void 0,void 0,H),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{const H={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,H),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),T=new an(m.framebufferWidth,m.framebufferHeight,{format:Zt,type:Vt,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),De.setContext(s),De.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function k(q){for(let he=0;he<q.removed.length;he++){const H=q.removed[he],ce=A.indexOf(H);ce>=0&&(A[ce]=null,L[ce].disconnect(H))}for(let he=0;he<q.added.length;he++){const H=q.added[he];let ce=A.indexOf(H);if(ce===-1){for(let F=0;F<L.length;F++)if(F>=A.length){A.push(H),ce=F;break}else if(A[F]===null){A[F]=H,ce=F;break}if(ce===-1)break}const ve=L[ce];ve&&ve.connect(H)}}const ee=new V,ne=new V;function se(q,he,H){ee.setFromMatrixPosition(he.matrixWorld),ne.setFromMatrixPosition(H.matrixWorld);const ce=ee.distanceTo(ne),ve=he.projectionMatrix.elements,F=H.projectionMatrix.elements,_e=ve[14]/(ve[10]-1),ge=ve[14]/(ve[10]+1),xe=(ve[9]+1)/ve[5],Oe=(ve[9]-1)/ve[5],Ce=(ve[8]-1)/ve[0],Ke=(F[8]+1)/F[0],qe=_e*Ce,dt=_e*Ke,D=ce/(-Ce+Ke),ot=D*-Ce;if(he.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(ot),q.translateZ(D),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),ve[10]===-1)q.projectionMatrix.copy(he.projectionMatrix),q.projectionMatrixInverse.copy(he.projectionMatrixInverse);else{const Ue=_e+D,nt=ge+D,fe=qe-ot,st=dt+(ce-ot),b=xe*ge/nt*Ue,g=Oe*ge/nt*Ue;q.projectionMatrix.makePerspective(fe,st,b,g,Ue,nt),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function me(q,he){he===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(he.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let he=q.near,H=q.far;h.texture!==null&&(h.depthNear>0&&(he=h.depthNear),h.depthFar>0&&(H=h.depthFar)),I.near=O.near=w.near=he,I.far=O.far=w.far=H,(G!==I.near||Y!==I.far)&&(s.updateRenderState({depthNear:I.near,depthFar:I.far}),G=I.near,Y=I.far),I.layers.mask=q.layers.mask|6,w.layers.mask=I.layers.mask&-5,O.layers.mask=I.layers.mask&-3;const ce=q.parent,ve=I.cameras;me(I,ce);for(let F=0;F<ve.length;F++)me(ve[F],ce);ve.length===2?se(I,w,O):I.projectionMatrix.copy(w.projectionMatrix),Se(q,I,ce)};function Se(q,he,H){H===null?q.matrix.copy(he.matrixWorld):(q.matrix.copy(H.matrixWorld),q.matrix.invert(),q.matrix.multiply(he.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(he.projectionMatrix),q.projectionMatrixInverse.copy(he.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=fa*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return I},this.getFoveation=function(){if(!(u===null&&m===null))return c},this.setFoveation=function(q){c=q,u!==null&&(u.fixedFoveation=q),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=q)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(I)},this.getCameraTexture=function(q){return d[q]};let ze=null;function Ve(q,he){if(f=he.getViewerPose(l||a),_=he,f!==null){const H=f.views;m!==null&&(e.setRenderTargetFramebuffer(T,m.framebuffer),e.setRenderTarget(T));let ce=!1;H.length!==I.cameras.length&&(I.cameras.length=0,ce=!0);for(let ge=0;ge<H.length;ge++){const xe=H[ge];let Oe=null;if(m!==null)Oe=m.getViewport(xe);else{const Ke=p.getViewSubImage(u,xe);Oe=Ke.viewport,ge===0&&(e.setRenderTargetTextures(T,Ke.colorTexture,Ke.depthStencilTexture),e.setRenderTarget(T))}let Ce=R[ge];Ce===void 0&&(Ce=new Xt,Ce.layers.enable(ge),Ce.viewport=new gt,R[ge]=Ce),Ce.matrix.fromArray(xe.transform.matrix),Ce.matrix.decompose(Ce.position,Ce.quaternion,Ce.scale),Ce.projectionMatrix.fromArray(xe.projectionMatrix),Ce.projectionMatrixInverse.copy(Ce.projectionMatrix).invert(),Ce.viewport.set(Oe.x,Oe.y,Oe.width,Oe.height),ge===0&&(I.matrix.copy(Ce.matrix),I.matrix.decompose(I.position,I.quaternion,I.scale)),ce===!0&&I.cameras.push(Ce)}const ve=s.enabledFeatures;if(ve&&ve.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&E){p=n.getBinding();const ge=p.getDepthInformation(H[0]);ge&&ge.isValid&&ge.texture&&h.init(ge,s.renderState)}if(ve&&ve.includes("camera-access")&&E){e.state.unbindTexture(),p=n.getBinding();for(let ge=0;ge<H.length;ge++){const xe=H[ge].camera;if(xe){let Oe=d[xe];Oe||(Oe=new Tl,d[xe]=Oe);const Ce=p.getCameraImage(xe);Oe.sourceTexture=Ce}}}}for(let H=0;H<L.length;H++){const ce=A[H],ve=L[H];ce!==null&&ve!==void 0&&ve.update(ce,he,l||a)}ze&&ze(q,he),he.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:he}),_=null}const De=new Cl;De.setAnimationLoop(Ve),this.setAnimationLoop=function(q){ze=q},this.dispose=function(){}}}const hm=new pt,Fl=new Xe;Fl.set(-1,0,0,0,1,0,0,0,1);function fm(i,e){function t(h,d){h.matrixAutoUpdate===!0&&h.updateMatrix(),d.value.copy(h.matrix)}function n(h,d){d.color.getRGB(h.fogColor.value,Al(i)),d.isFog?(h.fogNear.value=d.near,h.fogFar.value=d.far):d.isFogExp2&&(h.fogDensity.value=d.density)}function s(h,d,M,y,T){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?r(h,d):d.isMeshLambertMaterial?(r(h,d),d.envMap&&(h.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(r(h,d),p(h,d)):d.isMeshPhongMaterial?(r(h,d),f(h,d),d.envMap&&(h.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(r(h,d),u(h,d),d.isMeshPhysicalMaterial&&m(h,d,T)):d.isMeshMatcapMaterial?(r(h,d),_(h,d)):d.isMeshDepthMaterial?r(h,d):d.isMeshDistanceMaterial?(r(h,d),E(h,d)):d.isMeshNormalMaterial?r(h,d):d.isLineBasicMaterial?(a(h,d),d.isLineDashedMaterial&&o(h,d)):d.isPointsMaterial?c(h,d,M,y):d.isSpriteMaterial?l(h,d):d.isShadowMaterial?(h.color.value.copy(d.color),h.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(h,d){h.opacity.value=d.opacity,d.color&&h.diffuse.value.copy(d.color),d.emissive&&h.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(h.map.value=d.map,t(d.map,h.mapTransform)),d.alphaMap&&(h.alphaMap.value=d.alphaMap,t(d.alphaMap,h.alphaMapTransform)),d.bumpMap&&(h.bumpMap.value=d.bumpMap,t(d.bumpMap,h.bumpMapTransform),h.bumpScale.value=d.bumpScale,d.side===Ut&&(h.bumpScale.value*=-1)),d.normalMap&&(h.normalMap.value=d.normalMap,t(d.normalMap,h.normalMapTransform),h.normalScale.value.copy(d.normalScale),d.side===Ut&&h.normalScale.value.negate()),d.displacementMap&&(h.displacementMap.value=d.displacementMap,t(d.displacementMap,h.displacementMapTransform),h.displacementScale.value=d.displacementScale,h.displacementBias.value=d.displacementBias),d.emissiveMap&&(h.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,h.emissiveMapTransform)),d.specularMap&&(h.specularMap.value=d.specularMap,t(d.specularMap,h.specularMapTransform)),d.alphaTest>0&&(h.alphaTest.value=d.alphaTest);const M=e.get(d),y=M.envMap,T=M.envMapRotation;y&&(h.envMap.value=y,h.envMapRotation.value.setFromMatrix4(hm.makeRotationFromEuler(T)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&h.envMapRotation.value.premultiply(Fl),h.reflectivity.value=d.reflectivity,h.ior.value=d.ior,h.refractionRatio.value=d.refractionRatio),d.lightMap&&(h.lightMap.value=d.lightMap,h.lightMapIntensity.value=d.lightMapIntensity,t(d.lightMap,h.lightMapTransform)),d.aoMap&&(h.aoMap.value=d.aoMap,h.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,h.aoMapTransform))}function a(h,d){h.diffuse.value.copy(d.color),h.opacity.value=d.opacity,d.map&&(h.map.value=d.map,t(d.map,h.mapTransform))}function o(h,d){h.dashSize.value=d.dashSize,h.totalSize.value=d.dashSize+d.gapSize,h.scale.value=d.scale}function c(h,d,M,y){h.diffuse.value.copy(d.color),h.opacity.value=d.opacity,h.size.value=d.size*M,h.scale.value=y*.5,d.map&&(h.map.value=d.map,t(d.map,h.uvTransform)),d.alphaMap&&(h.alphaMap.value=d.alphaMap,t(d.alphaMap,h.alphaMapTransform)),d.alphaTest>0&&(h.alphaTest.value=d.alphaTest)}function l(h,d){h.diffuse.value.copy(d.color),h.opacity.value=d.opacity,h.rotation.value=d.rotation,d.map&&(h.map.value=d.map,t(d.map,h.mapTransform)),d.alphaMap&&(h.alphaMap.value=d.alphaMap,t(d.alphaMap,h.alphaMapTransform)),d.alphaTest>0&&(h.alphaTest.value=d.alphaTest)}function f(h,d){h.specular.value.copy(d.specular),h.shininess.value=Math.max(d.shininess,1e-4)}function p(h,d){d.gradientMap&&(h.gradientMap.value=d.gradientMap)}function u(h,d){h.metalness.value=d.metalness,d.metalnessMap&&(h.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,h.metalnessMapTransform)),h.roughness.value=d.roughness,d.roughnessMap&&(h.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,h.roughnessMapTransform)),d.envMap&&(h.envMapIntensity.value=d.envMapIntensity)}function m(h,d,M){h.ior.value=d.ior,d.sheen>0&&(h.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),h.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(h.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,h.sheenColorMapTransform)),d.sheenRoughnessMap&&(h.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,h.sheenRoughnessMapTransform))),d.clearcoat>0&&(h.clearcoat.value=d.clearcoat,h.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(h.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,h.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(h.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,h.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(h.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,h.clearcoatNormalMapTransform),h.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Ut&&h.clearcoatNormalScale.value.negate())),d.dispersion>0&&(h.dispersion.value=d.dispersion),d.iridescence>0&&(h.iridescence.value=d.iridescence,h.iridescenceIOR.value=d.iridescenceIOR,h.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],h.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(h.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,h.iridescenceMapTransform)),d.iridescenceThicknessMap&&(h.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,h.iridescenceThicknessMapTransform))),d.transmission>0&&(h.transmission.value=d.transmission,h.transmissionSamplerMap.value=M.texture,h.transmissionSamplerSize.value.set(M.width,M.height),d.transmissionMap&&(h.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,h.transmissionMapTransform)),h.thickness.value=d.thickness,d.thicknessMap&&(h.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,h.thicknessMapTransform)),h.attenuationDistance.value=d.attenuationDistance,h.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(h.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(h.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,h.anisotropyMapTransform))),h.specularIntensity.value=d.specularIntensity,h.specularColor.value.copy(d.specularColor),d.specularColorMap&&(h.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,h.specularColorMapTransform)),d.specularIntensityMap&&(h.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,h.specularIntensityMapTransform))}function _(h,d){d.matcap&&(h.matcap.value=d.matcap)}function E(h,d){const M=e.get(d).light;h.referencePosition.value.setFromMatrixPosition(M.matrixWorld),h.nearDistance.value=M.shadow.camera.near,h.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function pm(i,e,t,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(M,y){const T=y.program;n.uniformBlockBinding(M,T)}function l(M,y){let T=s[M.id];T===void 0&&(_(M),T=f(M),s[M.id]=T,M.addEventListener("dispose",h));const L=y.program;n.updateUBOMapping(M,L);const A=e.render.frame;r[M.id]!==A&&(u(M),r[M.id]=A)}function f(M){const y=p();M.__bindingPointIndex=y;const T=i.createBuffer(),L=M.__size,A=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,L,A),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,y,T),T}function p(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return tt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(M){const y=s[M.id],T=M.uniforms,L=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,y);for(let A=0,P=T.length;A<P;A++){const S=Array.isArray(T[A])?T[A]:[T[A]];for(let w=0,O=S.length;w<O;w++){const R=S[w];if(m(R,A,w,L)===!0){const I=R.__offset,G=Array.isArray(R.value)?R.value:[R.value];let Y=0;for(let N=0;N<G.length;N++){const B=G[N],k=E(B);typeof B=="number"||typeof B=="boolean"?(R.__data[0]=B,i.bufferSubData(i.UNIFORM_BUFFER,I+Y,R.__data)):B.isMatrix3?(R.__data[0]=B.elements[0],R.__data[1]=B.elements[1],R.__data[2]=B.elements[2],R.__data[3]=0,R.__data[4]=B.elements[3],R.__data[5]=B.elements[4],R.__data[6]=B.elements[5],R.__data[7]=0,R.__data[8]=B.elements[6],R.__data[9]=B.elements[7],R.__data[10]=B.elements[8],R.__data[11]=0):ArrayBuffer.isView(B)?R.__data.set(new B.constructor(B.buffer,B.byteOffset,R.__data.length)):(B.toArray(R.__data,Y),Y+=k.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,I,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(M,y,T,L){const A=M.value,P=y+"_"+T;if(L[P]===void 0)return typeof A=="number"||typeof A=="boolean"?L[P]=A:ArrayBuffer.isView(A)?L[P]=A.slice():L[P]=A.clone(),!0;{const S=L[P];if(typeof A=="number"||typeof A=="boolean"){if(S!==A)return L[P]=A,!0}else{if(ArrayBuffer.isView(A))return!0;if(S.equals(A)===!1)return S.copy(A),!0}}return!1}function _(M){const y=M.uniforms;let T=0;const L=16;for(let P=0,S=y.length;P<S;P++){const w=Array.isArray(y[P])?y[P]:[y[P]];for(let O=0,R=w.length;O<R;O++){const I=w[O],G=Array.isArray(I.value)?I.value:[I.value];for(let Y=0,N=G.length;Y<N;Y++){const B=G[Y],k=E(B),ee=T%L,ne=ee%k.boundary,se=ee+ne;T+=ne,se!==0&&L-se<k.storage&&(T+=L-se),I.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=T,T+=k.storage}}}const A=T%L;return A>0&&(T+=L-A),M.__size=T,M.__cache={},this}function E(M){const y={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(y.boundary=4,y.storage=4):M.isVector2?(y.boundary=8,y.storage=8):M.isVector3||M.isColor?(y.boundary=16,y.storage=12):M.isVector4?(y.boundary=16,y.storage=16):M.isMatrix3?(y.boundary=48,y.storage=48):M.isMatrix4?(y.boundary=64,y.storage=64):M.isTexture?Fe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(y.boundary=16,y.storage=M.byteLength):Fe("WebGLRenderer: Unsupported uniform value type.",M),y}function h(M){const y=M.target;y.removeEventListener("dispose",h);const T=a.indexOf(y.__bindingPointIndex);a.splice(T,1),i.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function d(){for(const M in s)i.deleteBuffer(s[M]);a=[],s={},r={}}return{bind:c,update:l,dispose:d}}const mm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let en=null;function gm(){return en===null&&(en=new Zc(mm,16,16,Xn,xn),en.name="DFG_LUT",en.minFilter=Pt,en.magFilter=Pt,en.wrapS=mn,en.wrapT=mn,en.generateMipmaps=!1,en.needsUpdate=!0),en}class _m{constructor(e={}){const{canvas:t=Rc(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:u=!1,outputBufferType:m=Vt}=e;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=a;const E=m,h=new Set([ya,ba,Ea]),d=new Set([Vt,on,Li,Di,Sa,Ma]),M=new Uint32Array(4),y=new Int32Array(4),T=new V;let L=null,A=null;const P=[],S=[];let w=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=rn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const O=this;let R=!1,I=null;this._outputColorSpace=Wt;let G=0,Y=0,N=null,B=-1,k=null;const ee=new gt,ne=new gt;let se=null;const me=new Qe(0);let Se=0,ze=t.width,Ve=t.height,De=1,q=null,he=null;const H=new gt(0,0,ze,Ve),ce=new gt(0,0,ze,Ve);let ve=!1;const F=new Ca;let _e=!1,ge=!1;const xe=new pt,Oe=new V,Ce=new gt,Ke={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let qe=!1;function dt(){return N===null?De:1}let D=n;function ot(v,U){return t.getContext(v,U)}try{const v={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:f,failIfMajorPerformanceCaveat:p};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${_a}`),t.addEventListener("webglcontextlost",ie,!1),t.addEventListener("webglcontextrestored",Pe,!1),t.addEventListener("webglcontextcreationerror",Ge,!1),D===null){const U="webgl2";if(D=ot(U,v),D===null)throw ot(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw tt("WebGLRenderer: "+v.message),v}let Ue,nt,fe,st,b,g,z,Z,te,ae,pe,$,J,Ee,Ae,ue,le,Be,ke,He,C,oe,K;function Te(){Ue=new gf(D),Ue.init(),C=new om(D,Ue),nt=new lf(D,Ue,e,C),fe=new rm(D,Ue),nt.reversedDepthBuffer&&u&&fe.buffers.depth.setReversed(!0),st=new vf(D),b=new Xp,g=new am(D,Ue,fe,b,nt,C,st),z=new mf(O),Z=new Eu(D),oe=new af(D,Z),te=new _f(D,Z,st,oe),ae=new Mf(D,te,Z,oe,st),Be=new Sf(D,nt,g),Ae=new cf(b),pe=new Wp(O,z,Ue,nt,oe,Ae),$=new fm(O,b),J=new qp,Ee=new Qp(Ue),le=new rf(O,z,fe,ae,_,c),ue=new sm(O,ae,nt),K=new pm(D,st,nt,fe),ke=new of(D,Ue,st),He=new xf(D,Ue,st),st.programs=pe.programs,O.capabilities=nt,O.extensions=Ue,O.properties=b,O.renderLists=J,O.shadowMap=ue,O.state=fe,O.info=st}Te(),E!==Vt&&(w=new bf(E,t.width,t.height,s,r));const de=new dm(O,D);this.xr=de,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const v=Ue.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){const v=Ue.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return De},this.setPixelRatio=function(v){v!==void 0&&(De=v,this.setSize(ze,Ve,!1))},this.getSize=function(v){return v.set(ze,Ve)},this.setSize=function(v,U,j=!0){if(de.isPresenting){Fe("WebGLRenderer: Can't change size while VR device is presenting.");return}ze=v,Ve=U,t.width=Math.floor(v*De),t.height=Math.floor(U*De),j===!0&&(t.style.width=v+"px",t.style.height=U+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,v,U)},this.getDrawingBufferSize=function(v){return v.set(ze*De,Ve*De).floor()},this.setDrawingBufferSize=function(v,U,j){ze=v,Ve=U,De=j,t.width=Math.floor(v*j),t.height=Math.floor(U*j),this.setViewport(0,0,v,U)},this.setEffects=function(v){if(E===Vt){tt("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let U=0;U<v.length;U++)if(v[U].isOutputPass===!0){Fe("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(ee)},this.getViewport=function(v){return v.copy(H)},this.setViewport=function(v,U,j,W){v.isVector4?H.set(v.x,v.y,v.z,v.w):H.set(v,U,j,W),fe.viewport(ee.copy(H).multiplyScalar(De).round())},this.getScissor=function(v){return v.copy(ce)},this.setScissor=function(v,U,j,W){v.isVector4?ce.set(v.x,v.y,v.z,v.w):ce.set(v,U,j,W),fe.scissor(ne.copy(ce).multiplyScalar(De).round())},this.getScissorTest=function(){return ve},this.setScissorTest=function(v){fe.setScissorTest(ve=v)},this.setOpaqueSort=function(v){q=v},this.setTransparentSort=function(v){he=v},this.getClearColor=function(v){return v.copy(le.getClearColor())},this.setClearColor=function(){le.setClearColor(...arguments)},this.getClearAlpha=function(){return le.getClearAlpha()},this.setClearAlpha=function(){le.setClearAlpha(...arguments)},this.clear=function(v=!0,U=!0,j=!0){let W=0;if(v){let X=!1;if(N!==null){const ye=N.texture.format;X=h.has(ye)}if(X){const ye=N.texture.type,Re=d.has(ye),be=le.getClearColor(),Ne=le.getClearAlpha(),Le=be.r,je=be.g,$e=be.b;Re?(M[0]=Le,M[1]=je,M[2]=$e,M[3]=Ne,D.clearBufferuiv(D.COLOR,0,M)):(y[0]=Le,y[1]=je,y[2]=$e,y[3]=Ne,D.clearBufferiv(D.COLOR,0,y))}else W|=D.COLOR_BUFFER_BIT}U&&(W|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),j&&(W|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),W!==0&&D.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),I=v},this.dispose=function(){t.removeEventListener("webglcontextlost",ie,!1),t.removeEventListener("webglcontextrestored",Pe,!1),t.removeEventListener("webglcontextcreationerror",Ge,!1),le.dispose(),J.dispose(),Ee.dispose(),b.dispose(),z.dispose(),ae.dispose(),oe.dispose(),K.dispose(),pe.dispose(),de.dispose(),de.removeEventListener("sessionstart",Oa),de.removeEventListener("sessionend",Ba),In.stop()};function ie(v){v.preventDefault(),Qa("WebGLRenderer: Context Lost."),R=!0}function Pe(){Qa("WebGLRenderer: Context Restored."),R=!1;const v=st.autoReset,U=ue.enabled,j=ue.autoUpdate,W=ue.needsUpdate,X=ue.type;Te(),st.autoReset=v,ue.enabled=U,ue.autoUpdate=j,ue.needsUpdate=W,ue.type=X}function Ge(v){tt("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function ft(v){const U=v.target;U.removeEventListener("dispose",ft),Q(U)}function Q(v){We(v),b.remove(v)}function We(v){const U=b.get(v).programs;U!==void 0&&(U.forEach(function(j){pe.releaseProgram(j)}),v.isShaderMaterial&&pe.releaseShaderCache(v))}this.renderBufferDirect=function(v,U,j,W,X,ye){U===null&&(U=Ke);const Re=X.isMesh&&X.matrixWorld.determinant()<0,be=Bl(v,U,j,W,X);fe.setMaterial(W,Re);let Ne=j.index,Le=1;if(W.wireframe===!0){if(Ne=te.getWireframeAttribute(j),Ne===void 0)return;Le=2}const je=j.drawRange,$e=j.attributes.position;let Ie=je.start*Le,at=(je.start+je.count)*Le;ye!==null&&(Ie=Math.max(Ie,ye.start*Le),at=Math.min(at,(ye.start+ye.count)*Le)),Ne!==null?(Ie=Math.max(Ie,0),at=Math.min(at,Ne.count)):$e!=null&&(Ie=Math.max(Ie,0),at=Math.min(at,$e.count));const _t=at-Ie;if(_t<0||_t===1/0)return;oe.setup(X,W,be,j,Ne);let mt,ct=ke;if(Ne!==null&&(mt=Z.get(Ne),ct=He,ct.setIndex(mt)),X.isMesh)W.wireframe===!0?(fe.setLineWidth(W.wireframeLinewidth*dt()),ct.setMode(D.LINES)):ct.setMode(D.TRIANGLES);else if(X.isLine){let wt=W.linewidth;wt===void 0&&(wt=1),fe.setLineWidth(wt*dt()),X.isLineSegments?ct.setMode(D.LINES):X.isLineLoop?ct.setMode(D.LINE_LOOP):ct.setMode(D.LINE_STRIP)}else X.isPoints?ct.setMode(D.POINTS):X.isSprite&&ct.setMode(D.TRIANGLES);if(X.isBatchedMesh)if(Ue.get("WEBGL_multi_draw"))ct.renderMultiDraw(X._multiDrawStarts,X._multiDrawCounts,X._multiDrawCount);else{const wt=X._multiDrawStarts,we=X._multiDrawCounts,Ot=X._multiDrawCount,et=Ne?Z.get(Ne).bytesPerElement:1,kt=b.get(W).currentProgram.getUniforms();for(let Jt=0;Jt<Ot;Jt++)kt.setValue(D,"_gl_DrawID",Jt),ct.render(wt[Jt]/et,we[Jt])}else if(X.isInstancedMesh)ct.renderInstances(Ie,_t,X.count);else if(j.isInstancedBufferGeometry){const wt=j._maxInstanceCount!==void 0?j._maxInstanceCount:1/0,we=Math.min(j.instanceCount,wt);ct.renderInstances(Ie,_t,we)}else ct.render(Ie,_t)};function lt(v,U,j){v.transparent===!0&&v.side===pn&&v.forceSinglePass===!1?(v.side=Ut,v.needsUpdate=!0,Vi(v,U,j),v.side=Ln,v.needsUpdate=!0,Vi(v,U,j),v.side=pn):Vi(v,U,j)}this.compile=function(v,U,j=null){j===null&&(j=v),A=Ee.get(j),A.init(U),S.push(A),j.traverseVisible(function(X){X.isLight&&X.layers.test(U.layers)&&(A.pushLight(X),X.castShadow&&A.pushShadow(X))}),v!==j&&v.traverseVisible(function(X){X.isLight&&X.layers.test(U.layers)&&(A.pushLight(X),X.castShadow&&A.pushShadow(X))}),A.setupLights();const W=new Set;return v.traverse(function(X){if(!(X.isMesh||X.isPoints||X.isLine||X.isSprite))return;const ye=X.material;if(ye)if(Array.isArray(ye))for(let Re=0;Re<ye.length;Re++){const be=ye[Re];lt(be,j,X),W.add(be)}else lt(ye,j,X),W.add(ye)}),A=S.pop(),W},this.compileAsync=function(v,U,j=null){const W=this.compile(v,U,j);return new Promise(X=>{function ye(){if(W.forEach(function(Re){b.get(Re).currentProgram.isReady()&&W.delete(Re)}),W.size===0){X(v);return}setTimeout(ye,10)}Ue.get("KHR_parallel_shader_compile")!==null?ye():setTimeout(ye,10)})};let yt=null;function Os(v){yt&&yt(v)}function Oa(){In.stop()}function Ba(){In.start()}const In=new Cl;In.setAnimationLoop(Os),typeof self<"u"&&In.setContext(self),this.setAnimationLoop=function(v){yt=v,de.setAnimationLoop(v),v===null?In.stop():In.start()},de.addEventListener("sessionstart",Oa),de.addEventListener("sessionend",Ba),this.render=function(v,U){if(U!==void 0&&U.isCamera!==!0){tt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;I!==null&&I.renderStart(v,U);const j=de.enabled===!0&&de.isPresenting===!0,W=w!==null&&(N===null||j)&&w.begin(O,N);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),de.enabled===!0&&de.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(de.cameraAutoUpdate===!0&&de.updateCamera(U),U=de.getCamera()),v.isScene===!0&&v.onBeforeRender(O,v,U,N),A=Ee.get(v,S.length),A.init(U),A.state.textureUnits=g.getTextureUnits(),S.push(A),xe.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),F.setFromProjectionMatrix(xe,sn,U.reversedDepth),ge=this.localClippingEnabled,_e=Ae.init(this.clippingPlanes,ge),L=J.get(v,P.length),L.init(),P.push(L),de.enabled===!0&&de.isPresenting===!0){const Re=O.xr.getDepthSensingMesh();Re!==null&&Bs(Re,U,-1/0,O.sortObjects)}Bs(v,U,0,O.sortObjects),L.finish(),O.sortObjects===!0&&L.sort(q,he),qe=de.enabled===!1||de.isPresenting===!1||de.hasDepthSensing()===!1,qe&&le.addToRenderList(L,v),this.info.render.frame++,_e===!0&&Ae.beginShadows();const X=A.state.shadowsArray;if(ue.render(X,v,U),_e===!0&&Ae.endShadows(),this.info.autoReset===!0&&this.info.reset(),(W&&w.hasRenderPass())===!1){const Re=L.opaque,be=L.transmissive;if(A.setupLights(),U.isArrayCamera){const Ne=U.cameras;if(be.length>0)for(let Le=0,je=Ne.length;Le<je;Le++){const $e=Ne[Le];Ga(Re,be,v,$e)}qe&&le.render(v);for(let Le=0,je=Ne.length;Le<je;Le++){const $e=Ne[Le];za(L,v,$e,$e.viewport)}}else be.length>0&&Ga(Re,be,v,U),qe&&le.render(v),za(L,v,U)}N!==null&&Y===0&&(g.updateMultisampleRenderTarget(N),g.updateRenderTargetMipmap(N)),W&&w.end(O),v.isScene===!0&&v.onAfterRender(O,v,U),oe.resetDefaultState(),B=-1,k=null,S.pop(),S.length>0?(A=S[S.length-1],g.setTextureUnits(A.state.textureUnits),_e===!0&&Ae.setGlobalState(O.clippingPlanes,A.state.camera)):A=null,P.pop(),P.length>0?L=P[P.length-1]:L=null,I!==null&&I.renderEnd()};function Bs(v,U,j,W){if(v.visible===!1)return;if(v.layers.test(U.layers)){if(v.isGroup)j=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(U);else if(v.isLightProbeGrid)A.pushLightProbeGrid(v);else if(v.isLight)A.pushLight(v),v.castShadow&&A.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||F.intersectsSprite(v)){W&&Ce.setFromMatrixPosition(v.matrixWorld).applyMatrix4(xe);const Re=ae.update(v),be=v.material;be.visible&&L.push(v,Re,be,j,Ce.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||F.intersectsObject(v))){const Re=ae.update(v),be=v.material;if(W&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Ce.copy(v.boundingSphere.center)):(Re.boundingSphere===null&&Re.computeBoundingSphere(),Ce.copy(Re.boundingSphere.center)),Ce.applyMatrix4(v.matrixWorld).applyMatrix4(xe)),Array.isArray(be)){const Ne=Re.groups;for(let Le=0,je=Ne.length;Le<je;Le++){const $e=Ne[Le],Ie=be[$e.materialIndex];Ie&&Ie.visible&&L.push(v,Re,Ie,j,Ce.z,$e)}}else be.visible&&L.push(v,Re,be,j,Ce.z,null)}}const ye=v.children;for(let Re=0,be=ye.length;Re<be;Re++)Bs(ye[Re],U,j,W)}function za(v,U,j,W){const{opaque:X,transmissive:ye,transparent:Re}=v;A.setupLightsView(j),_e===!0&&Ae.setGlobalState(O.clippingPlanes,j),W&&fe.viewport(ee.copy(W)),X.length>0&&Gi(X,U,j),ye.length>0&&Gi(ye,U,j),Re.length>0&&Gi(Re,U,j),fe.buffers.depth.setTest(!0),fe.buffers.depth.setMask(!0),fe.buffers.color.setMask(!0),fe.setPolygonOffset(!1)}function Ga(v,U,j,W){if((j.isScene===!0?j.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[W.id]===void 0){const Ie=Ue.has("EXT_color_buffer_half_float")||Ue.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[W.id]=new an(1,1,{generateMipmaps:!0,type:Ie?xn:Vt,minFilter:kn,samples:Math.max(4,nt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ze.workingColorSpace})}const ye=A.state.transmissionRenderTarget[W.id],Re=W.viewport||ee;ye.setSize(Re.z*O.transmissionResolutionScale,Re.w*O.transmissionResolutionScale);const be=O.getRenderTarget(),Ne=O.getActiveCubeFace(),Le=O.getActiveMipmapLevel();O.setRenderTarget(ye),O.getClearColor(me),Se=O.getClearAlpha(),Se<1&&O.setClearColor(16777215,.5),O.clear(),qe&&le.render(j);const je=O.toneMapping;O.toneMapping=rn;const $e=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),A.setupLightsView(W),_e===!0&&Ae.setGlobalState(O.clippingPlanes,W),Gi(v,j,W),g.updateMultisampleRenderTarget(ye),g.updateRenderTargetMipmap(ye),Ue.has("WEBGL_multisampled_render_to_texture")===!1){let Ie=!1;for(let at=0,_t=U.length;at<_t;at++){const mt=U[at],{object:ct,geometry:wt,material:we,group:Ot}=mt;if(we.side===pn&&ct.layers.test(W.layers)){const et=we.side;we.side=Ut,we.needsUpdate=!0,Va(ct,j,W,wt,we,Ot),we.side=et,we.needsUpdate=!0,Ie=!0}}Ie===!0&&(g.updateMultisampleRenderTarget(ye),g.updateRenderTargetMipmap(ye))}O.setRenderTarget(be,Ne,Le),O.setClearColor(me,Se),$e!==void 0&&(W.viewport=$e),O.toneMapping=je}function Gi(v,U,j){const W=U.isScene===!0?U.overrideMaterial:null;for(let X=0,ye=v.length;X<ye;X++){const Re=v[X],{object:be,geometry:Ne,group:Le}=Re;let je=Re.material;je.allowOverride===!0&&W!==null&&(je=W),be.layers.test(j.layers)&&Va(be,U,j,Ne,je,Le)}}function Va(v,U,j,W,X,ye){v.onBeforeRender(O,U,j,W,X,ye),v.modelViewMatrix.multiplyMatrices(j.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),X.onBeforeRender(O,U,j,W,v,ye),X.transparent===!0&&X.side===pn&&X.forceSinglePass===!1?(X.side=Ut,X.needsUpdate=!0,O.renderBufferDirect(j,U,W,X,v,ye),X.side=Ln,X.needsUpdate=!0,O.renderBufferDirect(j,U,W,X,v,ye),X.side=pn):O.renderBufferDirect(j,U,W,X,v,ye),v.onAfterRender(O,U,j,W,X,ye)}function Vi(v,U,j){U.isScene!==!0&&(U=Ke);const W=b.get(v),X=A.state.lights,ye=A.state.shadowsArray,Re=X.state.version,be=pe.getParameters(v,X.state,ye,U,j,A.state.lightProbeGridArray),Ne=pe.getProgramCacheKey(be);let Le=W.programs;W.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?U.environment:null,W.fog=U.fog;const je=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;W.envMap=z.get(v.envMap||W.environment,je),W.envMapRotation=W.environment!==null&&v.envMap===null?U.environmentRotation:v.envMapRotation,Le===void 0&&(v.addEventListener("dispose",ft),Le=new Map,W.programs=Le);let $e=Le.get(Ne);if($e!==void 0){if(W.currentProgram===$e&&W.lightsStateVersion===Re)return Ha(v,be),$e}else be.uniforms=pe.getUniforms(v),I!==null&&v.isNodeMaterial&&I.build(v,j,be),v.onBeforeCompile(be,O),$e=pe.acquireProgram(be,Ne),Le.set(Ne,$e),W.uniforms=be.uniforms;const Ie=W.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Ie.clippingPlanes=Ae.uniform),Ha(v,be),W.needsLights=Gl(v),W.lightsStateVersion=Re,W.needsLights&&(Ie.ambientLightColor.value=X.state.ambient,Ie.lightProbe.value=X.state.probe,Ie.directionalLights.value=X.state.directional,Ie.directionalLightShadows.value=X.state.directionalShadow,Ie.spotLights.value=X.state.spot,Ie.spotLightShadows.value=X.state.spotShadow,Ie.rectAreaLights.value=X.state.rectArea,Ie.ltc_1.value=X.state.rectAreaLTC1,Ie.ltc_2.value=X.state.rectAreaLTC2,Ie.pointLights.value=X.state.point,Ie.pointLightShadows.value=X.state.pointShadow,Ie.hemisphereLights.value=X.state.hemi,Ie.directionalShadowMatrix.value=X.state.directionalShadowMatrix,Ie.spotLightMatrix.value=X.state.spotLightMatrix,Ie.spotLightMap.value=X.state.spotLightMap,Ie.pointShadowMatrix.value=X.state.pointShadowMatrix),W.lightProbeGrid=A.state.lightProbeGridArray.length>0,W.currentProgram=$e,W.uniformsList=null,$e}function ka(v){if(v.uniformsList===null){const U=v.currentProgram.getUniforms();v.uniformsList=ys.seqWithValue(U.seq,v.uniforms)}return v.uniformsList}function Ha(v,U){const j=b.get(v);j.outputColorSpace=U.outputColorSpace,j.batching=U.batching,j.batchingColor=U.batchingColor,j.instancing=U.instancing,j.instancingColor=U.instancingColor,j.instancingMorph=U.instancingMorph,j.skinning=U.skinning,j.morphTargets=U.morphTargets,j.morphNormals=U.morphNormals,j.morphColors=U.morphColors,j.morphTargetsCount=U.morphTargetsCount,j.numClippingPlanes=U.numClippingPlanes,j.numIntersection=U.numClipIntersection,j.vertexAlphas=U.vertexAlphas,j.vertexTangents=U.vertexTangents,j.toneMapping=U.toneMapping}function Ol(v,U){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;T.setFromMatrixPosition(U.matrixWorld);for(let j=0,W=v.length;j<W;j++){const X=v[j];if(X.texture!==null&&X.boundingBox.containsPoint(T))return X}return null}function Bl(v,U,j,W,X){U.isScene!==!0&&(U=Ke),g.resetTextureUnits();const ye=U.fog,Re=W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial?U.environment:null,be=N===null?O.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Ze.workingColorSpace,Ne=W.isMeshStandardMaterial||W.isMeshLambertMaterial&&!W.envMap||W.isMeshPhongMaterial&&!W.envMap,Le=z.get(W.envMap||Re,Ne),je=W.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,$e=!!j.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Ie=!!j.morphAttributes.position,at=!!j.morphAttributes.normal,_t=!!j.morphAttributes.color;let mt=rn;W.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(mt=O.toneMapping);const ct=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,wt=ct!==void 0?ct.length:0,we=b.get(W),Ot=A.state.lights;if(_e===!0&&(ge===!0||v!==k)){const ht=v===k&&W.id===B;Ae.setState(W,v,ht)}let et=!1;W.version===we.__version?(we.needsLights&&we.lightsStateVersion!==Ot.state.version||we.outputColorSpace!==be||X.isBatchedMesh&&we.batching===!1||!X.isBatchedMesh&&we.batching===!0||X.isBatchedMesh&&we.batchingColor===!0&&X.colorTexture===null||X.isBatchedMesh&&we.batchingColor===!1&&X.colorTexture!==null||X.isInstancedMesh&&we.instancing===!1||!X.isInstancedMesh&&we.instancing===!0||X.isSkinnedMesh&&we.skinning===!1||!X.isSkinnedMesh&&we.skinning===!0||X.isInstancedMesh&&we.instancingColor===!0&&X.instanceColor===null||X.isInstancedMesh&&we.instancingColor===!1&&X.instanceColor!==null||X.isInstancedMesh&&we.instancingMorph===!0&&X.morphTexture===null||X.isInstancedMesh&&we.instancingMorph===!1&&X.morphTexture!==null||we.envMap!==Le||W.fog===!0&&we.fog!==ye||we.numClippingPlanes!==void 0&&(we.numClippingPlanes!==Ae.numPlanes||we.numIntersection!==Ae.numIntersection)||we.vertexAlphas!==je||we.vertexTangents!==$e||we.morphTargets!==Ie||we.morphNormals!==at||we.morphColors!==_t||we.toneMapping!==mt||we.morphTargetsCount!==wt||!!we.lightProbeGrid!=A.state.lightProbeGridArray.length>0)&&(et=!0):(et=!0,we.__version=W.version);let kt=we.currentProgram;et===!0&&(kt=Vi(W,U,X),I&&W.isNodeMaterial&&I.onUpdateProgram(W,kt,we));let Jt=!1,Sn=!1,Yn=!1;const ut=kt.getUniforms(),xt=we.uniforms;if(fe.useProgram(kt.program)&&(Jt=!0,Sn=!0,Yn=!0),W.id!==B&&(B=W.id,Sn=!0),we.needsLights){const ht=Ol(A.state.lightProbeGridArray,X);we.lightProbeGrid!==ht&&(we.lightProbeGrid=ht,Sn=!0)}if(Jt||k!==v){fe.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),ut.setValue(D,"projectionMatrix",v.projectionMatrix),ut.setValue(D,"viewMatrix",v.matrixWorldInverse);const En=ut.map.cameraPosition;En!==void 0&&En.setValue(D,Oe.setFromMatrixPosition(v.matrixWorld)),nt.logarithmicDepthBuffer&&ut.setValue(D,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&ut.setValue(D,"isOrthographic",v.isOrthographicCamera===!0),k!==v&&(k=v,Sn=!0,Yn=!0)}if(we.needsLights&&(Ot.state.directionalShadowMap.length>0&&ut.setValue(D,"directionalShadowMap",Ot.state.directionalShadowMap,g),Ot.state.spotShadowMap.length>0&&ut.setValue(D,"spotShadowMap",Ot.state.spotShadowMap,g),Ot.state.pointShadowMap.length>0&&ut.setValue(D,"pointShadowMap",Ot.state.pointShadowMap,g)),X.isSkinnedMesh){ut.setOptional(D,X,"bindMatrix"),ut.setOptional(D,X,"bindMatrixInverse");const ht=X.skeleton;ht&&(ht.boneTexture===null&&ht.computeBoneTexture(),ut.setValue(D,"boneTexture",ht.boneTexture,g))}X.isBatchedMesh&&(ut.setOptional(D,X,"batchingTexture"),ut.setValue(D,"batchingTexture",X._matricesTexture,g),ut.setOptional(D,X,"batchingIdTexture"),ut.setValue(D,"batchingIdTexture",X._indirectTexture,g),ut.setOptional(D,X,"batchingColorTexture"),X._colorsTexture!==null&&ut.setValue(D,"batchingColorTexture",X._colorsTexture,g));const Mn=j.morphAttributes;if((Mn.position!==void 0||Mn.normal!==void 0||Mn.color!==void 0)&&Be.update(X,j,kt),(Sn||we.receiveShadow!==X.receiveShadow)&&(we.receiveShadow=X.receiveShadow,ut.setValue(D,"receiveShadow",X.receiveShadow)),(W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial)&&W.envMap===null&&U.environment!==null&&(xt.envMapIntensity.value=U.environmentIntensity),xt.dfgLUT!==void 0&&(xt.dfgLUT.value=gm()),Sn){if(ut.setValue(D,"toneMappingExposure",O.toneMappingExposure),we.needsLights&&zl(xt,Yn),ye&&W.fog===!0&&$.refreshFogUniforms(xt,ye),$.refreshMaterialUniforms(xt,W,De,Ve,A.state.transmissionRenderTarget[v.id]),we.needsLights&&we.lightProbeGrid){const ht=we.lightProbeGrid;xt.probesSH.value=ht.texture,xt.probesMin.value.copy(ht.boundingBox.min),xt.probesMax.value.copy(ht.boundingBox.max),xt.probesResolution.value.copy(ht.resolution)}ys.upload(D,ka(we),xt,g)}if(W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(ys.upload(D,ka(we),xt,g),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&ut.setValue(D,"center",X.center),ut.setValue(D,"modelViewMatrix",X.modelViewMatrix),ut.setValue(D,"normalMatrix",X.normalMatrix),ut.setValue(D,"modelMatrix",X.matrixWorld),W.uniformsGroups!==void 0){const ht=W.uniformsGroups;for(let En=0,$n=ht.length;En<$n;En++){const Wa=ht[En];K.update(Wa,kt),K.bind(Wa,kt)}}return kt}function zl(v,U){v.ambientLightColor.needsUpdate=U,v.lightProbe.needsUpdate=U,v.directionalLights.needsUpdate=U,v.directionalLightShadows.needsUpdate=U,v.pointLights.needsUpdate=U,v.pointLightShadows.needsUpdate=U,v.spotLights.needsUpdate=U,v.spotLightShadows.needsUpdate=U,v.rectAreaLights.needsUpdate=U,v.hemisphereLights.needsUpdate=U}function Gl(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return Y},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(v,U,j){const W=b.get(v);W.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,W.__autoAllocateDepthBuffer===!1&&(W.__useRenderToTexture=!1),b.get(v.texture).__webglTexture=U,b.get(v.depthTexture).__webglTexture=W.__autoAllocateDepthBuffer?void 0:j,W.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,U){const j=b.get(v);j.__webglFramebuffer=U,j.__useDefaultFramebuffer=U===void 0};const Vl=D.createFramebuffer();this.setRenderTarget=function(v,U=0,j=0){N=v,G=U,Y=j;let W=null,X=!1,ye=!1;if(v){const be=b.get(v);if(be.__useDefaultFramebuffer!==void 0){fe.bindFramebuffer(D.FRAMEBUFFER,be.__webglFramebuffer),ee.copy(v.viewport),ne.copy(v.scissor),se=v.scissorTest,fe.viewport(ee),fe.scissor(ne),fe.setScissorTest(se),B=-1;return}else if(be.__webglFramebuffer===void 0)g.setupRenderTarget(v);else if(be.__hasExternalTextures)g.rebindTextures(v,b.get(v.texture).__webglTexture,b.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){const je=v.depthTexture;if(be.__boundDepthTexture!==je){if(je!==null&&b.has(je)&&(v.width!==je.image.width||v.height!==je.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");g.setupDepthRenderbuffer(v)}}const Ne=v.texture;(Ne.isData3DTexture||Ne.isDataArrayTexture||Ne.isCompressedArrayTexture)&&(ye=!0);const Le=b.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Le[U])?W=Le[U][j]:W=Le[U],X=!0):v.samples>0&&g.useMultisampledRTT(v)===!1?W=b.get(v).__webglMultisampledFramebuffer:Array.isArray(Le)?W=Le[j]:W=Le,ee.copy(v.viewport),ne.copy(v.scissor),se=v.scissorTest}else ee.copy(H).multiplyScalar(De).floor(),ne.copy(ce).multiplyScalar(De).floor(),se=ve;if(j!==0&&(W=Vl),fe.bindFramebuffer(D.FRAMEBUFFER,W)&&fe.drawBuffers(v,W),fe.viewport(ee),fe.scissor(ne),fe.setScissorTest(se),X){const be=b.get(v.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+U,be.__webglTexture,j)}else if(ye){const be=U;for(let Ne=0;Ne<v.textures.length;Ne++){const Le=b.get(v.textures[Ne]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Ne,Le.__webglTexture,j,be)}}else if(v!==null&&j!==0){const be=b.get(v.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,be.__webglTexture,j)}B=-1},this.readRenderTargetPixels=function(v,U,j,W,X,ye,Re,be=0){if(!(v&&v.isWebGLRenderTarget)){tt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ne=b.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&Re!==void 0&&(Ne=Ne[Re]),Ne){fe.bindFramebuffer(D.FRAMEBUFFER,Ne);try{const Le=v.textures[be],je=Le.format,$e=Le.type;if(v.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+be),!nt.textureFormatReadable(je)){tt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!nt.textureTypeReadable($e)){tt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=v.width-W&&j>=0&&j<=v.height-X&&D.readPixels(U,j,W,X,C.convert(je),C.convert($e),ye)}finally{const Le=N!==null?b.get(N).__webglFramebuffer:null;fe.bindFramebuffer(D.FRAMEBUFFER,Le)}}},this.readRenderTargetPixelsAsync=async function(v,U,j,W,X,ye,Re,be=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ne=b.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&Re!==void 0&&(Ne=Ne[Re]),Ne)if(U>=0&&U<=v.width-W&&j>=0&&j<=v.height-X){fe.bindFramebuffer(D.FRAMEBUFFER,Ne);const Le=v.textures[be],je=Le.format,$e=Le.type;if(v.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+be),!nt.textureFormatReadable(je))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!nt.textureTypeReadable($e))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ie=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ie),D.bufferData(D.PIXEL_PACK_BUFFER,ye.byteLength,D.STREAM_READ),D.readPixels(U,j,W,X,C.convert(je),C.convert($e),0);const at=N!==null?b.get(N).__webglFramebuffer:null;fe.bindFramebuffer(D.FRAMEBUFFER,at);const _t=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await Cc(D,_t,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ie),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,ye),D.deleteBuffer(Ie),D.deleteSync(_t),ye}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,U=null,j=0){const W=Math.pow(2,-j),X=Math.floor(v.image.width*W),ye=Math.floor(v.image.height*W),Re=U!==null?U.x:0,be=U!==null?U.y:0;g.setTexture2D(v,0),D.copyTexSubImage2D(D.TEXTURE_2D,j,0,0,Re,be,X,ye),fe.unbindTexture()};const kl=D.createFramebuffer(),Hl=D.createFramebuffer();this.copyTextureToTexture=function(v,U,j=null,W=null,X=0,ye=0){let Re,be,Ne,Le,je,$e,Ie,at,_t;const mt=v.isCompressedTexture?v.mipmaps[ye]:v.image;if(j!==null)Re=j.max.x-j.min.x,be=j.max.y-j.min.y,Ne=j.isBox3?j.max.z-j.min.z:1,Le=j.min.x,je=j.min.y,$e=j.isBox3?j.min.z:0;else{const xt=Math.pow(2,-X);Re=Math.floor(mt.width*xt),be=Math.floor(mt.height*xt),v.isDataArrayTexture?Ne=mt.depth:v.isData3DTexture?Ne=Math.floor(mt.depth*xt):Ne=1,Le=0,je=0,$e=0}W!==null?(Ie=W.x,at=W.y,_t=W.z):(Ie=0,at=0,_t=0);const ct=C.convert(U.format),wt=C.convert(U.type);let we;U.isData3DTexture?(g.setTexture3D(U,0),we=D.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(g.setTexture2DArray(U,0),we=D.TEXTURE_2D_ARRAY):(g.setTexture2D(U,0),we=D.TEXTURE_2D),fe.activeTexture(D.TEXTURE0),fe.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,U.flipY),fe.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),fe.pixelStorei(D.UNPACK_ALIGNMENT,U.unpackAlignment);const Ot=fe.getParameter(D.UNPACK_ROW_LENGTH),et=fe.getParameter(D.UNPACK_IMAGE_HEIGHT),kt=fe.getParameter(D.UNPACK_SKIP_PIXELS),Jt=fe.getParameter(D.UNPACK_SKIP_ROWS),Sn=fe.getParameter(D.UNPACK_SKIP_IMAGES);fe.pixelStorei(D.UNPACK_ROW_LENGTH,mt.width),fe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,mt.height),fe.pixelStorei(D.UNPACK_SKIP_PIXELS,Le),fe.pixelStorei(D.UNPACK_SKIP_ROWS,je),fe.pixelStorei(D.UNPACK_SKIP_IMAGES,$e);const Yn=v.isDataArrayTexture||v.isData3DTexture,ut=U.isDataArrayTexture||U.isData3DTexture;if(v.isDepthTexture){const xt=b.get(v),Mn=b.get(U),ht=b.get(xt.__renderTarget),En=b.get(Mn.__renderTarget);fe.bindFramebuffer(D.READ_FRAMEBUFFER,ht.__webglFramebuffer),fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,En.__webglFramebuffer);for(let $n=0;$n<Ne;$n++)Yn&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,b.get(v).__webglTexture,X,$e+$n),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,b.get(U).__webglTexture,ye,_t+$n)),D.blitFramebuffer(Le,je,Re,be,Ie,at,Re,be,D.DEPTH_BUFFER_BIT,D.NEAREST);fe.bindFramebuffer(D.READ_FRAMEBUFFER,null),fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(X!==0||v.isRenderTargetTexture||b.has(v)){const xt=b.get(v),Mn=b.get(U);fe.bindFramebuffer(D.READ_FRAMEBUFFER,kl),fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,Hl);for(let ht=0;ht<Ne;ht++)Yn?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,xt.__webglTexture,X,$e+ht):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,xt.__webglTexture,X),ut?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Mn.__webglTexture,ye,_t+ht):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Mn.__webglTexture,ye),X!==0?D.blitFramebuffer(Le,je,Re,be,Ie,at,Re,be,D.COLOR_BUFFER_BIT,D.NEAREST):ut?D.copyTexSubImage3D(we,ye,Ie,at,_t+ht,Le,je,Re,be):D.copyTexSubImage2D(we,ye,Ie,at,Le,je,Re,be);fe.bindFramebuffer(D.READ_FRAMEBUFFER,null),fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else ut?v.isDataTexture||v.isData3DTexture?D.texSubImage3D(we,ye,Ie,at,_t,Re,be,Ne,ct,wt,mt.data):U.isCompressedArrayTexture?D.compressedTexSubImage3D(we,ye,Ie,at,_t,Re,be,Ne,ct,mt.data):D.texSubImage3D(we,ye,Ie,at,_t,Re,be,Ne,ct,wt,mt):v.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,ye,Ie,at,Re,be,ct,wt,mt.data):v.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,ye,Ie,at,mt.width,mt.height,ct,mt.data):D.texSubImage2D(D.TEXTURE_2D,ye,Ie,at,Re,be,ct,wt,mt);fe.pixelStorei(D.UNPACK_ROW_LENGTH,Ot),fe.pixelStorei(D.UNPACK_IMAGE_HEIGHT,et),fe.pixelStorei(D.UNPACK_SKIP_PIXELS,kt),fe.pixelStorei(D.UNPACK_SKIP_ROWS,Jt),fe.pixelStorei(D.UNPACK_SKIP_IMAGES,Sn),ye===0&&U.generateMipmaps&&D.generateMipmap(we),fe.unbindTexture()},this.initRenderTarget=function(v){b.get(v).__webglFramebuffer===void 0&&g.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?g.setTextureCube(v,0):v.isData3DTexture?g.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?g.setTexture2DArray(v,0):g.setTexture2D(v,0),fe.unbindTexture()},this.resetState=function(){G=0,Y=0,N=null,fe.reset(),oe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return sn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Ze._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ze._getUnpackColorSpace()}}const xm="https://claw-backend-2026.onrender.com";function vm({avatarImageUrl:i,avatarName:e,voice:t,profileId:n,width:s=360,height:r=480,autoRotate:a=!0}){const o=re.useRef(null),c=re.useRef(null),l=re.useRef(null),f=re.useRef(null),p=re.useRef(null),u=re.useRef(0),m=re.useRef(0),_=re.useRef(0),E=re.useRef(!1),h=re.useRef(0),d=re.useRef(0),M=re.useRef(.003),[y,T]=re.useState(!1),[L,A]=re.useState(!1),P=re.useRef(null);re.useEffect(()=>{if(!o.current)return;const I=o.current,G=new Xc;c.current=G;const Y=new Xt(40,s/r,.1,100);Y.position.set(0,.2,5),Y.lookAt(0,0,0),l.current=Y;const N=new _m({antialias:!0,alpha:!0,powerPreference:"high-performance"});N.setSize(s,r),N.setPixelRatio(Math.min(window.devicePixelRatio,2)),N.setClearColor(0,0),N.shadowMap.enabled=!0,N.shadowMap.type=el,I.appendChild(N.domElement),f.current=N;const B=new xu(4210784,1.2);G.add(B);const k=new mr(16777215,2.5);k.position.set(2,3,4),k.castShadow=!0,k.shadow.mapSize.set(512,512),G.add(k);const ee=new mr(8939263,1.2);ee.position.set(-3,0,2),G.add(ee);const ne=new mr(16737928,.8);ne.position.set(0,-2,0),G.add(ne);const se=new Ft,me=200,Se=new Float32Array(me*3),ze=new Float32Array(me*3);for(let Ce=0;Ce<me;Ce++){Se[Ce*3]=(Math.random()-.5)*8,Se[Ce*3+1]=(Math.random()-.5)*8,Se[Ce*3+2]=(Math.random()-.5)*4;const Ke=Math.random();ze[Ce*3]=.5+Ke*.5,ze[Ce*3+1]=.3+Ke*.3,ze[Ce*3+2]=.8+Ke*.2}se.setAttribute("position",new qt(Se,3)),se.setAttribute("color",new qt(ze,3));const Ve=new bl({size:.03,vertexColors:!0,blending:br,depthWrite:!1,transparent:!0,opacity:.7}),De=new iu(se,Ve);G.add(De);const q=new Ls(1.4,.02,16,64),he=new Cs({color:8939263,transparent:!0,opacity:.4}),H=new Tt(q,he);H.rotation.x=-Math.PI/2,H.position.y=-2.2,H.receiveShadow=!0,G.add(H);const ce=new Ls(1.7,.01,16,64),ve=new Cs({color:16737928,transparent:!0,opacity:.25}),F=new Tt(ce,ve);F.rotation.x=-Math.PI/2.2,F.position.y=-2.15,G.add(F);const _e=new Pi,ge=new bo;(Ce=>{for(;_e.children.length>0;)_e.remove(_e.children[0]);const Ke=new Pn(1.6,2.2),qe=new li({color:1710638,emissive:1118498,emissiveIntensity:.3,specular:4473958,shininess:30}),dt=new Tt(Ke,qe);dt.position.z=-.02,dt.castShadow=!0,dt.receiveShadow=!0,_e.add(dt);const D=new ru(Ke),ot=new El({color:8939263,transparent:!0,opacity:.5}),Ue=new nu(D,ot);Ue.position.z=-.01,_e.add(Ue);const nt=new Pn(1.4,1.8);ge.load(Ce,fe=>{const st=new li({map:fe,specular:2236962,shininess:5}),b=new Tt(nt,st);b.castShadow=!0,_e.add(b),p.current=b,_e.position.set(0,0,0)},void 0,()=>{const fe=new li({color:2759230,emissive:1114146,emissiveIntensity:.4,specular:4473958}),st=new Tt(nt,fe);_e.add(st),p.current=st})})(i),G.add(_e),_e.userData={isCard:!0},G.userData={cardGroup:_e,ring:H,ring2:F,particles:De};const Oe=()=>{u.current=requestAnimationFrame(Oe);const Ce=Date.now()*.001;E.current||(a&&(_.current+=M.current),d.current*=.95,_.current+=d.current),m.current+=(_.current-m.current)*.1,_e.rotation.y=m.current,_e.position.y=Math.sin(Ce*1.2)*.1,De.rotation.y+=5e-4,De.rotation.x+=2e-4;const Ke=1+Math.sin(Ce*2)*.05;H.scale.setScalar(Ke),H.material.opacity=.3+Math.sin(Ce*2)*.1,F.scale.setScalar(1+Math.cos(Ce*2.5)*.03),N.render(G,Y)};return Oe(),()=>{cancelAnimationFrame(u.current),N.dispose(),I.contains(N.domElement)&&I.removeChild(N.domElement)}},[s,r,a]),re.useEffect(()=>{var ne;if(!c.current||!i)return;const G=(ne=c.current.userData)==null?void 0:ne.cardGroup;if(!G)return;for(;G.children.length>0;){const se=G.children[0];if(se.material){const me=se.material;Array.isArray(me)?me.forEach(Se=>{Se.map&&Se.map.dispose(),Se.dispose()}):(me.map&&me.map.dispose(),me.dispose())}se.geometry&&se.geometry.dispose(),G.remove(se)}const Y=new bo,N=new Pn(1.6,2.2),B=new li({color:1710638,emissive:1118498,emissiveIntensity:.3,specular:4473958,shininess:30}),k=new Tt(N,B);k.position.z=-.02,G.add(k);const ee=new Pn(1.4,1.8);Y.load(i,se=>{const me=new li({map:se,specular:2236962,shininess:5}),Se=new Tt(ee,me);G.add(Se),p.current=Se},void 0,()=>{const se=new li({color:2759230,emissive:1114146,emissiveIntensity:.4});G.add(new Tt(ee,se))})},[i]),re.useEffect(()=>{const I=o.current;if(!I)return;const G=B=>{E.current=!0,h.current=B.clientX,d.current=0,I.setPointerCapture(B.pointerId)},Y=B=>{if(!E.current)return;const k=B.clientX-h.current;_.current+=k*.01,d.current=k*.002,h.current=B.clientX},N=()=>{E.current=!1};return I.addEventListener("pointerdown",G),I.addEventListener("pointermove",Y),I.addEventListener("pointerup",N),I.addEventListener("pointerleave",N),()=>{I.removeEventListener("pointerdown",G),I.removeEventListener("pointermove",Y),I.removeEventListener("pointerup",N),I.removeEventListener("pointerleave",N)}},[]);const S=re.useCallback(async()=>{var I;if(!(y||L)){A(!0);try{const G=`大家好，我是${e}，欢迎来到直播间，今天给大家带来超值好物，家人们点点关注不迷路！`,N=await(await fetch(`${xm}/api/live-stream/preview-voice`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:G,voice:t||"zh-CN-XiaoxiaoNeural",profileId:n})})).json();if(N.success&&((I=N.data)!=null&&I.audioUrl)){P.current&&(P.current.pause(),P.current=null);const B=new Audio(N.data.audioUrl);P.current=B,T(!0),B.onended=()=>T(!1),B.onerror=()=>{T(!1),A(!1)},await B.play(),A(!1)}else w(G),A(!1)}catch{w(`大家好，我是${e}，欢迎来到直播间！`),A(!1)}}},[e,t,n,y,L]),w=I=>{if("speechSynthesis"in window){const G=new SpeechSynthesisUtterance(I);G.lang="zh-CN",G.rate=1,G.pitch=1,T(!0),G.onend=()=>T(!1),G.onerror=()=>T(!1),speechSynthesis.speak(G)}},[O,R]=re.useState(!0);return re.useEffect(()=>{const I=setTimeout(()=>R(!1),4e3);return()=>clearTimeout(I)},[]),x.jsxs("div",{style:{position:"relative",display:"inline-block"},children:[x.jsx("div",{ref:o,style:{width:s,height:r,borderRadius:16,overflow:"hidden",cursor:"grab",background:"radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a18 70%)",position:"relative"}}),O&&x.jsx("div",{style:{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.6)",color:"#aa99ff",fontSize:12,padding:"4px 14px",borderRadius:20,pointerEvents:"none",backdropFilter:"blur(10px)",whiteSpace:"nowrap"},children:"🖱️ 拖拽旋转 · 360° 预览"}),x.jsxs("div",{style:{position:"absolute",bottom:8,left:8,right:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},children:[x.jsx("div",{style:{background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",color:"#fff",fontSize:13,fontWeight:600,padding:"4px 12px",borderRadius:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1},children:e}),x.jsx("button",{onClick:S,disabled:L,style:{width:32,height:32,borderRadius:"50%",border:"none",background:y?"linear-gradient(135deg, #ff6688, #8866ff)":"linear-gradient(135deg, #8866ff, #6644cc)",color:"#fff",fontSize:16,cursor:L?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s",boxShadow:y?"0 0 12px rgba(136,102,255,0.5)":"none",flexShrink:0},title:"试听语音",children:L?"⏳":y?"🔊":"🔈"})]})]})}const Gt="https://claw-backend-2026.onrender.com";function Em(){var Te,de,ie,Pe,Ge,ft;const[i,e]=re.useState(null),[t,n]=re.useState([]),[s,r]=re.useState([]),[a,o]=re.useState("xiaorui"),[c,l]=re.useState("custom"),[f,p]=re.useState(""),[u,m]=re.useState(""),[_,E]=re.useState(!0),[h,d]=re.useState(!1),[M,y]=re.useState(""),[T,L]=re.useState([]),[A,P]=re.useState(""),[S,w]=re.useState([]),[O,R]=re.useState(""),[I,G]=re.useState(!1),[Y,N]=re.useState(""),[B,k]=re.useState(""),[ee,ne]=re.useState(!1),[se,me]=re.useState(""),[Se,ze]=re.useState([]),[Ve,De]=re.useState(!1),[q,he]=re.useState(!1),[H,ce]=re.useState(""),[ve,F]=re.useState(""),[_e,ge]=re.useState(""),[xe,Oe]=re.useState(""),[Ce,Ke]=re.useState(""),[qe,dt]=re.useState("hongkong"),[D,ot]=re.useState("standard"),[Ue,nt]=re.useState(Er),[fe,st]=re.useState(!1),[b,g]=re.useState(""),z=re.useRef(null),Z=re.useRef(null),te=re.useCallback(async()=>{try{const We=await(await fetch(`${Gt}/api/live-stream/status`)).json();We.success&&e(We.data)}catch{}},[]);re.useEffect(()=>(ae(),pe(),te(),z.current=setInterval(te,5e3),()=>{z.current&&clearInterval(z.current),Z.current&&Z.current.close()}),[]);const ae=async()=>{try{const We=await(await fetch(`${Gt}/api/live-stream/platforms`)).json();We.success&&n(We.data.platforms)}catch{}},pe=async()=>{var Q;try{const lt=await(await fetch(`${Gt}/api/live-stream/profiles`)).json();if(lt.success){r(lt.data.profiles),a||o(lt.data.default||"xiaorui");const yt=(Q=lt.data.profiles)==null?void 0:Q.find(Os=>Os.id===(lt.data.default||"xiaorui"));yt!=null&&yt.imagePath&&g(`${Gt}/api/live-stream/avatar-photos/${yt.imagePath.split("/").pop()}`)}}catch{}};re.useEffect(()=>{const Q=Xl[c]||"portrait";nt(We=>We.orientation===Q?We:Q==="landscape"?{...Qo,overlays:We.overlays}:{...Er,overlays:We.overlays})},[c]),re.useEffect(()=>{const Q=s.find(We=>We.id===a);Q!=null&&Q.imagePath&&g(`${Gt}/api/live-stream/avatar-photos/${Q.imagePath.split("/").pop()}`)},[a,s]);const $=async()=>{d(!0),y("");try{const Q=T.length>0?T.map(yt=>({text:yt,duration:30})):[],lt=await(await fetch(`${Gt}/api/live-stream/start`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({platform:c,streamKey:c!=="custom"?f:void 0,rtmpUrl:c==="custom"?u:void 0,profileId:a,autoReply:_,scripts:Q,proxyEnabled:Ve,proxyRegion:qe,useOwnProxy:q,ownProxyUrl:q?`socks5://${xe?`${xe}:${Ce}@`:""}${ve}:${_e}`:void 0,sceneConfig:Ue})})).json();lt.success?e(lt.data.status):y(lt.error||"启动失败")}catch(Q){y(Q.message)}finally{d(!1)}},J=async()=>{d(!0);try{(await(await fetch(`${Gt}/api/live-stream/stop`,{method:"POST"})).json()).success&&e(null)}catch(Q){y(Q.message)}finally{d(!1)}},Ee=async()=>{await fetch(`${Gt}/api/live-stream/pause`,{method:"POST"}),te()},Ae=async()=>{await fetch(`${Gt}/api/live-stream/resume`,{method:"POST"}),te()},ue=async()=>{if(A.trim())try{await fetch(`${Gt}/api/live-stream/script`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:A.trim(),duration:30})}),L(Q=>[...Q,A.trim()]),P("")}catch(Q){y(Q.message)}},le=Q=>{L(We=>We.filter((lt,yt)=>yt!==Q))},Be=async()=>{if(O.trim())try{await fetch(`${Gt}/api/live-stream/announce`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:O.trim(),priority:10})}),R("")}catch(Q){y(Q.message)}},ke=async()=>{if(Y.trim()){ne(!0);try{const We=await(await fetch(`${Gt}/api/live-stream/generate-script`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productName:Y,productDesc:B})})).json();We.success&&(me(We.data.script),ze(We.data.segments),We.data.segments.forEach(lt=>{L(yt=>[...yt,lt.text])}))}catch(Q){y(Q.message)}finally{ne(!1)}}},He=(i==null?void 0:i.status)==="live",C=(i==null?void 0:i.status)==="paused",oe=He?"#00e676":C?"#ff9800":"#f44336",K=He?"● 直播中":C?"⏸ 已暂停":"○ 未开播";return x.jsxs("div",{className:"livestream-page",children:[x.jsxs("div",{className:"ls-header",children:[x.jsx("h1",{children:"🎥 AI数字人直播控制台"}),x.jsx("div",{className:"ls-status-badge",style:{color:oe},children:K})]}),M&&x.jsxs("div",{className:"ls-error",onClick:()=>y(""),children:["⚠️ ",M," (点击关闭)"]}),x.jsxs("div",{className:"ls-main",children:[x.jsxs("div",{className:"ls-left",children:[x.jsxs("div",{className:"ls-card",children:[x.jsx("h3",{children:"👤 主播形象"}),s.length>0&&b&&x.jsx("div",{style:{display:"flex",justifyContent:"center",marginBottom:16,marginTop:8},children:x.jsx(vm,{avatarImageUrl:b,avatarName:((Te=s.find(Q=>Q.id===a))==null?void 0:Te.name)||"AI主播",voice:(de=s.find(Q=>Q.id===a))==null?void 0:de.voice,profileId:a,width:320,height:400,autoRotate:!0})}),x.jsx("div",{className:"ls-profile-grid",children:s.map(Q=>{const We=a===Q.id,lt=Q.gender==="female"?"#ff69b4":"#4da6ff";return x.jsxs("div",{className:`ls-profile-card ${We?"ls-profile-selected":""}`,onClick:()=>o(Q.id),style:We?{borderColor:lt,boxShadow:`0 0 0 2px ${lt}40`}:{},children:[x.jsx("div",{className:"ls-profile-avatar",children:Q.imagePath?x.jsx("img",{src:`${Gt}/api/live-stream/avatar-photos/${Q.imagePath.split("/").pop()}`,alt:Q.name,style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:"8px"}}):Q.avatar}),x.jsxs("div",{className:"ls-profile-info",children:[x.jsx("span",{className:"ls-profile-name",style:{color:We?lt:"#e0e0e0"},children:Q.name}),x.jsx("span",{className:"ls-profile-style",children:Q.description}),x.jsx("div",{className:"ls-profile-tags",children:Q.tags.slice(0,2).map(yt=>x.jsx("span",{className:"ls-profile-tag",children:yt},yt))}),x.jsxs("span",{className:"ls-profile-voice",children:["🎙️ ",Q.voiceLabel]})]})]},Q.id)})}),x.jsx("label",{children:"推流平台"}),x.jsx("select",{value:c,onChange:Q=>{l(Q.target.value),p(""),m("")},disabled:He,children:t.map(Q=>x.jsx("option",{value:Q.id,children:Q.name},Q.id))}),c==="custom"?x.jsxs(x.Fragment,{children:[x.jsx("label",{children:"RTMP推流地址"}),x.jsx("input",{type:"text",value:u,onChange:Q=>m(Q.target.value),disabled:He,placeholder:"rtmp://your-server/live/stream-key"})]}):x.jsxs(x.Fragment,{children:[x.jsx("label",{children:"推流密钥 (Stream Key)"}),x.jsx("input",{type:"text",value:f,onChange:Q=>p(Q.target.value),disabled:He,placeholder:`${c}推流密钥`})]}),x.jsxs("label",{className:"ls-checkbox",children:[x.jsx("input",{type:"checkbox",checked:_,onChange:Q=>E(Q.target.checked)}),"🤖 启用AI自动回复弹幕"]}),x.jsx(Wl,{proxyEnabled:Ve,onProxyEnabledChange:De,useOwnProxy:q,onUseOwnProxyChange:he,ownProxyUrl:H,onOwnProxyUrlChange:ce,ownProxyHost:ve,onOwnProxyHostChange:F,ownProxyPort:_e,onOwnProxyPortChange:ge,ownProxyUser:xe,onOwnProxyUserChange:Oe,ownProxyPass:Ce,onOwnProxyPassChange:Ke,selectedRegion:qe,onRegionChange:dt,selectedPlan:D,onPlanChange:ot,disabled:He}),x.jsxs("div",{className:"ls-scene-section",children:[x.jsxs("div",{className:"ls-scene-header",onClick:()=>st(!fe),children:[x.jsx("h3",{children:"🎬 直播画面预览"}),x.jsx("span",{className:"ls-scene-toggle",children:fe?"收起 ▲":"展开 ▼"})]}),fe&&x.jsx($l,{sceneConfig:Ue,onSceneConfigChange:nt,avatarImageUrl:b,avatarName:(ie=s.find(Q=>Q.id===a))==null?void 0:ie.name,disabled:He,compact:!0})]}),x.jsx("div",{className:"ls-controls",children:He?x.jsxs(x.Fragment,{children:[C?x.jsx("button",{className:"ls-btn ls-btn-resume",onClick:Ae,children:"▶️ 继续"}):x.jsx("button",{className:"ls-btn ls-btn-pause",onClick:Ee,children:"⏸️ 暂停"}),x.jsx("button",{className:"ls-btn ls-btn-stop",onClick:J,disabled:h,children:h?"停止中...":"⏹️ 下播"})]}):x.jsx("button",{className:"ls-btn ls-btn-start",onClick:$,disabled:h,children:h?"准备中...":"🔴 开播"})})]}),x.jsxs("div",{className:"ls-card",children:[x.jsx("h3",{children:"📝 直播脚本管理"}),x.jsxs("div",{className:"ls-script-input",children:[x.jsx("input",{type:"text",value:A,onChange:Q=>P(Q.target.value),onKeyDown:Q=>Q.key==="Enter"&&ue(),placeholder:"输入一段直播话术（30秒左右）"}),x.jsx("button",{className:"ls-btn-sm",onClick:ue,children:"添加"})]}),x.jsx("div",{className:"ls-script-list",children:T.length===0?x.jsx("p",{className:"ls-empty",children:"暂无脚本，添加一些话术或使用AI生成"}):T.map((Q,We)=>x.jsxs("div",{className:"ls-script-item",children:[x.jsx("span",{className:"ls-script-idx",children:We+1}),x.jsxs("span",{className:"ls-script-text",children:[Q.substring(0,60),Q.length>60?"...":""]}),x.jsx("button",{className:"ls-btn-xs",onClick:()=>le(We),children:"✕"})]},We))}),x.jsx("button",{className:"ls-btn ls-btn-ai",onClick:()=>G(!0),children:"🤖 AI生成直播脚本"})]}),x.jsxs("div",{className:"ls-card",children:[x.jsx("h3",{children:"📢 主播公告"}),x.jsxs("div",{className:"ls-script-input",children:[x.jsx("input",{type:"text",value:O,onChange:Q=>R(Q.target.value),onKeyDown:Q=>Q.key==="Enter"&&Be(),placeholder:"发送一条公告给观众..."}),x.jsx("button",{className:"ls-btn-sm",onClick:Be,children:"发送"})]})]})]}),x.jsxs("div",{className:"ls-right",children:[x.jsxs("div",{className:"ls-card",children:[x.jsx("h3",{children:"📊 实时监控"}),i?x.jsxs("div",{className:"ls-stats-grid",children:[x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"状态"}),x.jsx("span",{className:"ls-stat-val",style:{color:oe},children:He?"直播中":C?"已暂停":i.status})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"时长"}),x.jsx("span",{className:"ls-stat-val",children:Sm(i.uptime)})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"帧率"}),x.jsxs("span",{className:"ls-stat-val",children:[i.fps," fps"]})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"分辨率"}),x.jsx("span",{className:"ls-stat-val",children:i.resolution})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"总帧数"}),x.jsx("span",{className:"ls-stat-val",children:i.totalFrames.toLocaleString()})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"错误"}),x.jsx("span",{className:"ls-stat-val",style:{color:i.errors>0?"#f44336":"#00e676"},children:i.errors})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"在线观众"}),x.jsx("span",{className:"ls-stat-val",children:((Pe=i.chat)==null?void 0:Pe.onlineClients)||0})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"弹幕消息"}),x.jsx("span",{className:"ls-stat-val",children:((Ge=i.chat)==null?void 0:Ge.totalMessages)||0})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"点赞"}),x.jsxs("span",{className:"ls-stat-val",children:["❤️ ",((ft=i.chat)==null?void 0:ft.totalLikes)||0]})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"礼物"}),x.jsxs("span",{className:"ls-stat-val",children:["🎁 ",i.totalGifts]})]}),x.jsxs("div",{className:"ls-stat",children:[x.jsx("span",{className:"ls-stat-label",children:"脚本队列"}),x.jsxs("span",{className:"ls-stat-val",children:[i.scriptQueue," 段"]})]}),x.jsxs("div",{className:"ls-stat ls-stat-wide",children:[x.jsx("span",{className:"ls-stat-label",children:"当前播放"}),x.jsx("span",{className:"ls-stat-val",children:i.currentScript||"无"})]})]}):x.jsx("p",{className:"ls-empty",children:"未开播，暂无数据"})]}),He&&x.jsxs("div",{className:"ls-card",children:[x.jsx("h3",{children:"💬 弹幕面板"}),x.jsx("div",{className:"ls-chat-box",children:S.length===0?x.jsx("p",{className:"ls-empty",children:"暂无消息"}):S.map((Q,We)=>x.jsxs("div",{className:"ls-chat-msg",children:[x.jsxs("span",{className:"ls-chat-user",children:[Q.user||"观众",":"]}),x.jsxs("span",{children:[" ",Q.text]})]},We))})]}),x.jsxs("div",{className:"ls-card",children:[x.jsx("h3",{children:"⚡ 快速操作"}),x.jsxs("div",{className:"ls-quick-actions",children:[x.jsx("button",{className:"ls-btn-sm",onClick:()=>L(Q=>[...Q,"欢迎来到云南瑞丽翡翠直播间！家人们右上角点个关注！","今天给大家带来的都是缅甸A货翡翠，每一件都有鉴定证书！","感谢家人们的支持，觉得主播讲得好的点点赞！"]),children:"📋 添加默认话术"}),x.jsx("button",{className:"ls-btn-sm",onClick:ae,children:"🔄 刷新平台列表"})]})]})]})]}),I&&x.jsx("div",{className:"ls-modal-overlay",onClick:()=>G(!1),children:x.jsxs("div",{className:"ls-modal",onClick:Q=>Q.stopPropagation(),children:[x.jsx("h3",{children:"🤖 AI生成直播脚本"}),x.jsx("label",{children:"产品名称"}),x.jsx("input",{type:"text",value:Y,onChange:Q=>N(Q.target.value),placeholder:"如：缅甸A货翡翠手镯"}),x.jsx("label",{children:"产品描述（可选）"}),x.jsx("textarea",{value:B,onChange:Q=>k(Q.target.value),placeholder:"种水、颜色、产地、卖点等...",rows:3}),x.jsx("button",{className:"ls-btn ls-btn-ai",onClick:ke,disabled:ee||!Y.trim(),children:ee?"生成中...":"🎬 生成直播脚本"}),se&&x.jsxs("div",{className:"ls-generated",children:[x.jsx("h4",{children:"📜 生成的完整脚本:"}),x.jsx("pre",{children:se}),x.jsxs("p",{className:"ls-hint",children:["✅ 已自动添加 ",Se.length," 段到脚本队列"]})]}),x.jsx("button",{className:"ls-btn-sm",onClick:()=>G(!1),children:"关闭"})]})})]})}function Sm(i){const e=Math.floor(i/3600),t=Math.floor(i%3600/60),n=Math.floor(i%60);return e>0?`${e}:${String(t).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${t}:${String(n).padStart(2,"0")}`}export{Em as default};
