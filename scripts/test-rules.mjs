const AUTH='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const FS='http://127.0.0.1:8083/v1/projects/factstamp-app/databases/(default)/documents'
const KEY='fake-api-key'
const call=async(u,o)=>{const r=await fetch(u,{...o,headers:{'Content-Type':'application/json',...(o?.headers||{})}});return{ok:r.ok,status:r.status,body:await r.json().catch(()=>({}))}}
const S=v=>({stringValue:v}),I=v=>({integerValue:String(v)}),B=v=>({booleanValue:v})
let pass=0,fail=0
const expect=(label,got,want)=>{const ok=got===want;ok?pass++:fail++;console.log(`${ok?'  PASS':'**FAIL**'}  ${label.padEnd(52)} ${got?'ALLOWED':'DENIED'} (want ${want?'ALLOWED':'DENIED'})`)}

async function mkUser(tag,rep=50){
  const name=tag
  const email=`${tag}${Date.now()}${Math.random().toString(36).slice(2,6)}@example.com`
  const {body}=await call(`${AUTH}/accounts:signUp?key=${KEY}`,{method:'POST',body:JSON.stringify({email,password:'Passw0rd!23',returnSecureToken:true})})
  const H={Authorization:`Bearer ${body.idToken}`}
  await call(`${FS}/users?documentId=${body.localId}`,{method:'POST',headers:H,body:JSON.stringify({fields:{
    uid:S(body.localId),displayName:S(tag),email:S(email),reputation:I(rep),totalVerifications:I(0),isAdmin:B(false),joinedAt:S(new Date().toISOString())}})})
  return {uid:body.localId,H,name}
}

async function mkUserWithEmail(tag,email){
  const {body}=await call(`${AUTH}/accounts:signUp?key=${KEY}`,{method:'POST',body:JSON.stringify({email,password:'Passw0rd!23',returnSecureToken:true})})
  const H={Authorization:`Bearer ${body.idToken}`}
  await call(`${FS}/users?documentId=${body.localId}`,{method:'POST',headers:H,body:JSON.stringify({fields:{
    uid:S(body.localId),displayName:S(tag),email:S(email),reputation:I(50),totalVerifications:I(0),isAdmin:B(false),joinedAt:S(new Date().toISOString())}})})
  return {uid:body.localId,H,name:tag}
}

const fields=(uid,ms,name='Author')=>({text:S('This is a seeded test claim about public health policy.'),
  category:S('health'),status:S('pending'),verificationCount:I(0),verifications:{arrayValue:{values:[]}},
  submittedBy:S(uid),submittedByName:S(name),createdAt:S(new Date().toISOString()),
  consensusDeadline:S(new Date(ms).toISOString()),consensusDeadlineMs:I(ms),imageUrl:S('https://placeholder.com/x.png')})
const mkClaim=async(u,ms=Date.now()+7*864e5)=>{const r=await call(`${FS}/claims`,{method:'POST',headers:u.H,body:JSON.stringify({fields:fields(u.uid,ms,u.name)})});return r.ok?r.body.name.split('/').pop():null}
const verif=(u,verdict='TRUE')=>({mapValue:{fields:{verifierId:S(u.uid),verifierReputation:I(50),verdict:S(verdict),
  sourceUrl:S('https://example.com/s'),explanation:S('x'.repeat(60)),verifierName:S(u.name),sourceQuality:S('high'),createdAt:S(new Date().toISOString())}}})
const mask=(...f)=>f.map(x=>`updateMask.fieldPaths=${x}`).join('&')

const author=await mkUser('author'), att=await mkUser('attacker')
const v1=await mkUser('v1'), v2=await mkUser('v2'), v3=await mkUser('v3')

console.log('\n── Exploits (must now be DENIED) ──')
const c1=await mkClaim(author)
expect('Case B: close fresh claim as CONTESTED',
  (await call(`${FS}/claims/${c1}?${mask('status','verdict')}`,{method:'PATCH',headers:att.H,
    body:JSON.stringify({fields:{status:S('verified'),verdict:S('CONTESTED')}})})).ok, false)

const c2=await mkClaim(author)
expect('Case C: forge verified FALSE at 1 verification',
  (await call(`${FS}/claims/${c2}?${mask('verifications','verificationCount','status','verdict','confidenceScore')}`,{method:'PATCH',headers:att.H,
    body:JSON.stringify({fields:{verifications:{arrayValue:{values:[verif(att,'FALSE')]}},verificationCount:I(1),
      status:S('verified'),verdict:S('FALSE'),confidenceScore:I(99)}})})).ok, false)

