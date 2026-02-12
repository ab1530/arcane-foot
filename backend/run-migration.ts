import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function migrate() {
  const sql = fs.readFileSync('add-missing-fields.sql', 'utf8');
  const statements = sql.split(';').filter(s => s.trim());

  console.log(`Applying ${statements.length} SQL statements...\n`);

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log('✓ OK:', statement.trim().substring(0, 70) + '...');
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error('✗ ERROR:', error.message);
        }
      }
    }
  }

  console.log('\n✅ Migration completed!');
  await prisma.$disconnect();
}

migrate().catch(console.error);
