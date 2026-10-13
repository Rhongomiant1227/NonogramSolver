from __future__ import annotations
import json, os, math, time, ctypes
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
ROOT = Path(__file__).parent

def patterns(length: int, clues: list[int]) -> list[int]:
    if not clues: return [0]
    out=[]; suffix=[0]*(len(clues)+1)
    for i in range(len(clues)-1,-1,-1): suffix[i]=suffix[i+1]+clues[i]
    def rec(i, pos, mask):
        if i == len(clues): out.append(mask); return
        remaining = suffix[i] + (len(clues)-i-1)
        for start in range(pos, length-remaining+1):
            run=((1<<clues[i])-1)<<start
            rec(i+1, start+clues[i]+1, mask|run)
    rec(0,0,0); return out

class SolverLimit(Exception): pass

def validate_mouse_operations(operations):
    if not isinstance(operations,list) or not operations or len(operations)>5000:
        raise ValueError('invalid_operations')
    clean=[]
    for op in operations:
        if not isinstance(op,dict) or op.get('button') not in ('left','right'):
            raise ValueError('invalid_operation')
        x,y=int(round(float(op['x']))),int(round(float(op['y'])))
        if not (-10000<=x<=10000 and -10000<=y<=10000):
            raise ValueError('invalid_coordinate')
        clean.append((x,y,op['button']))
    return clean

def execute_mouse_operations(operations,user32,sleep=time.sleep):
    left,right,up_left,up_right=0x0002,0x0008,0x0004,0x0010
    for x,y,button in operations:
        user32.SetCursorPos(x,y); sleep(.018)
        down,up=(left,up_left) if button=='left' else (right,up_right)
        user32.mouse_event(down,0,0,0,0); sleep(.012); user32.mouse_event(up,0,0,0,0); sleep(.025)

