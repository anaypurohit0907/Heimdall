import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.tahyzxqfbinemedpabsn",
  password: process.env.SUPABASE_DB_PASSWORD!,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const MOCK_JD = {
  title: "Senior Full-Stack TypeScript Engineer",
  rawText: `
    Senior Full-Stack TypeScript Engineer - Heimdall Technologies
    
    About Us: We build next-generation developer tools and AI-powered platforms.
    
    Requirements:
    - 5+ years of professional software engineering experience
    - Expert-level TypeScript and Node.js proficiency
    - Deep experience with React 18+ and Next.js App Router
    - Strong SQL and database design skills (PostgreSQL preferred)
    - Experience with AI/LLM integration (OpenAI, Anthropic, or Google AI)
    - System design and architecture experience
    - Experience building real-time collaborative applications
    - Strong CS fundamentals: data structures, algorithms, distributed systems
    - Excellent written communication and documentation skills
    
    Nice to Have:
    - Experience with Prisma or Drizzle ORM
    - WebSocket / Server-Sent Events experience
    - Open-source contributions
    - Experience with tournament/ranking algorithms (Elo, Glicko)
    - DevOps: Docker, Kubernetes, CI/CD pipelines
    
    Tech Stack: TypeScript, React, Next.js, PostgreSQL, Redis, Docker, Google Cloud
  `,
};

