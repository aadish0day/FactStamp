const AUTH='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const FS=process.env.FS_URL??'http://127.0.0.1:8083/v1/projects/factstamp-app/databases/(default)/documents'
const KEY='fake-api-key'
const call=async(u,o)=>{const r=await fetch(u,{...o,headers:{'Content-Type':'application/json',...(o?.headers||{})}});return{ok:r.ok,status:r.status,body:await r.json().catch(()=>({}))}}
const S=v=>({stringValue:v}),I=v=>({integerValue:String(v)}),B=v=>({booleanValue:v})
let pass=0,fail=0
const expect=(label,got,want)=>{const ok=got===want;ok?pass++:fail++;console.log(`${ok?'  PASS':'**FAIL**'}  ${label.padEnd(52)} ${got?'ALLOWED':'DENIED'} (want ${want?'ALLOWED':'DENIED'})`)}

// Claims and verdicts need email_verified. Mark the account verified with the
// emulator's owner credential, then sign in again so the token carries the claim.
async function verifyEmail(localId,email){
  await call(`${AUTH}/projects/factstamp-app/accounts:update`,{method:'POST',headers:{Authorization:'Bearer owner'},
    body:JSON.stringify({localId,emailVerified:true})})
  const {body}=await call(`${AUTH}/accounts:signInWithPassword?key=${KEY}`,{method:'POST',body:JSON.stringify({email,password:'Passw0rd!23',returnSecureToken:true})})
  return {Authorization:`Bearer ${body.idToken}`}
}

async function mkUser(tag,rep=50,{verified=true}={}){
  const name=tag
  const email=`${tag}${Date.now()}${Math.random().toString(36).slice(2,6)}@example.com`
  const {body}=await call(`${AUTH}/accounts:signUp?key=${KEY}`,{method:'POST',body:JSON.stringify({email,password:'Passw0rd!23',returnSecureToken:true})})
  let H={Authorization:`Bearer ${body.idToken}`}
  // Profile creation must work before verification (sign-up happens first).
  const prof=await call(`${FS}/users?documentId=${body.localId}`,{method:'POST',headers:H,body:JSON.stringify({fields:{
    uid:S(body.localId),displayName:S(tag),email:S(email),reputation:I(rep),totalVerifications:I(0),isAdmin:B(false),joinedAt:S(new Date().toISOString())}})})
  if(verified) H=await verifyEmail(body.localId,email)
  return {uid:body.localId,H,name,email,profileOk:prof.ok}
}

async function mkUserWithEmail(tag,email){
  const {body}=await call(`${AUTH}/accounts:signUp?key=${KEY}`,{method:'POST',body:JSON.stringify({email,password:'Passw0rd!23',returnSecureToken:true})})
  const H={Authorization:`Bearer ${body.idToken}`}
  await call(`${FS}/users?documentId=${body.localId}`,{method:'POST',headers:H,body:JSON.stringify({fields:{
    uid:S(body.localId),displayName:S(tag),email:S(email),reputation:I(50),totalVerifications:I(0),isAdmin:B(false),joinedAt:S(new Date().toISOString())}})})
  return {uid:body.localId,H,name:tag}
}

// New claims no longer carry submittedByName; pass a name only to test that it is refused.
const fields=(uid,ms,name)=>({text:S('This is a seeded test claim about public health policy.'),
  category:S('health'),status:S('pending'),verificationCount:I(0),verifications:{arrayValue:{values:[]}},
  submittedBy:S(uid),...(name?{submittedByName:S(name)}:{}),createdAt:S(new Date().toISOString()),
  consensusDeadline:S(new Date(ms).toISOString()),consensusDeadlineMs:I(ms),imageUrl:S('https://placeholder.com/x.png')})
const mkClaim=async(u,ms=Date.now()+7*864e5)=>{const r=await call(`${FS}/claims`,{method:'POST',headers:u.H,body:JSON.stringify({fields:fields(u.uid,ms)})});return r.ok?r.body.name.split('/').pop():null}
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
  (await call(`${FS}/claims`,{method:'POST',headers:att.H,body:JSON.stringify({fields:fields(att.uid,Date.now()-864e5)})})).ok, false)

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
// What expireOverdueClaims actually changes (updateClaimInFirestore adds serverTime).
const expiry=(extra={})=>({status:S('verified'),verdict:S('CONTESTED'),confidenceScore:I(30),
  agreementRatio:I(0),verifiedAt:S(new Date().toISOString()),serverTime:{timestampValue:new Date().toISOString()},...extra})