const c3=await mkClaim(author)
expect('Case C: append 2 verifications in one write',
  (await call(`${FS}/claims/${c3}?${mask('verifications','verificationCount','status','verdict','confidenceScore')}`,{method:'PATCH',headers:att.H,
    body:JSON.stringify({fields:{verifications:{arrayValue:{values:[verif(att),verif(v1)]}},verificationCount:I(1),
      status:S('pending'),verdict:S('TRUE'),confidenceScore:I(50)}})})).ok, false)

expect('Create claim pre-expired (backdated deadline)',
  (await call(`${FS}/claims`,{method:'POST',headers:att.H,body:JSON.stringify({fields:fields(att.uid,Date.now()-864e5,att.name)})})).ok, false)

console.log('\n── Legitimate flows (must still be ALLOWED) ──')
const c4=await mkClaim(author)
let arr=[]
for (const [i,u] of [v1,v2,v3].entries()) {
  arr=[...arr,verif(u)]
  const n=i+1, verified=n>=3
  expect(`Verification ${n}/3 by a normal verifier`,
    (await call(`${FS}/claims/${c4}?${mask('verifications','verificationCount','status','verdict','confidenceScore','agreementRatio','avgVerifierReputation','sourceQualityScore')}`,{method:'PATCH',headers:u.H,
      body:JSON.stringify({fields:{verifications:{arrayValue:{values:arr}},verificationCount:I(n),
        status:S(verified?'verified':'pending'),verdict:S('TRUE'),confidenceScore:I(72),
        agreementRatio:{doubleValue:1},avgVerifierReputation:{doubleValue:50},sourceQualityScore:{doubleValue:90}}})})).ok, true)
}

// A normal user cannot create an already-overdue claim (that create is denied
// above), so make one that expires in ~2s and let it lapse.
const c5=await mkClaim(author, Date.now()+2000)
expect('Expiry BEFORE deadline passes (must be denied)',
  (await call(`${FS}/claims/${c5}?${mask('status','verdict')}`,{method:'PATCH',headers:att.H,
    body:JSON.stringify({fields:{status:S('verified'),verdict:S('CONTESTED')}})})).ok, false)
await new Promise(r=>setTimeout(r,3500))
expect('Expiry AFTER deadline passes -> CONTESTED',
  (await call(`${FS}/claims/${c5}?${mask('status','verdict')}`,{method:'PATCH',headers:att.H,
    body:JSON.stringify({fields:{status:S('verified'),verdict:S('CONTESTED')}})})).ok, true)

expect('Create a normal claim with a valid deadline',
  (await call(`${FS}/claims`,{method:'POST',headers:author.H,body:JSON.stringify({fields:fields(author.uid,Date.now()+7*864e5,author.name)})})).ok, true)

console.log('\n── Consensus integrity (must be DENIED) ──')
const patchV=(claimId,u,values,n,status='pending')=>call(`${FS}/claims/${claimId}?${mask('verifications','verificationCount','status','verdict','confidenceScore')}`,
  {method:'PATCH',headers:u.H,body:JSON.stringify({fields:{verifications:{arrayValue:{values}},verificationCount:I(n),
    status:S(status),verdict:S('TRUE'),confidenceScore:I(60)}})})

// One account must not be able to fill every slot on a claim by itself.
const c7=await mkClaim(author)
expect('Solo consensus: 1st verification by v1',
  (await patchV(c7,v1,[verif(v1)],1)).ok, true)
expect('Solo consensus: v1 verifies the same claim twice',
  (await patchV(c7,v1,[verif(v1),verif(v1)],2)).ok, false)

// The author of a claim must not sit on its own jury.
const c8=await mkClaim(author)
expect('Author verifies their own claim',
  (await patchV(c8,author,[verif(author)],1)).ok, false)

// Consensus closes at 3 — a 4th verification must not be appendable.
const c9=await mkClaim(author)
let arr9=[]
for (const [i,u] of [v1,v2,v3].entries()) {
  arr9=[...arr9,verif(u)]
  await patchV(c9,u,arr9,i+1,i+1>=3?'verified':'pending')
}
const v4=await mkUser('v4')
expect('4th verification after consensus closed',
  (await patchV(c9,v4,[...arr9,verif(v4)],4,'verified')).ok, false)

