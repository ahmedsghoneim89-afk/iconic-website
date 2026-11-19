import numpy as np, cv2, json, sys
from skimage import measure

import os
HERE=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(HERE,'logo-source.jpg')
S=4
g=cv2.imread(SRC,cv2.IMREAD_GRAYSCALE).astype(np.float32)
H,W=g.shape
up=cv2.resize(g,(W*S,H*S),interpolation=cv2.INTER_CUBIC)
up=cv2.GaussianBlur(up,(0,0),1.0)
up=np.pad(up,2,constant_values=248)
cs=measure.find_contours(up,150.0)
polys=[]
for c in cs:
    if np.allclose(c[0],c[-1]): c=c[:-1]
    else: continue
    p=np.stack([c[:,1]-2,c[:,0]-2],1)/S   # x,y in source px
    if len(p)<12: continue
    polys.append(p)
print('contours',len(polys))

def area(p):
    x,y=p[:,0],p[:,1]; return 0.5*np.sum(x*np.roll(y,-1)-np.roll(x,-1)*y)

# ---------- Schneider curve fitting ----------
def B(u):
    m=1-u
    return m**3, 3*u*m**2, 3*u**2*m, u**3
def q(b,u):
    b0,b1,b2,b3=B(u)
    return b0[:,None]*b[0]+b1[:,None]*b[1]+b2[:,None]*b[2]+b3[:,None]*b[3]
def q1(b,u):
    m=1-u
    d=[3*(b[1]-b[0]),3*(b[2]-b[1]),3*(b[3]-b[2])]
    return (m*m)[:,None]*d[0]+(2*m*u)[:,None]*d[1]+(u*u)[:,None]*d[2]
def q2(b,u):
    m=1-u
    d=[6*(b[2]-2*b[1]+b[0]),6*(b[3]-2*b[2]+b[1])]
    return m[:,None]*d[0]+u[:,None]*d[1]
def unit(v):
    n=np.linalg.norm(v); return v/n if n>1e-12 else v
def chord(pts):
    d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))]
    return d/d[-1]
def gen(pts,u,t1,t2):
    p0,p3=pts[0],pts[-1]
    b0,b1,b2,b3=B(u)
    a1=t1[None,:]*b1[:,None]; a2=t2[None,:]*b2[:,None]
    C00=np.sum(a1*a1);C01=np.sum(a1*a2);C11=np.sum(a2*a2)
    tmp=pts-(p0[None,:]*(b0+b1)[:,None]+p3[None,:]*(b2+b3)[:,None])
    X0=np.sum(a1*tmp);X1=np.sum(a2*tmp)
    det=C00*C11-C01*C01
    seg=np.linalg.norm(p3-p0)
    if abs(det)>1e-12:
        al=(X0*C11-X1*C01)/det; ar=(C00*X1-C01*X0)/det
    else: al=ar=0
    if al<1e-6*seg or ar<1e-6*seg:
        al=ar=seg/3
    return [p0,p0+t1*al,p3+t2*ar,p3]
def maxerr(pts,b,u):
    d=np.sum((q(b,u)-pts)**2,axis=1)
    i=int(np.argmax(d)); return d[i],i
def reparam(b,pts,u):
    d=q(b,u)-pts; d1=q1(b,u); d2=q2(b,u)
    num=np.sum(d*d1,axis=1); den=np.sum(d1*d1,axis=1)+np.sum(d*d2,axis=1)
    with np.errstate(all='ignore'):
        un=u-np.where(np.abs(den)>1e-12,num/den,0)
    return np.clip(un,0,1)
def fit(pts,t1,t2,err2):
    n=len(pts)
    if n==2:
        d=np.linalg.norm(pts[1]-pts[0])/3
        return [[pts[0],pts[0]+t1*d,pts[1]+t2*d,pts[1]]]
    u=chord(pts)
    b=gen(pts,u,t1,t2); e,i=maxerr(pts,b,u)
    if e<err2: return [b]
    if e<err2*16:
        for _ in range(12):
            u=reparam(b,pts,u); b=gen(pts,u,t1,t2); e,i=maxerr(pts,b,u)
            if e<err2: return [b]
    i=min(max(i,1),n-2)
    tc=unit(pts[i-1]-pts[i+1])
    return fit(pts[:i+1],t1,tc,err2)+fit(pts[i:],-tc,t2,err2)

