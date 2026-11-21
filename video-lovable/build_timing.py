"""Build timing.js (cues + caption chunks) from the marked script and word timings.
usage: python3 build_timing.py words.json|--estimate out.js"""
import json,re,sys
src=open('script_marked.txt',encoding='utf-8').read().replace('\n',' ')
toks=re.findall(r'\{(\w+)\}|(\S+)',src)
words=[];cueidx={}
for c,w in toks:
    if c: cueidx[c]=len(words)
    else: words.append(w)
if sys.argv[1]=='--estimate':
    t=0.4;wt=[]
    for w in words:
        d=0.06+0.045*len(w); wt.append([t,t+d]); t+=d+0.02
        if w[-1] in '.?:': t+=0.35
        elif w[-1] in ',': t+=0.2
        if w.endswith('...'): t+=0.3
else:
    wt=json.load(open(sys.argv[1]))
    assert len(wt)==len(words),(len(wt),len(words))
cues={k:round(wt[i][0],3) for k,i in cueidx.items()}
end=wt[-1][1]
# caption chunks: break on punctuation or max 4 words / 22 chars
chunks=[];cur=[]
for i,w in enumerate(words):
    cur.append(i)
    txt=' '.join(words[j] for j in cur)
    nxt_cue=(i+1) in cueidx.values()
    if w[-1] in '.?!:,' or len(cur)>=4 or len(txt)>18 or nxt_cue:
        chunks.append(cur);cur=[]
if cur: chunks.append(cur)
caps=[{'w':[[words[j],round(wt[j][0],3),round(wt[j][1],3)] for j in c]} for c in chunks]
for k,c in enumerate(caps):
    c['s']=c['w'][0][1]; 
    nxt=caps[k+1]['w'][0][1] if k+1<len(caps) else end+0.6
    c['e']=min(nxt, c['w'][-1][2]+0.6)
open(sys.argv[2],'w').write('window.TIMING='+json.dumps({'cues':cues,'caps':caps,'end':round(end,3)},ensure_ascii=False)+';\n')
print('words',len(words),'end',round(end,2),'chunks',len(caps))
