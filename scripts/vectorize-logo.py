"""Rebuild outlined lettering and incorporate the hand-refined master symbol.

Requires Python 3.13, Pillow, numpy and vtracer==0.6.12. The source PNG stays untouched.
All lettering becomes paths; the generated SVGs contain no raster or fonts.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
import vtracer

ROOT = Path(__file__).resolve().parents[1]
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
pixels = np.asarray(Image.open(ROOT / 'mv_logo.png').convert('RGB')).astype(float)
r, g, b = pixels[..., 0], pixels[..., 1], pixels[..., 2]
green = (g > 85) & (g > r * 1.45) & (g > b * 1.3)
white = (np.minimum(np.minimum(r, g), b) > 155) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) < 65)
y, x = np.indices(g.shape)

def trace(mask, color, work, name):
    source, destination = work / f'{name}.png', work / f'{name}.svg'
    Image.fromarray(np.where(mask, 0, 255).astype('uint8')).save(source)
    vtracer.convert_image_to_svg_py(str(source), str(destination), colormode='binary', mode='polygon', filter_speckle=4, corner_threshold=45, length_threshold=2, splice_threshold=45, path_precision=2)
    paths = []
    for path in ET.parse(destination).getroot():
        if path.tag.endswith('path'):
            path.set('fill', color)
            paths.append(path)
    return paths

def svg(groups, viewbox, title):
    root = ET.Element(f'{{{NS}}}svg', {'viewBox': viewbox, 'fill': 'none'})
    ET.SubElement(root, f'{{{NS}}}title').text = title
    for name, paths in groups:
        group = ET.SubElement(root, f'{{{NS}}}g', {'id': name})
        group.extend(paths)
    return ET.tostring(root, encoding='unicode') + '\n'

with TemporaryDirectory(prefix='mindvortex-trace-') as folder:
    work = Path(folder)
    groups = []
    for name, top, bottom in [('symbol', 230, 755), ('wordmark', 785, 885), ('signature', 890, 945), ('services', 995, 1065)]:
        if name == 'symbol':
            master = ET.parse(ROOT / 'brand' / 'vortex-symbol.svg').getroot()
            groups.append(('symbol', list(master.find(f'{{{NS}}}g'))))
            continue
        region = (y >= top) & (y < bottom)
        paths = trace(green & region, '#35F46A', work, f'{name}-green')
        paths += trace(white & region, '#F2F4F3', work, f'{name}-white')
        groups.append((name, paths))
    output = ROOT / 'public' / 'brand'
    (output / 'mv-logo.svg').write_text(svg(groups, '150 225 955 855', 'Mind Vortex — Pyrka Patryk — Web / Backend / Design / Branding'), encoding='utf-8')
    symbol = svg(groups[:1], '385 235 530 530', 'Mind Vortex symbol')
    (output / 'mv-symbol.svg').write_text(symbol, encoding='utf-8')
    (ROOT / 'src' / 'app' / 'icon.svg').write_text(symbol, encoding='utf-8')
    (output / 'mv-wordmark.svg').write_text(svg(groups[1:2], '165 790 925 90', 'Mind Vortex'), encoding='utf-8')
    for path in output.glob('*.svg'):
        print(f'{path.name}: {path.stat().st_size:,} bytes')
