#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$PROJECT_DIR/India_runs_data_and_ai_challenge"
SAMPLE_SIZE=80
RANDOM_SEED=42

echo "=== Heimdall Redrob Seeder ==="
echo ""

# 1. Parse JD from docx → temp file
echo "[1/3] Parsing JD from docx..."
python3 -c "
import zipfile, re, sys
with open('$DATA_DIR/job_description.docx', 'rb') as f:
    z = zipfile.ZipFile(f)
    xml = z.read('word/document.xml')
    text = re.sub(r'<[^>]+>', '\n', xml.decode('utf-8'))
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    with open('/tmp/heimdall_jd.txt', 'w') as out:
        out.write(text)
print(f'  JD: {len(text)} chars')
"

# 2. Sample candidates, convert to raw text, calculate initial Elo
echo "[2/3] Sampling $SAMPLE_SIZE candidates & converting..."
export DATA_DIR="$DATA_DIR" SAMPLE_SIZE="$SAMPLE_SIZE" RANDOM_SEED="$RANDOM_SEED"
python3 << 'PYEOF'
import json, random, sys, os, gzip

DATA_DIR = os.environ.get('DATA_DIR', 'India_runs_data_and_ai_challenge')
SAMPLE_SIZE = int(os.environ.get('SAMPLE_SIZE', '80'))
RANDOM_SEED = int(os.environ.get('RANDOM_SEED', '42'))

random.seed(RANDOM_SEED)

data_path = os.path.join(DATA_DIR, 'candidates.jsonl')
gz_path = data_path + '.gz'

if os.path.exists(data_path):
    f = open(data_path)
elif os.path.exists(gz_path):
    f = gzip.open(gz_path, 'rt')
else:
    raise FileNotFoundError(f'Neither {data_path} nor {gz_path} found')

with f:
    lines = [l for l in f.read().split('\n') if l.strip()]

print(f'  Pool: {len(lines)} candidates', file=sys.stderr)

sampled = random.sample(lines, min(SAMPLE_SIZE, len(lines)))
print(f'  Sampled: {len(sampled)}', file=sys.stderr)

def to_raw_text(c):
    p = c['profile']; ch = c['career_history']; edu = c['education']
    skills = c['skills']; certs = c.get('certifications', []); sigs = c['redrob_signals']
    parts = []
    parts.append(f"NAME: {p['anonymized_name']}")
    parts.append(f"HEADLINE: {p['headline']}")
    parts.append(f"CURRENT: {p['current_title']} at {p['current_company']} ({p['current_industry']}, {p['current_company_size']})")
    parts.append(f"LOCATION: {p['location']}, {p['country']}")
    parts.append(f"EXPERIENCE: {p['years_of_experience']} years")
    parts.append(f"SUMMARY: {p['summary']}")
    parts.append("\nCAREER HISTORY:")
    for role in ch[:8]:
        end = 'Present' if role['is_current'] else role['end_date']
        parts.append(f"- {role['title']} at {role['company']} ({role['industry']}, {role['company_size']}) | {role['start_date']} -> {end} ({role['duration_months']}mo)")
        parts.append(f"  {role['description']}")
    parts.append("\nEDUCATION:")
    for e in edu[:4]:
        parts.append(f"- {e['degree']} in {e['field_of_study']} from {e['institution']} ({e['start_year']}-{e['end_year']}) | Tier: {e['tier']} | Grade: {e.get('grade','N/A')}")
    parts.append(f"\nSKILLS ({len(skills)}):")
    for s in skills[:15]:
        parts.append(f"- {s['name']}: {s['proficiency']} ({s['endorsements']} endorsements, {s['duration_months']}mo)")
    if certs:
        parts.append("\nCERTIFICATIONS:")
        for cert in certs[:5]:
            parts.append(f"- {cert['name']} by {cert['issuer']} ({cert['year']})")
    parts.append("\nBEHAVIORAL SIGNALS:")
    parts.append(f"- Profile Completeness: {sigs['profile_completeness_score']}%")
    parts.append(f"- Open to Work: {sigs['open_to_work_flag']}")
    parts.append(f"- GitHub Activity: {sigs['github_activity_score']}/100")
    parts.append(f"- Recruiter Response Rate: {int(sigs['recruiter_response_rate']*100)}%")
    parts.append(f"- Interview Completion: {int(sigs['interview_completion_rate']*100)}%")
    oa = sigs['offer_acceptance_rate']
    parts.append(f"- Offer Acceptance: {'No history' if oa < 0 else f'{int(oa*100)}%'}")
    parts.append(f"- Search Appearances (30d): {sigs['search_appearance_30d']}")
    parts.append(f"- Saved by Recruiters (30d): {sigs['saved_by_recruiters_30d']}")
    parts.append(f"- Notice Period: {sigs['notice_period_days']} days")
    parts.append(f"- Preferred Work Mode: {sigs['preferred_work_mode']}")
    parts.append(f"- Willing to Relocate: {sigs['willing_to_relocate']}")
    sal = sigs['expected_salary_range_inr_lpa']
    parts.append(f"- Salary Range: {sal['min']}-{sal['max']} LPA")
    parts.append(f"- Last Active: {sigs['last_active_date']}")
    return '\n'.join(parts)

