// Draws the favicon (images/favicon.svg): the header's Bloch-sphere logo with two of its orbits and electrons,
// using the same geometry as site.js and the site's light and dark colours. Run: node scripts/make-favicon.cjs
// Then render favicon-32.png (32x32, transparent) and apple-touch-icon.png (180x180 on #f6f7f9, 22px margin) from it.
const fs = require("fs");
const TILT=0.3,ct=Math.cos(TILT),st=Math.sin(TILT);
const proj=p=>[p[0],-p[1]*ct+p[2]*st,p[2]*ct+p[1]*st];
const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function orbit(n){n=norm(n);const u=norm(cross(n,Math.abs(n[1])<0.9?[0,1,0]:[1,0,0]));return{u,v:cross(n,u)}}
const at=(o,a)=>{const c=Math.cos(a),s=Math.sin(a);return proj([0,1,2].map(i=>o.u[i]*c+o.v[i]*s))};
const X=32,Y=32,R=26, f=n=>+n.toFixed(1);
function path(o,front){let d='',pen=false;for(let i=0;i<=96;i++){const q=at(o,i/96*Math.PI*2);if((q[2]>=0)===front){d+=(pen?'L':'M')+f(X+q[0]*R)+' '+f(Y+q[1]*R);pen=true}else pen=false}return d}
const O=[[orbit([0.445,0.895,0.014]),'t',0],[orbit([-0.55,0.8,0.45]),'n',2.2]];
let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>.n{stroke:#13284a}.t{stroke:#0b7285}.N{fill:#13284a}.T{fill:#0b7285}.s{fill:#e9eef4}@media (prefers-color-scheme:dark){.n{stroke:#c9d6ec}.t{stroke:#5cc3d1}.N{fill:#c9d6ec}.T{fill:#5cc3d1}.s{fill:#16233a}}</style>`;
s+=`<circle class="s" cx="${X}" cy="${Y}" r="${R}"/>`;
O.forEach(([o,c])=>s+=`<path class="${c}" d="${path(o,false)}" fill="none" stroke-width="2" opacity=".35"/>`);
s+=`<circle class="n" cx="${X}" cy="${Y}" r="${R}" fill="none" stroke-width="4"/>`;
O.forEach(([o,c,a])=>{s+=`<path class="${c}" d="${path(o,true)}" fill="none" stroke-width="3.5" stroke-linecap="round"/>`;const q=at(o,a);s+=`<circle class="${c.toUpperCase()}" cx="${f(X+q[0]*R)}" cy="${f(Y+q[1]*R)}" r="5"/>`});
s+='</svg>\n';fs.writeFileSync(__dirname + "/../images/favicon.svg", s);
console.log("Wrote images/favicon.svg");
