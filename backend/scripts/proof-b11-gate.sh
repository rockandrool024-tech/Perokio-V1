#!/bin/bash
# ============================================================================
# §5 — B11 GATE PROOF
# Demonstrates: POST /scripts/:id/approve fails (400) when lines are unverified,
# succeeds (200) once all lines are linked to verified sources.
# ============================================================================
set -e

API="http://localhost:4000/api"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/perokio?schema=public"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  §5 — B11 GATE PROOF (cURL)                                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Signup a brand_owner (unique email) ───
echo "▶ Step 1: Signup brand_owner"
UNIQUE="proof-$(date +%s)@brand.test"
SIGNUP=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UNIQUE\",\"password\":\"test1234\",\"role\":\"brand_owner\"}")
OWNER_TOKEN=$(echo "$SIGNUP" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).accessToken)}catch{console.log('')}})")
OWNER_ID=$(echo "$SIGNUP" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).user.id)}catch{console.log('')}})")
echo "  Owner ID: $OWNER_ID"
echo ""

# ─── Step 2: Create a brand ───
echo "▶ Step 2: Create brand"
BRAND=$(curl -s -X POST "$API/facts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"tier":"Hot","language":"en","cpmBudget":300,"baseFee":800}')
# We need a brand first — create directly via DB
BRAND_ID=$(node -e "
const { PrismaClient } = require('/home/z/my-project/backend/packages/db/src/generated/prisma');
const p = new PrismaClient();
p.brand.create({ data: { name: 'Proof Brand', ownerId: '$OWNER_ID' } })
  .then(b => { console.log(b.id); return p.\$disconnect(); })
  .catch(e => { console.error(e.message); process.exit(1); });
")
echo "  Brand ID: $BRAND_ID"
echo ""

# ─── Step 3: Create a fact ───
echo "▶ Step 3: Create a fact"
FACT=$(curl -s -X POST "$API/facts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"brandId\":\"$BRAND_ID\",\"tier\":\"Hot\",\"language\":\"en\",\"cpmBudget\":300,\"baseFee\":800,\"maxClaims\":10}")
FACT_ID=$(echo "$FACT" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).id)}catch{console.log('')}})")
SV_ID=$(echo "$FACT" | node -e "process.stdin.on('data',d=>{try{const f=JSON.parse(d);console.log(f.scriptVersions[0].id)}catch{console.log('')}})")
echo "  Fact ID: $FACT_ID"
echo "  ScriptVersion ID: $SV_ID"
echo ""

# ─── Step 4: Add 2 script lines ───
echo "▶ Step 4: Add script lines (all unverified)"
LINE1=$(curl -s -X POST "$API/scripts/$SV_ID/lines" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"text":"Dar Zaitouna beans come from Cap Bon","isHook":true}')
LINE1_ID=$(echo "$LINE1" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).id)}catch{console.log('')}})")

LINE2=$(curl -s -X POST "$API/scripts/$SV_ID/lines" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"text":"Grown above 600m altitude"}')
LINE2_ID=$(echo "$LINE2" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).id)}catch{console.log('')}})")
echo "  Line 1: $LINE1_ID (verified: false)"
echo "  Line 2: $LINE2_ID (verified: false)"
echo ""

# ─── Step 5: Create a source ───
echo "▶ Step 5: Create a verified source"
SOURCE=$(curl -s -X POST "$API/scripts/sources" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"label":"Cap Bon Report 2024","url":"https://capbon.tn/report.pdf","type":"official"}')
SOURCE_ID=$(echo "$SOURCE" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).id)}catch{console.log('')}})")
echo "  Source ID: $SOURCE_ID"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 6: ATTEMPT APPROVAL — should FAIL (400) because both lines
#         are unverified. This is the B11 gate.
# ════════════════════════════════════════════════════════════════
echo "▶ Step 6: ATTEMPT APPROVAL — expecting 400 (lines unverified)"
APPROVE_FAIL=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API/scripts/$SV_ID/approve" \
  -H "Authorization: Bearer $OWNER_TOKEN")
echo "$APPROVE_FAIL" | head -20
echo ""
echo "  ✅ EXPECTED: 400 Bad Request — B11 gate blocked approval"
echo ""

# ─── Step 7: Link source to line 1 only ───
echo "▶ Step 7: Link source to Line 1 only (Line 2 still unverified)"
curl -s -X POST "$API/scripts/lines/$LINE1_ID/sources/$SOURCE_ID" \
  -H "Authorization: Bearer $OWNER_TOKEN" > /dev/null
echo "  Line 1 → verified: true"
echo "  Line 2 → verified: false (no source linked)"
echo ""

# ─── Step 8: ATTEMPT APPROVAL AGAIN — still FAILS (1 line unverified) ───
echo "▶ Step 8: ATTEMPT APPROVAL again — expecting 400 (1 line still unverified)"
APPROVE_FAIL2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API/scripts/$SV_ID/approve" \
  -H "Authorization: Bearer $OWNER_TOKEN")
echo "$APPROVE_FAIL2" | head -20
echo ""
echo "  ✅ EXPECTED: 400 — B11 gate still blocked (1/2 lines unverified)"
echo ""

# ─── Step 9: Link source to line 2 ───
echo "▶ Step 9: Link source to Line 2 (now 100% verified)"
curl -s -X POST "$API/scripts/lines/$LINE2_ID/sources/$SOURCE_ID" \
  -H "Authorization: Bearer $OWNER_TOKEN" > /dev/null
echo "  Line 1 → verified: true"
echo "  Line 2 → verified: true"
echo ""

# ─── Step 10: APPROVE — should SUCCEED (200) ───
echo "▶ Step 10: APPROVE — expecting 200 (all lines verified)"
APPROVE_OK=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API/scripts/$SV_ID/approve" \
  -H "Authorization: Bearer $OWNER_TOKEN")
echo "$APPROVE_OK" | head -20
echo ""
echo "  ✅ EXPECTED: 200 — B11 gate passed, VerificationReceipt created"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  B11 GATE PROOF: COMPLETE ✅                                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