def calc_elo(c):
    sigs = c['redrob_signals']; p = c['profile']; skills = c['skills']; ch = c['career_history']
    score = 1500.0
    exp = float(p.get('years_of_experience', 0))
    score += min(exp * 8, 80)
    sig_score = (
        float(sigs['profile_completeness_score']) * 0.5 +
        max(0, float(sigs['github_activity_score'])) * 0.8 +
        float(sigs['search_appearance_30d']) * 0.3 +
        float(sigs['saved_by_recruiters_30d']) * 0.4 +
        float(sigs['recruiter_response_rate']) * 50
    )
    score += sig_score
    ai_kw = ['llm','embedding','vector','rag','transformer','retrieval','ranking','nlp','pytorch','tensorflow','fine-tuning','lora']
    has_ai = any(any(kw in str(s.get('name','')).lower() for kw in ai_kw) for s in skills)
    if has_ai: score += 30
    svc_kw = ['it services','consulting','outsourcing','bpo']
    has_product = any(not any(kw in str(r.get('industry','')).lower() for kw in svc_kw) for r in ch)
    if has_product: score += 20
    return max(1200, min(2000, int(round(score))))

output = []
for i, line in enumerate(sampled):
    c = json.loads(line)
    sigs = c['redrob_signals']
    output.append({
        'id': c['candidate_id'],
        'name': f"{c['profile']['anonymized_name']}",
        'email': f"{c['candidate_id'].lower()}@redrob.example.com",
        'rawText': to_raw_text(c),
        'eloScore': calc_elo(c),
        'structuredData': {
            'headline': c['profile']['headline'],
            'yearsOfExperience': c['profile']['years_of_experience'],
            'currentTitle': c['profile']['current_title'],
            'currentIndustry': c['profile']['current_industry'],
            'skillCount': len(c['skills']),
            'openToWork': sigs['open_to_work_flag'],
        }
    })
    if (i + 1) % 20 == 0:
        print(f'  processed {i+1}/{len(sampled)}', file=sys.stderr)

with open('/tmp/heimdall_candidates.json', 'w') as f:
    json.dump(output, f, ensure_ascii=False)

print(f'  Wrote {len(output)} candidates to /tmp/heimdall_candidates.json', file=sys.stderr)
PYEOF

# 3. Run the TypeScript seed that reads temp files → DB
echo "[3/3] Seeding database..."
cd "$PROJECT_DIR"

# Load env vars for the TS script
export $(grep -v '^#' .env | xargs)

cat > prisma/seed-redrob.ts << 'TSEOF'
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";

const pool = new Pool({
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.tahyzxqfbinemedpabsn",
  password: process.env.SUPABASE_DB_PASSWORD!,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const jdText = fs.readFileSync("/tmp/heimdall_jd.txt", "utf-8").trim();
  const candidates = JSON.parse(fs.readFileSync("/tmp/heimdall_candidates.json", "utf-8"));

  console.log("  Clearing existing data...");
  await prisma.tournamentMatch.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobDescription.deleteMany();

  console.log("  Creating JD...");
  const jd = await prisma.jobDescription.create({
    data: {
      title: "Senior AI Engineer — Founding Team (Redrob AI)",
      rawText: jdText,
      structuredData: {
        requiredSkills: ["embeddings-based retrieval","vector databases","Python","ranking evaluation","LLM","production ML"],
        industry: "AI/Talent Intelligence",
        location: "Pune/Noida, India",
        experienceRange: "5-9 years",
      },
      isActive: true,
    },
  });
  console.log("  JD created:", jd.id);

  console.log("  Inserting", candidates.length, "candidates...");
  for (const c of candidates) {
    await prisma.candidate.create({ data: c });
    process.stdout.write(".");
  }
  console.log();

  const count = await prisma.candidate.count();
  console.log("  Done!", count, "candidates in database.");
  console.log("");
  console.log("  Run: npm run dev → http://localhost:3000 → click Start Tournament");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
TSEOF

npx tsx prisma/seed-redrob.ts 2>&1

# Cleanup
rm -f prisma/seed-redrob.ts

echo ""
echo "=== Done! ==="
echo "npm run dev → open http://localhost:3000 → click Start Tournament"