def solve(rows, cols, limit=2):
    h,w=len(rows),len(cols)
    if not h or not w: return {'status':'invalid','code':'invalid_dimensions'}
    if sum(map(sum,rows)) != sum(map(sum,cols)):
        return {'status':'unsat','code':'totals_mismatch'}
    # Refuse pathological domains before allocating them; common large sparse puzzles remain cheap.
    total=0; cache={}
    def domain(length, clues):
        nonlocal total
        key=(length,tuple(clues))
        if key not in cache:
            minimum=sum(clues)+max(0,len(clues)-1)
            count=0 if minimum>length else math.comb(length-sum(clues)+1,len(clues)) if clues else 1
            if count>100_000 or total+count>750_000:
                raise SolverLimit('patterns_limit')
            cache[key]=patterns(length,clues); total+=count
        return cache[key][:]
    rp=[domain(w,c) for c in rows]; cp=[domain(h,c) for c in cols]
    if any(not p for p in rp+cp): return {'status':'unsat','code':'clue_out_of_range'}
    solutions=[]; nodes=0; deadline=time.monotonic()+12
    def propagate(rp,cp):
        changed=True
        while changed:
            if time.monotonic()>deadline: raise SolverLimit('time_limit')
            changed=False
            col_any=[]; col_all=[]
            for vals in cp:
                any_mask=0; all_mask=(1<<h)-1
                for x in vals: any_mask |= x; all_mask &= x
                col_any.append(any_mask); col_all.append(all_mask)
            for r in range(h):
                must_fill=must_empty=0
                for c in range(w):
                    bit=1<<r
                    if col_all[c]&bit: must_fill |= 1<<c
                    elif not col_any[c]&bit: must_empty |= 1<<c
                old=rp[r]; keep=[x for x in old if x&must_fill==must_fill and not x&must_empty]
                if not keep:return None
                if len(keep)!=len(old): rp[r]=keep; changed=True
            row_any=[]; row_all=[]
            for vals in rp:
                any_mask=0; all_mask=(1<<w)-1
                for x in vals: any_mask |= x; all_mask &= x
                row_any.append(any_mask); row_all.append(all_mask)
            for c in range(w):
                must_fill=must_empty=0
                for r in range(h):
                    bit=1<<c
                    if row_all[r]&bit: must_fill |= 1<<r
                    elif not row_any[r]&bit: must_empty |= 1<<r
                old=cp[c]; keep=[x for x in old if x&must_fill==must_fill and not x&must_empty]
                if not keep:return None
                if len(keep)!=len(old): cp[c]=keep; changed=True
        return rp,cp
    def search(rp,cp):
        nonlocal nodes
        nodes += 1
        if nodes > 250_000: raise SolverLimit('node_limit')
        if time.monotonic() > deadline: raise SolverLimit('time_limit')
        if len(solutions)>=limit:return
        state=propagate([x[:] for x in rp],[x[:] for x in cp])
        if not state:return
        rp2,cp2=state; target=None; opts=None
        for i,p in enumerate(rp2):
            if len(p)>1 and (opts is None or len(p)<len(opts)):target=('r',i);opts=p
        for i,p in enumerate(cp2):
            if len(p)>1 and (opts is None or len(p)<len(opts)):target=('c',i);opts=p
        if opts is None: solutions.append([p[0] for p in rp2]); return
        for value in opts:
            nr=[x[:] for x in rp2]; nc=[x[:] for x in cp2]
            (nr if target[0]=='r' else nc)[target[1]]=[value]
            search(nr,nc)
            if len(solutions)>=limit:return
    search(rp,cp)
    if not solutions:return {'status':'unsat','code':'no_solution'}
    return {'status':'unique' if len(solutions)==1 else 'multiple','grid':[[bool(solutions[0][r]&(1<<c)) for c in range(w)] for r in range(h)],'count':len(solutions),'dimensions':{'rows':h,'cols':w}}

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype='application/json'):
        raw=body if isinstance(body,bytes) else body.encode('utf-8'); self.send_response(code); self.send_header('Content-Type',ctype+'; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        if urlparse(self.path).path=='/api/health': self._send(200,json.dumps({'ok':True})); return
        static_path=urlparse(self.path).path
        if static_path=='/favicon.ico': self._send(204,b'','image/x-icon'); return
        assets={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/i18n.js':'i18n.js','/image.js':'image.js'}
        if static_path in assets:
            filename=assets[static_path]; content_type='text/html' if filename.endswith('.html') else 'application/javascript'
            self._send(200,(ROOT/'static'/filename).read_bytes(),content_type); return
        self._send(404,json.dumps({'error':'not found'}))
    def do_POST(self):
        path=urlparse(self.path).path
        if path=='/api/mouse-fill':
            self.handle_mouse_fill(); return
        if path!='/api/solve': self._send(404,json.dumps({'error':'not found'})); return
        try:
            data=json.loads(self.rfile.read(int(self.headers.get('Content-Length',0))))
            rows=data.get('rows',[]); cols=data.get('cols',[])
            if len(rows)>120 or len(cols)>120: self._send(400,json.dumps({'status':'invalid','code':'dimension_limit'})); return
            if not all(isinstance(line,list) and all(type(n) is int and n>0 for n in line) for line in rows+cols): self._send(400,json.dumps({'status':'invalid','code':'invalid_clue_format'})); return
            try: result=solve(rows,cols)
            except SolverLimit as e: result={'status':'limit','code':str(e)}
            self._send(200,json.dumps(result,ensure_ascii=False))
        except Exception:self._send(400,json.dumps({'status':'invalid','code':'invalid_clue_format'}))
    def handle_mouse_fill(self):
        try:
            length=int(self.headers.get('Content-Length',0));
            if length>2_000_000: self._send(413,json.dumps({'error':'payload_too_large'})); return
            data=json.loads(self.rfile.read(length)); clean=validate_mouse_operations(data.get('operations',[]))
            if not bool(data.get('confirm')):
                self._send(200,json.dumps({'ok':True,'dry_run':True,'count':len(clean)})); return
            if os.name!='nt': self._send(501,json.dumps({'error':'windows_mouse_unavailable'})); return
            execute_mouse_operations(clean,ctypes.windll.user32)
            self._send(200,json.dumps({'ok':True,'dry_run':False,'count':len(clean)}))
        except (ValueError,TypeError,KeyError,OverflowError): self._send(400,json.dumps({'error':'invalid_operations'}))
        except Exception:self._send(500,json.dumps({'error':'mouse_operation_failed'}))
    def log_message(self,*args): pass

if __name__=='__main__':
    port=int(os.environ.get('PORT','8000')); print(f'Nonogram solver running at http://localhost:{port}',flush=True); ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
