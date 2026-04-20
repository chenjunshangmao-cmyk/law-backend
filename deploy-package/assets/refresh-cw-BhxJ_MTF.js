import{r as s}from"./app.js";/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),c=(...e)=>e.filter((t,r,o)=>!!t&&o.indexOf(t)===r).join(" ");/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var f={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=s.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:o,className:n="",children:a,iconNode:i,...l},d)=>s.createElement("svg",{ref:d,...f,width:t,height:t,stroke:e,strokeWidth:o?Number(r)*24/Number(t):r,className:c("lucide",n),...l},[...i.map(([u,h])=>s.createElement(u,h)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=(e,t)=>{const r=s.forwardRef(({className:o,...n},a)=>s.createElement(m,{ref:a,iconNode:t,className:c(`lucide-${p(e)}`,o),...n}));return r.displayName=`${e}`,r};/**
 * @license lucide-react v0.441.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=w("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);export{v as R,w as c};