const expire=(id,f)=>call(`${FS}/claims/${id}?${mask(...Object.keys(f))}`,{method:'PATCH',headers:att.H,body:JSON.stringify({fields:f})})
const c5=await mkClaim(author, Date.now()+2000)
const cOver=await mkClaim(author, Date.now()+2000)
expect('Expiry BEFORE deadline passes (must be denied)', (await expire(c5,expiry())).ok, false)
await new Promise(r=>setTimeout(r,3500))
expect('Expiry writing only status+verdict (partial)',
  (await expire(c5,{status:S('verified'),verdict:S('CONTESTED')})).ok, false)
expect('Expiry that also sneaks in an extra field',
  (await expire(c5,expiry({confidenceBoost:I(1)}))).ok, false)
expect('Expiry that rewrites avgVerifierReputation',
  (await expire(c5,expiry({avgVerifierReputation:I(99)}))).ok, false)
expect('Expiry AFTER deadline passes -> CONTESTED (full write)', (await expire(c5,expiry())).ok, true)
expect('Verdict on an overdue, still-pending claim',
  (await call(`${FS}/claims/${cOver}?${mask('verifications','verificationCount','status','verdict','confidenceScore')}`,{method:'PATCH',headers:v1.H,
    body:JSON.stringify({fields:{verifications:{arrayValue:{values:[verif(v1)]}},verificationCount:I(1),
      status:S('pending'),verdict:S('TRUE'),confidenceScore:I(60)}})})).ok, true)

expect('Create a normal claim with a valid deadline',
  (await call(`${FS}/claims`,{method:'POST',headers:author.H,body:JSON.stringify({fields:fields(author.uid,Date.now()+7*864e5)})})).ok, true)

console.log('\n── Consensus integrity (must be DENIED) ──')
const patchV=(claimId,u,values,n,status='pending',verdict='TRUE')=>call(`${FS}/claims/${claimId}?${mask('verifications','verificationCount','status','verdict','confidenceScore')}`,
  {method:'PATCH',headers:u.H,body:JSON.stringify({fields:{verifications:{arrayValue:{values}},verificationCount:I(n),
    status:S(status),verdict:S(verdict),confidenceScore:I(60)}})})

// One account must not be able to fill every slot on a claim by itself.
// Fresh verifiers from here on: the reputation function (when the functions
// emulator runs) moves v1-v3 off 50 once c4 settles, and verif() sends 50.
const solo=await mkUser('solo')
const c7=await mkClaim(author)
expect('Solo consensus: 1st verification by v1',
  (await patchV(c7,solo,[verif(solo)],1)).ok, true)
expect('Solo consensus: v1 verifies the same claim twice',
  (await patchV(c7,solo,[verif(solo),verif(solo)],2)).ok, false)

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

console.log('\n── Settling verdict must be the real majority ──')
const settleWith=async(verdicts)=>{
  const c=await mkClaim(author)
  const us=[await mkUser('j1'),await mkUser('j2'),await mkUser('j3')], vs=[]
  for (let i=0;i<2;i++){ vs.push(verif(us[i],verdicts[i])); await patchV(c,us[i],[...vs],i+1,'pending',verdicts[0]) }
  return {c,third:us[2],vs:[...vs,verif(us[2],verdicts[2])]}
}
let s1=await settleWith(['FALSE','FALSE','TRUE'])
expect('3rd verifier settles FALSE,FALSE,TRUE as TRUE',
  (await patchV(s1.c,s1.third,s1.vs,3,'verified','TRUE')).ok, false)
expect('3rd verifier settles FALSE,FALSE,TRUE as FALSE',
  (await patchV(s1.c,s1.third,s1.vs,3,'verified','FALSE')).ok, true)
let s2=await settleWith(['TRUE','FALSE','MISLEADING'])
expect('Three-way split settled as the first verdict',
  (await patchV(s2.c,s2.third,s2.vs,3,'verified','TRUE')).ok, false)
expect('Three-way split settled as CONTESTED',
  (await patchV(s2.c,s2.third,s2.vs,3,'verified','CONTESTED')).ok, true)
expect('Append to a claim already closed as CONTESTED',
  (await patchV(c5,v1,[verif(v1)],1)).ok, false)

console.log('\n── Identity spoofing (must be DENIED) ──')
expect('Submit a claim as "WHO Official"',
  (await call(`${FS}/claims`,{method:'POST',headers:att.H,body:JSON.stringify({fields:fields(att.uid,Date.now()+7*864e5,'WHO Official')})})).ok, false)
expect('Create a claim carrying own submittedByName',
  (await call(`${FS}/claims`,{method:'POST',headers:att.H,body:JSON.stringify({fields:fields(att.uid,Date.now()+7*864e5,att.name)})})).ok, false)
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

