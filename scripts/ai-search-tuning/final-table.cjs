// Renders the relevance-marked final verification table (+good ~marginal !bad).
// Usage: node scripts/ai-search-tuning/final-table.cjs
const fs=require('fs'),path=require('path');
const S=process.env.RESULTS_DIR || path.join(__dirname,'results');
const qlines=fs.readFileSync(path.join(__dirname,'queries.txt'),'utf8').trim().split('\n');
// relevance ground truth: good / marginal; everything else = bad
const REL={
 'k-laser':{good:['vhs','makerlabs','makercube','zenmakerlab','victoria-makerspace'],marg:['pathway-maker-mile','pathway-free-build','vtl','pathway-island-run']},
 'c-laser':{good:['vhs','makerlabs','makercube','zenmakerlab','victoria-makerspace'],marg:['pathway-maker-mile','pathway-free-build','vtl','pathway-island-run']},
 'k-ceramics':{good:['makerlabs','makercube','artsfactory'],marg:['tcglass','pathway-maker-mile','pathway-island-run','makerspace-nanaimo','victoria-makerspace','zenmakerlab']},
 'c-ceramics':{good:['makerlabs','makercube','artsfactory'],marg:['tcglass','vtl','pathway-maker-mile','pathway-island-run','pathway-free-build','pathway-gastown-crawl']},
 'k-preseed':{good:['althra','foundersboost','foundersquest','launch','zenlaunchpad','flowstatefounder'],marg:['alacrity','venturelabs','futurpreneur','aistartuphub','civicinnovationlab','pathway-free-build']},
 'c-preseed':{good:['althra','foundersboost','foundersquest','launch','zenlaunchpad','futurpreneur','foundedincanada','flowstatefounder'],marg:['aistartuphub','civicinnovationlab','pathway-free-build']},
 'k-cowork':{good:['friendsquarters','dctrl','northhouse','launch','pathway-gastown-crawl','artsfactory','venturelabs'],marg:['funk','zspace','basecamp','inspirationlab','pathway-maker-mile','vtl']},
 'c-cowork':{good:['friendsquarters','dctrl','northhouse','inspirationlab','launch','pathway-gastown-crawl','funk'],marg:['zspace','basecamp','artsfactory','venturelabs','pathway-maker-mile','pathway-free-build','buildrs','sfusurrey']},
 'k-youth':{good:['ethoslab','zenmakerlab'],marg:['youngguns','cdm','sfusurrey']},
 'c-youth':{good:['ethoslab','zenmakerlab'],marg:['youngguns','makerspace-nanaimo','vhs']},
 'k-glass':{good:['tcglass'],marg:['pathway-maker-mile']},
 'c-fund':{good:['futurpreneur','althra','foundedincanada','vst'],marg:['foundersboost','alacrity','bcfoundersday','flowstatefounder','foundersquest','vsw','bcai','launch']},
 'k-3dprint':{good:['vhs','ethoslab','makerlabs','makercube','zenmakerlab','victoria-makerspace','makerspace-nanaimo'],marg:['pathway-maker-mile','pathway-free-build','vtl']},
 'c-proto':{good:['vhs','makerlabs','makercube','victoria-makerspace','makerspace-nanaimo','pathway-free-build','zenlaunchpad','vtl'],marg:['zenmakerlab','ethoslab','inspirationlab','pathway-maker-mile']},
 'c-events':{good:['buildrs','vsw','vtj','bcfoundersday'],marg:['dwebyvr','bcai','frontiercollective','bitdevs','dctrl','aistartuphub']},
 'k-sred':{good:['foundedincanada'],marg:[]},
};
const mark=(qid,key)=>{const k=key.replace('.md','').replace(/^pathway-(.+)$/,'pathway-$1');const r=REL[qid];
 if(r.good.includes(k))return'+';if(r.marg.includes(k))return'~';return'!'};
let G=0,M=0,B=0,dead=0;
console.log('query'.padEnd(11)+'n'.padEnd(4)+'results (+good ~marginal !bad)');
for(const l of qlines){
 const [qid]=l.split('|');
 const raw=fs.readFileSync(path.join(S,'final',qid+'.json'),'utf8');
 const m=raw.match(/\{[\s\S]*\}/);
 if(!m){console.log(qid.padEnd(11)+'ERR');continue}
 const j=JSON.parse(m[0]);const ch=j.chunks||[];
 if(!ch.length)dead++;
 const cells=ch.map(c=>{const s=mark(qid,c.item?.key||'?');
   if(s==='+')G++;else if(s==='~')M++;else B++;
   return s+(c.item?.key||'?').replace('.md','')+':'+c.score.toFixed(2)});
 console.log(qid.padEnd(11)+String(ch.length).padEnd(4)+cells.join(' '));
}
console.log(`\ntotals: good=${G} marginal=${M} bad=${B} | dead queries=${dead}/16`);