console.log('\n── Identity spoofing (must be DENIED) ──')
expect('Submit a claim as "WHO Official"',
  (await call(`${FS}/claims`,{method:'POST',headers:att.H,body:JSON.stringify({fields:fields(att.uid,Date.now()+7*864e5,'WHO Official')})})).ok, false)
const c6=await mkClaim(author)
const spoofV={mapValue:{fields:{verifierId:S(att.uid),verifierReputation:I(50),verdict:S('TRUE'),
  sourceUrl:S('https://example.com/s'),explanation:S('x'.repeat(60)),verifierName:S('Dr. Anita Verma'),
  sourceQuality:S('high'),createdAt:S(new Date().toISOString())}}}
expect('Verify under another verifier\'s name',
  (await call(`${FS}/claims/${c6}?${mask('verifications','verificationCount','status','verdict','confidenceScore')}`,{method:'PATCH',headers:att.H,
    body:JSON.stringify({fields:{verifications:{arrayValue:{values:[spoofV]}},verificationCount:I(1),
      status:S('pending'),verdict:S('TRUE'),confidenceScore:I(50)}})})).ok, false)

console.log('\n── Claim screenshots (claim_media) ──')
const IMG = 'data:image/jpeg;base64,' + 'A'.repeat(200)
const media = (claimId, img = IMG) => ({fields:{claimId:S(claimId), imageUrl:S(img), createdAt:S(new Date().toISOString())}})
const cM = await mkClaim(author)
expect('Attach a screenshot to someone else\'s claim',
  (await call(`${FS}/claim_media?documentId=${cM}`,{method:'POST',headers:att.H,body:JSON.stringify(media(cM))})).ok, false)
expect('Author attaches a screenshot to their own claim',
  (await call(`${FS}/claim_media?documentId=${cM}`,{method:'POST',headers:author.H,body:JSON.stringify(media(cM))})).ok, true)
expect('Overwrite an existing screenshot',
  (await call(`${FS}/claim_media/${cM}?${mask('imageUrl')}`,{method:'PATCH',headers:author.H,
    body:JSON.stringify({fields:{imageUrl:S(IMG)}})})).ok, false)
const cM2 = await mkClaim(author)
expect('Attach a non-image payload',
  (await call(`${FS}/claim_media?documentId=${cM2}`,{method:'POST',headers:author.H,
    body:JSON.stringify(media(cM2,'https://evil.example.com/x.js'))})).ok, false)
expect('Read a screenshot without signing in',
  (await call(`${FS}/claim_media/${cM}`,{method:'GET'})).ok, true)

console.log('\n── Seed-account allowlist is gone ──')
// priya@factstamp.app used to bypass nearly every rule via isSeedUser().
const seedy = await mkUserWithEmail('Priya Sharma','priya@factstamp.app')
const cS = await mkClaim(author)
expect('Demo account reads another profile',
  (await call(`${FS}/users/${author.uid}`,{method:'GET',headers:seedy.H})).ok, false)
expect('Demo account lists all profiles',
  (await call(`${FS}/users?pageSize=50`,{method:'GET',headers:seedy.H})).ok, false)
expect('Demo account deletes a claim',
  (await call(`${FS}/claims/${cS}`,{method:'DELETE',headers:seedy.H})).ok, false)
expect('Demo account forges a verified claim',
  (await call(`${FS}/claims/${cS}?${mask('status','verdict','confidenceScore')}`,{method:'PATCH',headers:seedy.H,
    body:JSON.stringify({fields:{status:S('verified'),verdict:S('FALSE'),confidenceScore:I(99)}})})).ok, false)
expect('Demo account grants itself admin',
  (await call(`${FS}/users/${seedy.uid}?${mask('isAdmin')}`,{method:'PATCH',headers:seedy.H,
    body:JSON.stringify({fields:{isAdmin:B(true)}})})).ok, false)

console.log('\n── Profile confidentiality ──')
expect("Read another user's profile",
  (await call(`${FS}/users/${author.uid}`,{method:'GET',headers:att.H})).ok, false)
expect('Read own profile',
  (await call(`${FS}/users/${att.uid}`,{method:'GET',headers:att.H})).ok, true)
expect('List the whole users collection',
  (await call(`${FS}/users?pageSize=50`,{method:'GET',headers:att.H})).ok, false)

console.log(`\n${fail===0?'ALL GREEN':'FAILURES'} — ${pass} passed, ${fail} failed`)
process.exit(fail===0?0:1)