def corners(p,k=6,thr=38):
    n=len(p)
    a=np.roll(p,k,axis=0); c=np.roll(p,-k,axis=0)
    v1=p-a; v2=c-p
    ang=np.degrees(np.arctan2(v1[:,0]*v2[:,1]-v1[:,1]*v2[:,0], np.sum(v1*v2,axis=1)))
    ab=np.abs(ang); idx=[]
    for i in range(n):
        if ab[i]>=thr:
            w=[ab[(i+j)%n] for j in range(-k,k+1)]
            if ab[i]>=max(w) and (ab[i]>max(w[:k]) or True):
                # take first of plateau
                if ab[i]>ab[(i-1)%n] or ab[i]>=ab[(i-1)%n] and not (ab[(i-1)%n]>=thr and ab[(i-1)%n]>=max(w)): idx.append(i)
    # merge neighbours closer than k
    out=[]
    for i in idx:
        if not out or (i-out[-1])>k: out.append(i)
    if len(out)>1 and (out[0]+n-out[-1])<=k: out.pop()
    return out

def tang(pts,at_start,m=4):
    m=min(m,len(pts)-1)
    return unit(pts[m]-pts[0]) if at_start else unit(pts[-1-m]-pts[-1])

def straight(seg,tol=0.16):
    a,b=seg[0],seg[-1]; d=b-a; L=np.linalg.norm(d)
    if L<1e-9: return False
    n=np.array([-d[1],d[0]])/L
    return np.max(np.abs((seg-a)@n))<tol

def contour_to_beziers(p,err=0.2):
    n=len(p); cs=corners(p)
    segs=[]
    if not cs:
        # closed smooth: split at two opposite points
        i0=0; i1=n//2
        t0=unit(p[1]-p[-1]); t1=unit(p[i1+1]-p[i1-1])
        A=np.vstack([p[i0:i1+1]]); Bp=np.vstack([p[i1:],p[:1]])
        segs+=fit(A,t0,-t1,err**2)
        segs+=fit(Bp,t1,-t0,err**2)
        return segs
    cs=sorted(cs)
    for j,i in enumerate(cs):
        e=cs[(j+1)%len(cs)]
        seg=p[i:e+1] if e>i else np.vstack([p[i:],p[:e+1]])
        if len(seg)<2: continue
        if straight(seg): segs.append(('L',seg[0],seg[-1]))
        else: segs+=fit(seg,tang(seg,True),tang(seg,False),err**2)
    return segs

def fmt(v): 
    s=('%.1f'%v)
    if s.endswith('.0'): s=s[:-2]
    if s=='-0': s='0'
    return s
def seg_to_d(segs):
    first=segs[0][1] if isinstance(segs[0],tuple) else segs[0][0]
    d='M'+fmt(first[0])+' '+fmt(first[1])
    for b in segs:
        if isinstance(b,tuple): d+='L'+fmt(b[2][0])+' '+fmt(b[2][1])
        else: d+='C'+' '.join(fmt(v) for pt in b[1:] for v in pt)
    return d+'Z'


items=[]
for p in polys:
    x0,y0=p.min(0);x1,y1=p.max(0)
    items.append(dict(p=p,b=[float(x0),float(y0),float(x1),float(y1)],a=abs(area(p))))
items=[it for it in items if it['a']>1.5]
for it in items:
    it['d']=seg_to_d(contour_to_beziers(it['p']))
    it['cy']=(it['b'][1]+it['b'][3])/2; it['cx']=(it['b'][0]+it['b'][2])/2

def inside(inner,outer):
    c=outer['p'].astype(np.float32).reshape(-1,1,2)
    pt=tuple(float(v) for v in inner['p'][0])
    return cv2.pointPolygonTest(c,pt,False)>0

mark=[i for i in items if i['cy']<590]
word=[i for i in items if 590<=i['cy']<795]
sub =[i for i in items if i['cy']>=795]

