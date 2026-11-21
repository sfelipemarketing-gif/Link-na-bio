"""Synthesize subtle ambient music + refined SFX, then mix under the narration.
usage: python3 audio.py sfx.json voice.mp3 duration out.wav"""
import json,sys,subprocess,numpy as np
SR=48000
sfx=json.load(open(sys.argv[1])); voice=sys.argv[2]; D=float(sys.argv[3]); out=sys.argv[4]
N=int(D*SR); t=np.arange(N)/SR
rng=np.random.default_rng(7)
def lp(x,a):  # one-pole lowpass, a in (0,1)
    from scipy.signal import lfilter
    return lfilter([a],[1,-(1-a)],x)
from scipy.signal import butter,sosfilt
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],'band',fs=SR,output='sos'),x)
def hpf(x,f): return sosfilt(butter(2,f,'high',fs=SR,output='sos'),x)
def lpf(x,f): return sosfilt(butter(2,f,'low',fs=SR,output='sos'),x)
# ---- music: warm pad progression (Fmaj9 - Am7 - Dm9 - Bbmaj7), 4 bars each 4.8s, gentle pulse
mus=np.zeros((N,2))
def hz(m): return 440*2**((m-69)/12)
chords=[[53,60,64,67,69],[57,60,64,67,71],[50,57,60,64,65],[46,57,62,65,69]]
L=4.8
for ci in range(int(D/L)+1):
    ch=chords[ci%4]; s=int(ci*L*SR); e=min(N,int((ci+1)*L*SR+1.2*SR))
    if s>=N: break
    tt=np.arange(e-s)/SR
    env=np.minimum(1,tt/1.4)*np.minimum(1,np.maximum(0,(L+1.2-tt)/1.4))
    for j,m in enumerate(ch):
        f=hz(m+12 if j>0 else m)
        for det,pan in [(-0.12,0.25),(0.12,0.75)]:
            ph=rng.uniform(0,6.28)
            w=np.sin(2*np.pi*f*(1+det/100)*tt+ph)+0.25*np.sin(4*np.pi*f*(1+det/100)*tt+ph)
            amp=(0.05 if j==0 else 0.028)*env
            mus[s:e,0]+=w*amp*(1-pan); mus[s:e,1]+=w*amp*pan
    # soft sub on root
    mus[s:e]+=(np.sin(2*np.pi*hz(ch[0]-12)*tt)*0.05*env)[:,None]
# airy pulse: filtered noise ticks on 8ths (120bpm -> 0.25s), very low
pulse=np.zeros(N)
for k in range(int(D/0.25)):
    s=int(k*0.25*SR); n=int(0.06*SR)
    if s+n>N: break
    pulse[s:s+n]+=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*70)*(0.6 if k%2==0 else 0.35)
pulse=hpf(pulse,7000)*0.05
mus+=pulse[:,None]
# slow shimmer movement
mus*=(0.85+0.15*np.sin(2*np.pi*t/9))[:,None]
mus=np.stack([lpf(mus[:,0],5000),lpf(mus[:,1],5000)],1)
# intro/outro fades
fade=np.minimum(1,t/1.5)*np.minimum(1,np.maximum(0,(D-t)/2.5))
mus*=fade[:,None]
# ---- sfx
fx=np.zeros((N,2))
def add(sig,at,g,pan=.5):
    s=int(at*SR)
    if s<0: sig=sig[-s:]; s=0
    e=min(N,s+len(sig)); sig=sig[:e-s]
    fx[s:e,0]+=sig*g*(1-pan)*2**.5*.7; fx[s:e,1]+=sig*g*pan*2**.5*.7
for ev in sfx:
    ty,at,g=ev['type'],ev['t'],ev['g']
    if ty=='whoosh':
        n=int(0.7*SR); x=rng.standard_normal(n); tt=np.arange(n)/SR
        env=np.sin(np.pi*np.minimum(1,tt/0.7))**2.2
        # sweep bandpass by mixing low and high filtered noise
        lo=bp(x,300,1500); hi=bp(x,1500,7000)
        k=tt/0.7
        sig=(lo*(1-k)+hi*k)*env*0.22
        add(sig,at-0.35,g)
    elif ty=='pop':
        n=int(0.18*SR); tt=np.arange(n)/SR
        f=900*np.exp(-tt*18)+500
        sig=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*28)*0.12
        add(sig,at,g,0.5)
    elif ty=='click':
        n=int(0.05*SR); tt=np.arange(n)/SR
        sig=(np.sin(2*np.pi*2400*tt)*0.5+hpf(rng.standard_normal(n),3000)*0.5)*np.exp(-tt*150)*0.1
        add(sig,at,g,0.5)
    elif ty=='shimmer':
        n=int(1.8*SR); tt=np.arange(n)/SR; sig=np.zeros(n)
        for i,m in enumerate([84,88,91,96,100]):
            d=int(i*0.06*SR); tn=tt[:n-d]
            sig[d:]+=np.sin(2*np.pi*hz(m)*tn)*np.exp(-tn*2.8)*0.035
        add(sig,at,g,0.5)
# ---- voice
v=subprocess.run(['ffmpeg','-v','error','-i',voice,'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout
v=np.frombuffer(v,dtype=np.float32).astype(float)
vo=np.zeros(N); vo[:min(N,len(v))]=v[:N]
# sidechain duck music by voice envelope
venv=lpf(np.abs(vo),8); venv=venv/ (venv.max()+1e-9)
duck=1-0.45*np.clip(venv*4,0,1)
mix=mus*0.55*duck[:,None]+fx*0.8+np.stack([vo,vo],1)*1.0
peak=np.abs(mix).max(); mix=mix/peak*0.89 if peak>0.89 else mix
import wave
w=wave.open(out,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes()); w.close()
print('ok',D)