console.log('\n── Profile self-edit is an allowlist ──')
const selfPatch=(f)=>call(`${FS}/users/${att.uid}?${mask(...Object.keys(f))}`,{method:'PATCH',headers:att.H,body:JSON.stringify({fields:f})})
expect('Self-add role: "admin"', (await selfPatch({role:S('admin')})).ok, false)
expect('Self-add arbitrary padding field', (await selfPatch({junk:S('x'.repeat(1000))})).ok, false)
expect('Self-rewrite createdAt', (await selfPatch({createdAt:S('2000-01-01T00:00:00Z')})).ok, false)
expect('Rename plus an extra field', (await selfPatch({displayName:S('attacker'),role:S('admin')})).ok, false)
expect('Self-rename (Profile edit-name flow)', (await selfPatch({displayName:S('attacker')})).ok, true)

console.log('\n── Admin-deleted accounts stay deleted ──')
// Stage what deleteUserFromFirestore does (tombstone + profile delete) with the
// emulator's rules-bypassing owner token.
const gone=await mkUser('gone')
const OWNER={Authorization:'Bearer owner'}
await call(`${FS}/deleted_users?documentId=${gone.uid}`,{method:'POST',headers:OWNER,body:JSON.stringify({fields:{deletedAt:S(new Date().toISOString())}})})
await call(`${FS}/users/${gone.uid}`,{method:'DELETE',headers:OWNER})
expect('Deleted account recreates its profile',
  (await call(`${FS}/users?documentId=${gone.uid}`,{method:'POST',headers:gone.H,body:JSON.stringify({fields:{
    uid:S(gone.uid),displayName:S('gone'),email:S(`x@example.com`),reputation:I(50),totalVerifications:I(0),isAdmin:B(false),joinedAt:S(new Date().toISOString())}})})).ok, false)
expect('Deleted account submits a claim',
  (await call(`${FS}/claims`,{method:'POST',headers:gone.H,body:JSON.stringify({fields:fields(gone.uid,Date.now()+7*864e5)})})).ok, false)
expect('Deleted account removes its own tombstone',
  (await call(`${FS}/deleted_users/${gone.uid}`,{method:'DELETE',headers:gone.H})).ok, false)

console.log('\n── Email verification gate (one person, one vote) ──')
const unv=await mkUser('unverified',50,{verified:false})
expect('Unverified user creates own profile', unv.profileOk, true)
expect('Unverified user reads own profile',
  (await call(`${FS}/users/${unv.uid}`,{method:'GET',headers:unv.H})).ok, true)
expect('Unverified user submits a claim',
  (await call(`${FS}/claims`,{method:'POST',headers:unv.H,body:JSON.stringify({fields:fields(unv.uid,Date.now()+7*864e5)})})).ok, false)
const cV=await mkClaim(author)
expect('Unverified user casts a verdict',
  (await patchV(cV,unv,[verif(unv)],1)).ok, false)
const cOver2=await mkClaim(author, Date.now()+1500)
await new Promise(r=>setTimeout(r,2500))
expect('Unverified user expires an overdue claim',
  (await call(`${FS}/claims/${cOver2}?${mask(...Object.keys(expiry()))}`,{method:'PATCH',headers:unv.H,body:JSON.stringify({fields:expiry()})})).ok, false)
expect('Unverified user writes to verdicts subcollection',
  (await call(`${FS}/claims/${cV}/verdicts`,{method:'POST',headers:unv.H,body:JSON.stringify({fields:{
    verifierId:S(unv.uid),claimId:S(cV),explanation:S('x'.repeat(60)),createdAt:S(new Date().toISOString())}})})).ok, false)
// Same account after clicking the link and refreshing its token.
unv.H=await verifyEmail(unv.uid,unv.email)
expect('Same user after verifying submits a claim',
  (await call(`${FS}/claims`,{method:'POST',headers:unv.H,body:JSON.stringify({fields:fields(unv.uid,Date.now()+7*864e5)})})).ok, true)
expect('Same user after verifying casts a verdict',
  (await patchV(cV,unv,[verif(unv)],1)).ok, true)
// Admins are exempt (seeding, moderation) even with an unverified email.
const adm=await mkUser('admin',50,{verified:false})
await call(`${FS}/users/${adm.uid}?${mask('isAdmin')}`,{method:'PATCH',headers:OWNER,body:JSON.stringify({fields:{isAdmin:B(true)}})})
expect('Unverified admin creates a claim',
  (await call(`${FS}/claims`,{method:'POST',headers:adm.H,body:JSON.stringify({fields:fields(adm.uid,Date.now()+7*864e5)})})).ok, true)
expect('Unverified admin overrides a verdict',
  (await call(`${FS}/claims/${cV}?${mask('status','verdict')}`,{method:'PATCH',headers:adm.H,
    body:JSON.stringify({fields:{status:S('verified'),verdict:S('FALSE')}})})).ok, true)

console.log(`\n${fail===0?'ALL GREEN':'FAILURES'} — ${pass} passed, ${fail} failed`)
process.exit(fail===0?0:1)
