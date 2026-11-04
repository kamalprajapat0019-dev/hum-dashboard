import { prisma } from '../src/config/database.js';

async function main() {
  console.log('=== VERIFYING SEEDED HIERARCHY ===\n');

  const clients = await prisma.client.findMany({
    include: {
      projects: {
        include: {
          examTypes: {
            include: {
              exams: {
                include: {
                  dates: {
                    include: {
                      shifts: true,
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  for (const c of clients) {
    console.log(`[CLIENT] ${c.code} - ${c.name} (${c.fullName})`);
    for (const p of c.projects) {
      console.log(`   └── [PROJECT] ${p.projectCode} - ${p.name} (Candidate Target: ${p.candidateTarget})`);
      for (const et of p.examTypes) {
        console.log(`        └── [EXAM TYPE] ${et.examCode} - ${et.examTypeName}`);
        for (const ex of et.exams) {
          console.log(`             └── [EXAM INSTANCE] ${ex.examCode} - ${ex.examName} (${ex.examYear})`);
          for (const d of ex.dates) {
            console.log(`                  └── [DATE] ${d.examDate.toISOString().split('T')[0]} (Reporting: ${d.reportingTime})`);
            for (const s of d.shifts) {
              console.log(`                       └── [SHIFT] Shift ${s.shiftNumber}: ${s.shiftName} (${s.startTime} - ${s.endTime})`);
            }
          }
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
