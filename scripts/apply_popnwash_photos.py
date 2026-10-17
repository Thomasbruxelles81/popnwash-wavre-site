#!/usr/bin/env python3
"""Intègre les photos triées dans le site statique POP'n WASH. Idempotent."""
from pathlib import Path
import json, re, html, sys
ROOT=Path(__file__).resolve().parent.parent
INDEX=ROOT/'index.html'
manifest=json.loads((ROOT/'photos_manifest.json').read_text(encoding='utf-8'))
photos={x['original_position']:x for x in manifest['images']}
def src(n):return photos[n]['image']
def img(n,klass='',lazy=True,active=False,priority=False):
 d=photos[n]
 attrs=f'class="{klass}{" active" if active else ""}" ' if klass else ''
 attrs+=f'src="{src(n)}" width="{d["width"]}" height="{d["height"]}" alt="{html.escape(d["alt"],quote=True)}"'
 attrs+=' loading="lazy"' if lazy else ' fetchpriority="high"'
 attrs+=' decoding="async"'
 return '<img '+attrs+'>'
if not INDEX.exists():sys.exit('index.html introuvable : exécuter depuis la racine du dépôt')
s=INDEX.read_text(encoding='utf-8')
# Remplacement ciblé des anciennes photos. L'identité, les machines et le reste du site sont intacts.
legacy={'img_2221.webp':29,'img_2239.webp':6,'img_2254.webp':20,'img_2203.webp':18,'img_2098.webp':14,'img_2257.webp':5,'img_1943.webp':1}
for old,n in legacy.items():s=s.replace('assets/'+old,src(n))
# Carrousel accueil : vue générale, machine, séchoirs, puis façade.
hero_pat=r'(<div class="hero-photo-stack"[^>]*>)(.*?)(<div class="photo-shade"></div>)'
slides=[29,3,19,1]
heros='\n          '+'\n          '.join(img(n,'hero-photo',lazy=(i>0),active=(i==0)) for i,n in enumerate(slides))+'\n          '
match=re.search(hero_pat,s,re.S)
if not match:sys.exit('Bloc hero-photo-stack introuvable, aucune modification écrite')
body=match.group(2)
body=re.sub(r'<img\s+class="hero-photo[^>]*>', '', body)
s=s[:match.start()]+match.group(1)+heros+body+match.group(3)+s[match.end():]
# Mise à jour des dimensions intrinsèques des images changées.
path_to_meta={x['image']:x for x in manifest['images']}
def dimensions(m):
 tag=m.group(0)
 p=re.search(r'src="([^"]+)"',tag)
 if not p or p.group(1) not in path_to_meta:return tag
 x=path_to_meta[p.group(1)]
 tag=re.sub(r'width="\d+"',f'width="{x["width"]}"',tag)
 tag=re.sub(r'height="\d+"',f'height="{x["height"]}"',tag)
 # complete missing dimensions
 if 'width=' not in tag:tag=tag[:-1]+f' width="{x["width"]}">'
 if 'height=' not in tag:tag=tag[:-1]+f' height="{x["height"]}">'
 return tag
s=re.sub(r'<img\b[^>]*>',dimensions,s)
# Amélioration de la description des principaux visuels SEO.
alt_map={
 29:'Vue générale intérieure de POP’n WASH, laverie automatique de Wavre avec lave-linge professionnels',
 1:'Façade de POP’n WASH Wavre, laverie automatique ouverte 7 jours sur 7',
 6:'Machines dédiées au linge d’animaux à POP’n WASH Wavre',
 20:'Espace coworking avec sièges et prises dans la laverie POP’n WASH',
 18:'Consignes Vinted Go dans la laverie POP’n WASH Wavre',
 14:'Consignes bpost bbox dans la laverie POP’n WASH Wavre',
 5:'Calandre de repassage professionnel grande largeur à POP’n WASH Wavre',
}
def improve_alt(m):
 tag=m.group(0)
 for i,a in alt_map.items():
  if f'src="{src(i)}"' in tag and 'hero-photo' not in tag:
   tag=re.sub(r'alt="[^"]*"',f'alt="{html.escape(a,quote=True)}"',tag)
   break
 return tag