const MOCK_CANDIDATES = [
  {
    name: "Aria Chen",
    email: "aria.chen@example.com",
    rawText: `
      Aria Chen - Senior Software Engineer
      
      Experience:
      - 7 years at Stripe as Senior Full-Stack Engineer (2020-2027)
        - Led migration of dashboard from REST to GraphQL, reducing payload sizes by 40%
        - Built real-time payment monitoring system with WebSockets handling 50K events/sec
        - Implemented feature flags system used by 200+ engineers
      - 3 years at Shopify as Full-Stack Developer (2017-2020)
        - Built merchant analytics dashboard using React + D3
        - Designed PostgreSQL schema for multi-tenant order management
      
      Skills: TypeScript, React, Next.js, GraphQL, PostgreSQL, Redis, Docker, Kubernetes
      Education: B.S. Computer Science, MIT (2017)
      
      GitHub: github.com/ariachen (2.3K followers, core contributor to tRPC)
      Open Source: Maintains popular React state management library (5K+ stars)
    `,
    structuredData: {
      yearsExperience: 10,
      topSkills: ["TypeScript", "React", "PostgreSQL", "Distributed Systems", "GraphQL"],
      education: "B.S. CS, MIT",
      companies: ["Stripe", "Shopify"],
      openSourceContributions: 3,
    },
    eloScore: 1650,
  },
  {
    name: "Marcus Rodriguez",
    email: "marcus.r@example.com",
    rawText: `
      Marcus Rodriguez - Staff Software Engineer
      
      Experience:
      - 5 years at Vercel as Staff Engineer (2022-2027)
        - Core contributor to Next.js (200+ merged PRs)
        - Designed and implemented the App Router streaming architecture
        - Built internal A/B testing infrastructure handling 10M+ daily requests
        - Mentored 15 junior engineers through formal program
      - 4 years at Meta as Senior Frontend Engineer (2018-2022)
        - Led React Server Components exploration team
        - Built internal UI component library used by 5000+ Meta engineers
        - Optimized News Feed rendering pipeline reducing Time-to-Interactive by 35%
      
      Skills: TypeScript, React, Next.js, Rust, WebAssembly, PostgreSQL, Edge Computing
      Education: M.S. Computer Science, Stanford (2018)
      
      GitHub: github.com/m-rodriguez (8.7K followers)
      Talks: React Conf 2025, Next.js Conf 2024, RustConf 2023
    `,
    structuredData: {
      yearsExperience: 9,
      topSkills: ["React", "Next.js", "TypeScript", "Rust", "System Design"],
      education: "M.S. CS, Stanford",
      companies: ["Vercel", "Meta"],
      openSourceContributions: 200,
    },
    eloScore: 1700,
  },
  {
    name: "Priya Kapoor",
    email: "priya.kapoor@example.com",
    rawText: `
      Priya Kapoor - Full-Stack Developer
      
      Experience:
      - 3 years at Fastly as Software Engineer (2024-2027)
        - Built edge-compute platform dashboard using Next.js 14 App Router
        - Implemented real-time CDN analytics with Server-Sent Events
        - Reduced bundle size by 60% through code-splitting and tree-shaking
      - 2 years at Zoho as Junior Developer (2022-2024)
        - Built internal CRM features with React and Node.js
        - Wrote PostgreSQL migrations and complex queries for reporting module
        - Implemented JWT-based authentication system
      
      Skills: TypeScript, React, Next.js, Node.js, PostgreSQL, SSE, Tailwind CSS
      Education: B.Tech Computer Science, IIT Madras (2022)
      
      GitHub: github.com/priyakapoor (400 stars on personal projects)
      Side Projects: Built open-source WebSocket testing tool (300+ weekly downloads)
    `,
    structuredData: {
      yearsExperience: 5,
      topSkills: ["TypeScript", "React", "Next.js", "PostgreSQL", "Node.js"],
      education: "B.Tech CS, IIT Madras",
      companies: ["Fastly", "Zoho"],
      openSourceContributions: 1,
    },
    eloScore: 1550,
  },
  {
    name: "James O'Brien",
    email: "james.obrien@example.com",
    rawText: `
      James O'Brien - Senior Platform Engineer
      
      Experience:
      - 8 years at GitHub as Senior Platform Engineer (2019-2027)
        - Designed and built GitHub Codespaces networking layer
        - Led project to migrate legacy Ruby services to TypeScript/Node.js
        - Built internal Kubernetes operators managing 50K+ pods
        - Implemented distributed tracing across 200+ microservices
      - 4 years at Heroku as Platform Engineer (2015-2019)
        - Built the Heroku Redis add-on serving 100K+ customers
        - Designed PostgreSQL connection pooling system
      
      Skills: TypeScript, Kubernetes, PostgreSQL, Go, Ruby, Docker, Distributed Systems
      Education: B.S. Computer Engineering, University of Waterloo (2015)
      
      GitHub: github.com/jobrien (1.2K followers)
      Certifications: CKA, CKAD, AWS Solutions Architect Professional
    `,
    structuredData: {
      yearsExperience: 12,
      topSkills: ["Kubernetes", "TypeScript", "PostgreSQL", "Distributed Systems", "Docker"],
      education: "B.S. CE, Waterloo",
      companies: ["GitHub", "Heroku"],
      openSourceContributions: 0,
    },
    eloScore: 1620,
  },
  {
    name: "Sarah Al-Rashid",
    email: "sarah.ar@example.com",
    rawText: `
      Sarah Al-Rashid - AI/ML Engineer turned Full-Stack
      
      Experience:
      - 4 years at Anthropic as AI Platform Engineer (2023-2027)
        - Built internal tools for RLHF data pipeline management
        - Designed prompt evaluation framework used by 50+ researchers
        - Created developer dashboard for model deployment tracking
      - 2 years at Google AI as Software Engineer (2021-2023)
        - Worked on Gemini API infrastructure
        - Built real-time model monitoring dashboards with Next.js
      
      Skills: TypeScript, React, Python, PyTorch, PostgreSQL, Google Cloud, LLM Integration
      Education: M.S. Machine Learning, Carnegie Mellon (2021), B.S. CS, UC Berkeley (2019)
      
      GitHub: github.com/sarah-alrashid (3.1K followers)
      Publications: 3 papers on RLHF techniques (NeurIPS, ICML)
      Patents: 2 pending patents on prompt optimization
    `,
    structuredData: {
      yearsExperience: 6,
      topSkills: ["TypeScript", "AI/LLM", "Python", "React", "PostgreSQL"],
      education: "M.S. ML, CMU / B.S. CS, UC Berkeley",
      companies: ["Anthropic", "Google AI"],
      openSourceContributions: 0,
    },
    eloScore: 1680,
  },
  {
    name: "Carlos Mendez",
    email: "carlos.m@example.com",
    rawText: `
      Carlos Mendez - Frontend Engineer
      
      Experience:
      - 3 years at Linear as Frontend Engineer (2024-2027)
        - Built real-time collaborative editor with CRDT-based sync
        - Implemented virtual scrolling for lists with 100K+ items
        - Optimized React rendering pipeline reducing re-renders by 70%
      - 1 year at Notion as Frontend Intern (2023-2024)
        - Built table view component handling 10K+ cells
      
      Skills: TypeScript, React, Next.js, CRDT, Web Performance, Tailwind CSS, Prisma
      Education: B.S. Computer Science, UCLA (2023)
      
      GitHub: github.com/cmendez (800 followers)
      Side Projects: Built a React state management library with 1K+ GitHub stars
    `,
    structuredData: {
      yearsExperience: 4,
      topSkills: ["React", "TypeScript", "Next.js", "CRDT", "Web Performance"],
      education: "B.S. CS, UCLA",
      companies: ["Linear", "Notion"],
      openSourceContributions: 1,
    },
    eloScore: 1520,
  },
  {
    name: "Yuki Tanaka",
    email: "yuki.t@example.com",
    rawText: `
      Yuki Tanaka - Backend Engineer
      
      Experience:
      - 6 years at Datadog as Senior Backend Engineer (2021-2027)
        - Built distributed tracing ingestion pipeline handling 1M+ spans/sec
        - Designed PostgreSQL sharding strategy for time-series data
        - Implemented Redis caching layer reducing P99 latency by 80%
      - 2 years at Mercari as Backend Engineer (2019-2021)
        - Built payment processing system with Node.js
        - Designed REST API serving 5M+ daily requests
      
      Skills: TypeScript, Node.js, PostgreSQL, Redis, Kafka, Docker, System Design
      Education: M.S. Information Science, University of Tokyo (2019)
      
      GitHub: github.com/ytanaka (600 followers)
      Speaking: PostgreSQL Conference 2025, NodeConf 2024
    `,
    structuredData: {
      yearsExperience: 8,
      topSkills: ["PostgreSQL", "Node.js", "TypeScript", "Redis", "Distributed Systems"],
      education: "M.S. Info Science, UTokyo",
      companies: ["Datadog", "Mercari"],
      openSourceContributions: 0,
    },
    eloScore: 1600,
  },
  {
    name: "Emma Johansson",
    email: "emma.j@example.com",
    rawText: `
      Emma Johansson - Junior Full-Stack Developer
      
      Experience:
      - 1.5 years at Klarna as Junior Developer (2025-2027)
        - Built merchant-facing dashboard with React and Node.js
        - Wrote unit and integration tests achieving 85% coverage
        - Fixed 150+ bugs across the merchant platform
      - 6 months internship at Spotify (2024)
        - Built internal playlist analytics tool
      
      Skills: JavaScript, React, Node.js, PostgreSQL, CSS, HTML, Git
      Education: B.S. Software Engineering, KTH Royal Institute of Technology (2025)
      
      GitHub: github.com/emmaj (200 followers)
      Bootcamp: Completed Full-Stack Open 2024 (University of Helsinki)
    `,
    structuredData: {
      yearsExperience: 2,
      topSkills: ["JavaScript", "React", "Node.js", "PostgreSQL", "CSS"],
      education: "B.S. SE, KTH",
      companies: ["Klarna", "Spotify"],
      openSourceContributions: 0,
    },
    eloScore: 1400,
  },
  {
    name: "David Park",
    email: "david.park@example.com",
    rawText: `
      David Park - Principal Engineer & Tech Lead
      
      Experience:
      - 6 years at Airbnb as Principal Engineer (2021-2027)
        - Led architecture for Airbnb's search platform handling 500M+ queries/day
        - Migrated monolith to microservices serving 200+ engineering teams
        - Designed real-time pricing engine with Kafka streaming
      - 5 years at Netflix as Senior Engineer (2016-2021)
        - Built Netflix's content recommendation serving infrastructure
        - Implemented A/B testing framework used across all Netflix products
      - 3 years at Amazon as SDE II (2013-2016)
        - Built AWS billing system processing $1B+ monthly
      
      Skills: TypeScript, Java, Python, PostgreSQL, Kafka, Kubernetes, System Design, Leadership
      Education: M.S. Computer Science, Georgia Tech (2013), B.S. CS, University of Washington (2011)
      
      GitHub: github.com/dpark (4.5K followers)
      Patents: 5 granted patents on distributed systems
      Advisory: Technical advisor for 3 YC startups
    `,
    structuredData: {
      yearsExperience: 14,
      topSkills: ["System Design", "TypeScript", "PostgreSQL", "Kafka", "Leadership"],
      education: "M.S. CS, Georgia Tech",
      companies: ["Airbnb", "Netflix", "Amazon"],
      openSourceContributions: 5,
    },
    eloScore: 1750,
  },
  {
    name: "Nadia Petrova",
    email: "nadia.p@example.com",
    rawText: `
      Nadia Petrova - DevOps/Platform Engineer
      
      Experience:
      - 4 years at GitLab as Senior DevOps Engineer (2023-2027)
        - Built GitLab CI/CD pipeline optimization engine
        - Managed Kubernetes clusters with 10K+ nodes across 5 regions
        - Implemented zero-downtime deployment strategy adopted company-wide
      - 3 years at DigitalOcean as DevOps Engineer (2020-2023)
        - Built monitoring and alerting infrastructure for Droplet platform
        - Automated provisioning reducing deployment time from 2 hours to 3 minutes
      
      Skills: Docker, Kubernetes, TypeScript, Go, PostgreSQL, Terraform, CI/CD, Google Cloud
      Education: B.S. Computer Science, University of Moscow (2019)
      
      GitHub: github.com/nadia-p (1.8K followers)
      Certifications: CKA, CKAD, CKS, Google Cloud Professional DevOps Engineer
      Blog: devopsweekly.substack.com (15K subscribers)
    `,
    structuredData: {
      yearsExperience: 7,
      topSkills: ["Kubernetes", "Docker", "TypeScript", "Terraform", "CI/CD"],
      education: "B.S. CS, U. Moscow",
      companies: ["GitLab", "DigitalOcean"],
      openSourceContributions: 0,
    },
    eloScore: 1580,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.tournamentMatch.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobDescription.deleteMany();

  console.log("Cleared existing data.");

  const jd = await prisma.jobDescription.create({
    data: {
      title: MOCK_JD.title,
      rawText: MOCK_JD.rawText,
      structuredData: {
        requiredSkills: [
          "TypeScript",
          "React",
          "Next.js",
          "PostgreSQL",
          "Node.js",
          "System Design",
        ],
        niceToHave: ["Prisma ORM", "WebSocket/SSE", "Open Source", "Docker/Kubernetes"],
        minYearsExperience: 5,
      },
      isActive: true,
    },
  });

  console.log(`Created JD: ${jd.title} (${jd.id})`);

  for (const c of MOCK_CANDIDATES) {
    const candidate = await prisma.candidate.create({
      data: {
        name: c.name,
        email: c.email,
        rawText: c.rawText,
        structuredData: c.structuredData,
        eloScore: c.eloScore,
      },
    });
    console.log(`  ✓ ${candidate.name} (Elo: ${candidate.eloScore})`);
  }

  const count = await prisma.candidate.count();
  console.log(`\n✅ Done! ${count} candidates seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
