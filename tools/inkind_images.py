#!/usr/bin/env python3
"""Attach inKind hero image URLs (Cloudinary CDN) to data.json venues as `ikimg`.
Reads each venue's ik.url page, takes the hero background image."""
import json,re,urllib.request,concurrent.futures as cf
D='data.json';s=json.load(open(D))
urls=sorted({v['ik']['url'] for v in s if v.get('ik') and v['ik'].get('url')})
RX=re.compile(r'https://res-\d\.cloudinary\.com/equityeats/image/upload/([^)"\'\s]*?/)?(v\d+/[A-Za-z0-9_]+\.(?:jpg|jpeg|png|webp))')
def get(u):
  try:
    h=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read().decode('utf8','ignore')
    m=[x for x in RX.finditer(h) if x.group(1) and 'o_55' in x.group(1)] or [x for x in RX.finditer(h) if not x.group(0).endswith('.png')]
    return u,('https://res.cloudinary.com/equityeats/image/upload/c_fill,w_1200,h_600,q_auto,f_auto/'+m[0].group(2)) if m else None
  except Exception as e: return u,None
with cf.ThreadPoolExecutor(8) as ex: R=dict(ex.map(get,urls))
n=0
for v in s:
  u=v.get('ik') and v['ik'].get('url'); img=R.get(u) if u else None
  if img: v['ikimg']=img; n+=1
  else: v.pop('ikimg',None)
json.dump(s,open(D,'w'),ensure_ascii=False,separators=(',',':'))
print(len(urls),'pages',sum(1 for x in R.values() if x),'with image;',n,'venues tagged')
