from pathlib import Path
import random
out=Path(__file__).resolve().parent.parent / 'public' / 'samples'
r=random.Random(42)
def scene(n=0):
 s=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 620" shape-rendering="crispEdges"><rect width="960" height="620" fill="#55aae2"/>']
 def rect(x,y,w,h,c):s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>')
 # pixel cloud masses
 for x,y in [(40,90),(270,160),(620,85)]:
  for dx,dy,w,h in [(0,20,180,40),(30,0,100,40),(-20,40,230,25),(40,-15,55,35)]:rect(x+dx,y+dy,w,h,'#d2eef2')
  rect(x+20,y+55,160,12,'#a5d8ea')
 rect(0,345,960,275,'#78a96b');rect(0,385,960,235,'#659257')
 # distant garden
 for x in range(0,960,24):rect(x,325+r.randrange(-15,25),24,65,r.choice(['#538168','#598e6a','#6a9b6b']))
 for y in range(395,620,10):
  for x in range(0,960,12):
   if r.random()<.23:rect(x,y,12,8,r.choice(['#83af68','#527e56','#9dbc74','#739d60']))
 # winding sunlit path
 for y in range(350,620,10):
  x=470+int((y-350)*.95);rect(x,y,40+int((y-350)*.28),10,'#c9c597');
 # large tree to right
 rect(803,45,57,425,'#655946');rect(817,45,17,428,'#81765a');rect(842,115,12,350,'#494f3c');rect(772,444,112,20,'#655946');rect(748,460,145,14,'#655946')
 for x,y,w,h in [(760,95,68,16),(720,70,60,16),(842,150,76,16),(873,128,56,16)]:rect(x,y,w,h,'#655946')
 for i in range(135):
  x=r.randrange(630,1020)//12*12;y=r.randrange(-60,200)//12*12
  if ((x-840)/225)**2+((y-45)/165)**2<1:rect(x,y,r.choice([24,36,48]),r.choice([12,24,36]),r.choice(['#254c43','#2e6350','#3d7957','#568d5c','#70a25e']))
 # left small trees
 for tx,ty in [(68,365),(190,370)]:
  rect(tx,ty-80,12,145,'#6b6248')
  for i in range(35):
   x=tx+r.randrange(-60,60)//8*8;y=ty-100+r.randrange(-65,35)//8*8
   rect(x,y,24,16,r.choice(['#315e4b','#528457','#6c9b5e','#8eaf6a']))
 # garden beds
 for x,y in [(92,510),(250,465)]:
  rect(x,y,135,45,'#a58e62');rect(x+8,y+8,119,22,'#695f44');rect(x,y+35,135,12,'#867751')
  for i in range(8):rect(x+14+i*14,y+3,8,20,r.choice(['#365f48','#578052','#8fab68']))
 # reading bench
 rect(550,438,178,13,'#6d6350');rect(562,451,12,55,'#504c40');rect(701,451,12,55,'#504c40');rect(552,396,170,12,'#9f8c63');rect(552,412,170,12,'#8d7e59');rect(560,388,10,58,'#655b46');rect(707,388,10,58,'#655b46')
 # open book and bag
 rect(603,427,29,10,'#ede7c7');rect(632,424,29,13,'#fff7d9');rect(631,426,3,14,'#bcaf87');rect(660,425,29,16,'#456d76');rect(665,420,18,7,'#456d76')
 # wild flowers
 for i in range(100):
  x=r.randrange(960)//6*6;y=r.randrange(430,620)//6*6
  if x<450 or x>850:rect(x,y,4,10,'#436d4f');rect(x-3,y-2,10,5,r.choice(['#f0d988','#e5eee1','#afcddd','#dfaaa0']))
 s.append('</svg>');return ''.join(s)
(out/'reading-garden.svg').write_text(scene())
for n in range(1,5):(out/f'garden-{n}.svg').write_text(scene(n))