s=re.sub(r'<img\b[^>]*>',improve_alt,s)
# Galerie ordonnée, 9 visuels immédiatement visibles et le reste discrètement replié.
if 'id="pn-photo-gallery"' not in s:
 featured=[29,3,19,20,14,18,1,5,6]
 extra=[7,24,23,27,28,25,22,17,26,4,2,15,16,21]
 def figure(n):
  return f'<figure class="pn-gallery-item">{img(n,lazy=True)}<figcaption>{html.escape(photos[n]["category"])}</figcaption></figure>'
 gallery="""\n    <section class="section section-shell pn-gallery-section" id="pn-photo-gallery" aria-label="Photos POP’n WASH Wavre">
      <div class="pn-gallery-heading"><span class="section-kicker">POP’n WASH · WAVRE</span><h2 id="pnGalleryTitle">La laverie en images</h2></div>
      <div class="pn-gallery-grid">"""+''.join(figure(i) for i in featured)+"""</div>
      <details class="pn-gallery-more"><summary id="pnGalleryMore">Découvrir toutes les photos</summary><div class="pn-gallery-grid">"""+''.join(figure(i) for i in extra)+"""</div></details>
    </section>\n"""
 anchor='    <section class="section section-shell reviews-section"'
 if anchor not in s:anchor='    <section class="section-shell contact-section'
 if anchor not in s:sys.exit('Ancre galerie introuvable, aucune modification écrite')
 s=s.replace(anchor,gallery+anchor,1)
 css="""\n/* Photos POP'n WASH 2026 : galerie légère et responsive */
.pn-gallery-section{padding-top:clamp(48px,7vw,90px)}
.pn-gallery-heading{margin:0 0 24px}.pn-gallery-heading h2{font-size:clamp(30px,3.5vw,48px);letter-spacing:-.04em;margin:8px 0 0}
.pn-gallery-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.pn-gallery-item{margin:0;position:relative;border-radius:20px;overflow:hidden;aspect-ratio:4/3;background:var(--card);box-shadow:0 8px 26px rgba(0,0,0,.09)}
.pn-gallery-item img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .35s ease}
.pn-gallery-item:hover img{transform:scale(1.035)}
.pn-gallery-item figcaption{position:absolute;left:12px;bottom:12px;padding:6px 11px;background:rgba(255,255,255,.92);color:#26302b;font-size:12px;font-weight:800;border-radius:8px}
.pn-gallery-more{margin-top:22px}.pn-gallery-more summary{cursor:pointer;display:block;max-width:max-content;margin:0 auto 22px;padding:12px 22px;border:1px solid var(--line);border-radius:999px;background:var(--card);font-weight:800;text-align:center;color:var(--ink)}
.pn-gallery-more:not([open]) summary{margin-bottom:0}
@media(max-width:760px){.pn-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pn-gallery-item{border-radius:13px}.pn-gallery-item figcaption{left:6px;bottom:6px;font-size:10px;padding:4px 7px}}
@media(max-width:410px){.pn-gallery-grid{grid-template-columns:1fr 1fr}.pn-gallery-item{aspect-ratio:1/1}.pn-gallery-item figcaption{max-width:calc(100% - 12px)}}
@media(prefers-reduced-motion:reduce){.pn-gallery-item img{transition:none}}
"""
 s=s.replace('</style>',css+'</style>',1)
 # Initial language follows website language when the app updates <html lang>.
 lang_js="""\n<script id="pn-gallery-i18n">(()=>{const t={fr:['La laverie en images','Découvrir toutes les photos'],nl:['De wasserette in beelden','Bekijk alle foto’s'],en:['Explore the laundromat','See all photos'],de:['Unsere Wäscherei in Bildern','Alle Fotos ansehen'],it:['La lavanderia in immagini','Vedi tutte le foto'],es:['La lavandería en imágenes','Ver todas las fotos'],pt:['A lavandaria em imagens','Ver todas as fotos'],ro:['Spălătoria în imagini','Vezi toate fotografiile'],pl:['Pralnia na zdjęciach','Zobacz wszystkie zdjęcia'],uk:['Пральня у світлинах','Переглянути всі фото'],ru:['Прачечная в фотографиях','Все фотографии']};function apply(){let l=(document.documentElement.lang||'fr').split('-')[0].toLowerCase(),v=t[l]||t.fr;const h=document.getElementById('pnGalleryTitle'),m=document.getElementById('pnGalleryMore');if(h)h.textContent=v[0];if(m)m.textContent=v[1]}document.addEventListener('DOMContentLoaded',apply);new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']})})();</script>\n"""
 s=s.replace('</body>',lang_js+'</body>',1)
# Keep the site's existing scripts intact.
# Normalize Open Graph to an SEO-priority wide photo and set native social dimensions.
if 'property="og:image:width"' not in s:
 s=s.replace('<meta property="og:type"', '<meta property="og:image:width" content="1600" />\n  <meta property="og:image:height" content="1200" />\n  <meta property="og:type"',1)
if s.count('class="hero-photo')<4:sys.exit('Carrousel incomplet')
for n in [1,3,5,6,14,18,19,20,29]:
 if src(n) not in s:sys.exit(f'Photo importante manquante dans index : {n}')
INDEX.write_text(s,encoding='utf-8')
print('OK : 23 visuels WebP, 4 photos en tête du carrousel, galerie ordonnée, services et SEO actualisés.')
