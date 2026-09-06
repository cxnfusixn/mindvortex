"""One fixed-radius circle per continuous blade edge.

Keep the accepted silhouette endpoints, pixel steps and detached fragments.
Each arc passes through three design landmarks and has no intermediate joins.
"""
from pathlib import Path
import math
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
construction_circles = []

def fmt(p): return ' '.join(f'{v:.6f}'.rstrip('0').rstrip('.') for v in p)

def arc_from_center(p,q,c,sweep):
    radius = math.dist(p,c)
    a = math.atan2(p[1]-c[1],p[0]-c[0])
    b = math.atan2(q[1]-c[1],q[0]-c[0])
    delta = ((b-a) if sweep else (a-b)) % math.tau
    construction_circles.append((c,radius))
    return f'A{radius:.6f} {radius:.6f} 0 {int(delta>math.pi)} {sweep} {fmt(q)}'

def arc(p,m,q):
    ax,ay=p; bx,by=m; cx,cy=q
    d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
    center=(((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/d,
            ((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/d)
    angle=lambda point: math.atan2(point[1]-center[1],point[0]-center[0])%math.tau
    sweep=int((angle(m)-angle(p))%math.tau<(angle(q)-angle(p))%math.tau)
    return arc_from_center(p,q,center,sweep)

blades = {
 'blade-upper': 'M586 316 '+arc((586,316),(465,451),(587,573))+' '+arc((587,573),(534,521),(638,413))+' V392 H671 V374 H648 V361 '+arc((648,361),(590,371),(537,400))+' '+arc((537,400),(557,367),(586,344))+' V326 H640 V310 H586 Z',
 'blade-lower': 'M420 489 '+arc((420,489),(552,599),(639,500))+' '+arc((639,500),(552,646),(420,489))+' Z',
 'blade-right': 'M570 487 '+arc((570,487),(654,460),(739,547))+' H747 V584 H725 V614 H744 V638 H720 V654 H700 V669 H687 V680 H666 V699 H639 V681 '+arc((639,681),(646,494),(570,487))+' Z',
 'blade-tip-left': 'M466 389 '+arc((466,389),(443,419),(432,446))+' H451 '+arc((451,446),(455,415),(466,389))+' Z',
 'blade-tip-lower': 'M639 681 '+arc((639,681),(602,712),(558,729))+' '+arc((558,729),(601,724),(639,712))+' Z',
}
master=ROOT/'brand/vortex-symbol.svg'
root=ET.parse(master).getroot()
for element in root.iter():
 if element.get('id') in blades: element.set('d',blades[element.get('id')])
ET.indent(root,space='  ')
master.write_text(ET.tostring(root,encoding='unicode')+'\n',encoding='utf-8')
diagram=ET.Element(f'{{{NS}}}svg',{'viewBox':'350 220 620 560','fill':'none'})
ET.SubElement(diagram,f'{{{NS}}}title').text='Mind Vortex circular construction'
ET.SubElement(diagram,f'{{{NS}}}rect',{'x':'350','y':'220','width':'620','height':'560','fill':'#050706'})
for i,(center,r) in enumerate(construction_circles):
 ET.SubElement(diagram,f'{{{NS}}}circle',{'cx':str(center[0]),'cy':str(center[1]),'r':str(r),'stroke':'#129447','stroke-width':'.65','stroke-dasharray':'3 4'})
for name,d in blades.items():
 ET.SubElement(diagram,f'{{{NS}}}path',{'d':d,'stroke':'#35F46A','stroke-width':'1.25'})
ET.indent(diagram,space='  ')
(ROOT/'brand/vortex-construction.svg').write_text(ET.tostring(diagram,encoding='unicode')+'\n',encoding='utf-8')
print('Rebuilt original silhouette using',len(construction_circles),'fixed-radius edges, without intermediate arc joins.')