# letters of the wordmark: an outer contour plus any contour it contains
outers=[i for i in word if not any(o is not i and o['a']>i['a'] and inside(i,o) for o in word)]
outers.sort(key=lambda i:i['b'][0])
letters=[]
for o in outers:
    holes=[h for h in word if h is not o and h['a']<o['a'] and inside(h,o)]
    parts=[o]+holes
    b=[min(p['b'][0] for p in parts),min(p['b'][1] for p in parts),max(p['b'][2] for p in parts),max(p['b'][3] for p in parts)]
    letters.append(dict(d=' '.join(p['d'] for p in parts),b=b))
assert len(letters)==6,len(letters)

mark.sort(key=lambda i:(-i['a']>-1e9, i['b'][0]))
outer=max(mark,key=lambda i:i['a'])
slits=sorted([i for i in mark if i is not outer],key=lambda i:i['b'][0])
mb=outer['b']
sb=[min(i['b'][0] for i in sub),min(i['b'][1] for i in sub),max(i['b'][2] for i in sub),max(i['b'][3] for i in sub)]
allb=[min(mb[0],letters[0]['b'][0]),mb[1],max(mb[2],letters[-1]['b'][2]),sb[3]]

def r1(v): return round(v,1)
# ---- 3D tower data (front-view polygons in logo pixels) ----
outer_poly=outer['p']
cs_=sorted(corners(outer_poly,k=8,thr=30))
cpts=[outer_poly[i] for i in cs_]
def nearest(pt):
    return int(np.argmin(np.linalg.norm(outer_poly-np.array(pt),axis=1)))
xs=np.linspace(outer_poly[:,0].min(),outer_poly[:,0].max(),20)
arc=[]
for x in xs:
    m=np.abs(outer_poly[:,0]-x)<1.6
    arc.append([r1(float(x)),r1(float(outer_poly[m][:,1].max()))])
holes=[]
for sl in slits:
    ap=cv2.approxPolyDP(sl['p'].astype(np.float32).reshape(-1,1,2),0.9,True).reshape(-1,2)
    holes.append([[r1(float(x)),r1(float(y))] for x,y in ap])
BASE=550
sil=[[438.5,BASE],[441.1,327.8],[472.3,308.2],[473.2,222.3],[549.2,185.1],[550.0,262.7],[579.7,246.0],[580.2,416.4],[664.6,476.5],[666.2,BASE]]
tiers=[
  [[473.2,222.3],[549.2,185.1],[549.2,330.0],[473.2,330.0]],
  [[441.1,327.8],[579.7,246.0],[579.7,BASE],[441.1,BASE]],
  [[580.2,416.4],[664.6,476.5],[664.6,BASE],[580.2,BASE]]]
tower=dict(cx=541,base=BASE,sil=sil,holes=holes,tiers=tiers,arc=arc)

js='/* AUTO-GENERATED by tools/trace_logo.py from tools/logo-source.jpg. Do not edit by hand.\n   Vector tracing of the supplied ICONIC logo: emblem (outer shape + fin slits), the six wordmark letters and the REAL ESTATE line. */\n'
js+='const LOGO = '+__import__('json').dumps(dict(
    box=[r1(allb[0]-6),r1(allb[1]-6),r1(allb[2]-allb[0]+12),r1(allb[3]-allb[1]+12)],
    mark=dict(box=[r1(mb[0]-5),r1(mb[1]-5),r1(mb[2]-mb[0]+10),r1(mb[3]-mb[1]+10)],c=[outer['d']]+[s_['d'] for s_ in slits]),
    word=[dict(d=l['d'],b=[r1(v) for v in l['b']]) for l in letters],
    sub=dict(d=' '.join(i['d'] for i in sorted(sub,key=lambda i:i['b'][0])),b=[r1(v) for v in sb]),
    tower=tower
),separators=(',',':'))+';\n'
out=os.path.join(HERE,'..','src','js','05-logo.js')
open(out,'w').write(js)
print('wrote',out,len(js),'bytes; slits',len(slits),'letters',len(letters),'box',allb)
