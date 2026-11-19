"""Builds the production front end: hashed minified assets for /public/assets and the HTML template the server fills in."""
import json, pathlib, random, hashlib, subprocess, shutil, sys

root = pathlib.Path(__file__).parent
src = root / 'src'
import os
srv = next((c for c in [pathlib.Path(os.environ['ICONIC_SERVER']) if os.environ.get('ICONIC_SERVER') else None, root.parent if (root.parent / 'server').exists() else None, root.parent / 'iconic-server'] if c))
pub = srv / 'public'
tpl = srv / 'server' / 'templates'
esbuild = next((c for c in [os.environ.get('ESBUILD'), str(root / 'node_modules/.bin/esbuild'), '/opt/npm-tools/node_modules/.bin/esbuild'] if c and pathlib.Path(c).exists()), 'esbuild')
(pub / 'assets').mkdir(parents=True, exist_ok=True)
tpl.mkdir(parents=True, exist_ok=True)
for old in (pub / 'assets').glob('*'):
    old.unlink()

def minify(text, loader):
    r = subprocess.run([esbuild, '--minify', f'--loader={loader}', '--target=es2020'], input=text.encode(), capture_output=True)
    if r.returncode != 0:
        sys.exit(r.stderr.decode())
    return r.stdout.decode()

def emit(name, ext, text):
    h = hashlib.sha256(text.encode()).hexdigest()[:10]
    fn = f'{name}.{h}.{ext}'
    (pub / 'assets' / fn).write_text(text)
    return fn

js = "'use strict';\n(function(){\n" + '\n'.join(f.read_text() for f in sorted((src / 'js').glob('*.js'))) + "\n})();"
assets = {
    'js': emit('app', 'js', minify(js, 'js')),
    'css': emit('app', 'css', minify((src / 'styles.css').read_text(), 'css')),
    'page': emit('page', 'js', minify((src / 'page.js').read_text(), 'js')),
    'pageCss': emit('pages', 'css', minify((src / 'pages.css').read_text(), 'css')),
}
(tpl / 'assets.json').write_text(json.dumps(assets))

# static skyline silhouette shown before WebGL is ready (same drawing as the prototype build)
rnd = random.Random(11)
rects = []; x = -20
while x < 1220:
    w = rnd.randint(28, 70); h = rnd.randint(80, 300)
    if 520 < x < 700: h = min(h, 150)
    rects.append((x, 600 - h, w, h)); x += w + rnd.randint(2, 10)
g = ''.join(f'<rect x="{a}" y="{b}" width="{c}" height="{d}"/>' for a, b, c, d in rects)
_l = (src / 'js' / '05-logo.js').read_text()
LOGO = json.loads(_l[_l.index('{', _l.index('const LOGO')):_l.rindex('};') + 1])
k = 0.82
tower = f'<path transform="translate({600-541*k:.1f} {598-582*k:.1f}) scale({k})" d="{" ".join(LOGO["mark"]["c"])}" fill="#c8a96a" fill-opacity=".92" fill-rule="evenodd"/>'
fb = f'<svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" focusable="false"><g fill="#07070a" opacity=".96">{g}</g>{tower}</svg>'

body = (src / 'body.html').read_text().replace('%%FALLBACK_SVG%%', fb)
def put(old, new):
    global body
    assert old in body, old
    body = body.replace(old, new, 1)
put('<div class="grid" id="propsGrid"></div>', '<div class="grid" id="propsGrid"><!--SSR:cards--></div>')
put('<div class="teams__list" id="teamsList"></div>', '<div class="teams__list" id="teamsList"><!--SSR:teams--></div>')
put('<ol class="pillars" id="pillars"></ol>', '<ol class="pillars" id="pillars"><!--SSR:pillars--></ol>')
put('<div class="contact-actions" id="contactActions"></div>', '<div class="contact-actions" id="contactActions"><!--SSR:actions--></div>')
put('<div class="contact-info" id="contactInfo"></div>', '<div class="contact-info" id="contactInfo"><!--SSR:info--></div>')
put('<div class="wrap cbranches" id="contactBranches"></div>', '<div class="wrap cbranches" id="contactBranches"><!--SSR:branches--></div>')
put('<p class="note" id="propsCount" aria-live="polite"></p>', '<p class="note" id="propsCount" aria-live="polite"><!--SSR:count--></p>')
put('<span id="year"></span>', '<span id="year"><!--SSR:year--></span>')
put('data-i18n="props.lede">Approved listings appear here, with filters that come from the listing data.</p>', 'data-i18n="props.lede">Approved listings appear here, with filters that come from the listing data.</p>\n        <!--SSR:regions-->')
# server mode: the preview buttons only make sense in the prototype
put('<button class="btn" id="previewBtn"', '<button class="btn" id="previewBtn" hidden')
put('<button class="btn" id="teamsPreviewBtn"', '<button class="btn" id="teamsPreviewBtn" hidden')
(tpl / 'home-body.html').write_text(body)

# logo as a standalone file (inner pages, structured data, favicon source)
word = ''.join(f'<path d="{l["d"]}" fill-rule="evenodd"/>' for l in LOGO['word'])
bx = LOGO['box']
logo = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(str(v) for v in bx)}" width="{bx[2]:.0f}" height="{bx[3]:.0f}">'
        f'<path d="{" ".join(LOGO["mark"]["c"])}" fill="#c8a96a" fill-rule="evenodd"/>'
        f'<g fill="#f3eee1">{word}</g><path d="{LOGO["sub"]["d"]}" fill="#c8a96a" fill-rule="evenodd"/></svg>')
(pub / 'logo.svg').write_text(logo)
mark = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(str(v) for v in LOGO["mark"]["box"])}"><path d="{" ".join(LOGO["mark"]["c"])}" fill="#c8a96a" fill-rule="evenodd"/></svg>')
(pub / 'mark.svg').write_text(mark)
print('assets', assets)
