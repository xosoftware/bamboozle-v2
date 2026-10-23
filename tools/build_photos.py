#!/usr/bin/env python3
"""Bundle venue item photos into v2: resize to ~1200px JPEG under photos/<slug>/ and write photos.json.
photos.json = {"v":1,"venues":{"<venue id>":{"name":..,"items":{"<normalized item name>":["photos/..jpg"]},
  "extra":{"f":[[section,[[name,null]]]],"d":[...]},"credit":..}}}
Items are matched to the venue's existing menu (menus.json f/d) and deal items (data.json); photos with no matching
item are added as price-less 'extra' sections so every photo is reachable."""
import csv,json,os,re,sys,unicodedata
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def norm(s):
    s=unicodedata.normalize('NFD',str(s).lower());s=''.join(c for c in s if not unicodedata.combining(c))
    s=s.replace('&',' and ').replace("'",'').replace('\u2019','');return re.sub(r'[^a-z0-9]+',' ',s).strip()
def build(venue_name,src_dir,slug):
    data=json.load(open(os.path.join(ROOT,'data.json')));menus=json.load(open(os.path.join(ROOT,'menus.json')))['m']
    vid=next(i for i,v in enumerate(data) if v['name']==venue_name)
    M=menus.get(str(vid),{});names=[it[0] for k in 'fd' for s in M.get(k,[]) for it in s[1]]+[i['name'] for i in data[vid]['items'] if i.get('q')!='meta']
    rows=list(csv.DictReader(open(os.path.join(src_dir,'photos.csv'))))
    out=os.path.join(ROOT,'photos',slug);os.makedirs(out,exist_ok=True)
    files={}
    for r in rows:
        dst=os.path.splitext(r['image_file'])[0]+'.jpg';im=Image.open(os.path.join(src_dir,r['image_file']));im.thumbnail((1200,1200))
        if im.mode!='RGB':bg=Image.new('RGB',im.size,(13,13,15));bg.paste(im,mask=im.convert('RGBA').split()[3]);im=bg
        im.save(os.path.join(out,dst),'JPEG',quality=80,optimize=True,progressive=True);files[r['image_file']]='photos/%s/%s'%(slug,dst)
    items={};used=set()
    def match(n):
        a=norm(n);at=set(a.split())
        for r in rows:
            if norm(r['item_name'])==a:return r
        best=None
        for r in rows:
            bt=set(norm(r['item_name']).split());small,big=(bt,at) if len(bt)<=len(at) else (at,bt)
            if small and small<=big and len(small)>=1 and (best is None or len(bt&at)>len(set(norm(best['item_name']).split())&at)):best=r
        return best
    for n in names:
        r=match(n)
        if r:items.setdefault(norm(n),[]);f=files[r['image_file']];items[norm(n)].count(f) or items[norm(n)].append(f);used.add(r['image_file'])
    extra={'f':[],'d':[]};secs={}
    for r in rows:
        if r['image_file'] in used:continue
        top,_,sec=r['menu_section'].partition(' / ');k='d' if top.lower().startswith('cocktail') else 'f'
        key=(k,'%s · %s'%(top,sec) if sec and sec!=top else top)
        if key not in secs:secs[key]=[];extra[k].append([key[1],secs[key]])
        secs[key].append([r['item_name'],None]);items.setdefault(norm(r['item_name']),[]).append(files[r['image_file']])
    pj=os.path.join(ROOT,'photos.json');P=json.load(open(pj)) if os.path.exists(pj) else {'v':1,'venues':{}}
    P['venues'][str(vid)]={'name':venue_name,'items':items,'extra':extra,'credit':'Photos: Ocean Prime official site (ocean-prime.com)'}
    json.dump(P,open(pj,'w'),ensure_ascii=False,separators=(',',':'))
    print('venue',vid,'photos',len(files),'matched to existing items',len(used),'extra',len(rows)-len(used),'item keys',len(items))
if __name__=='__main__':
    src=sys.argv[1] if len(sys.argv)>1 else '/workspace/photos/ocean-prime'
    build('Ocean Prime',src,'ocean-prime')
