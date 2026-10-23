import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'file:./data/easyjob.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Initializing database client:', url.startsWith('libsql://') ? 'Turso Cloud SQLite' : url);

export const client = createClient({
  url,
  authToken
});

export const db = {
  // Returns array of objects matching column names
  all: async (sql, args = []) => {
    const res = await client.execute({ sql, args });
    return res.rows;
  },
  // Returns single row object or null
  get: async (sql, args = []) => {
    const res = await client.execute({ sql, args });
    return res.rows.length > 0 ? res.rows[0] : null;
  },
  // Runs insert, update, delete
  run: async (sql, args = []) => {
    const res = await client.execute({ sql, args });
    return {
      lastInsertRowid: res.lastInsertRowid != null ? Number(res.lastInsertRowid) : null,
      changes: res.rowsAffected
    };
  },
  // Execute single SQL statement
  execute: async (sql, args = []) => {
    return client.execute({ sql, args });
  },
  // Execute multiple SQL statements
  exec: async (sql) => {
    return client.executeMultiple(sql);
  },
  // Batch multiple queries in a transaction
  batch: async (statements) => {
    return client.batch(statements);
  }
};

export async function initDatabase() {
  console.log('Verifying tables in database...');

  // Users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      headline TEXT,
      phone TEXT,
      location TEXT,
      bio TEXT,
      resume_url TEXT,
      portfolio_url TEXT,
      github_url TEXT,
      linkedin_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Companies table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website_url TEXT,
      careers_url TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Software Engineering',
      location TEXT DEFAULT 'Remote / Hybrid',
      work_type TEXT DEFAULT 'Full-time',
      tags TEXT,
      status TEXT NOT NULL DEFAULT 'approved',
      submitted_by_user_id INTEGER,
      submitted_by_name TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // User Applications tracking table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'to_apply',
      is_applied INTEGER DEFAULT 0,
      is_interviewed INTEGER DEFAULT 0,
      applied_date DATETIME,
      interview_date DATETIME,
      interview_stage TEXT,
      notes TEXT,
      salary_range TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, company_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
  `);

  // User Stored Links table (Private Links Data Vault)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Job Post',
      status TEXT NOT NULL DEFAULT 'saved',
      notes TEXT,
      tags TEXT,
      clicks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await seedInitialData();
}

async function seedInitialData() {
  const adminEmail = process.env.ADMIN_EMAIL || 'hiramanichauhan2399@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'R@dhe#1234';
  const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);

  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [adminEmail]);

  let adminId;
  if (!existingAdmin) {
    const res = await db.run(`
      INSERT INTO users (name, email, password_hash, role, headline, bio, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Hiramani Chauhan',
      adminEmail,
      adminPasswordHash,
      'admin',
      'Platform Owner & Full Stack Software Engineer',
      'Creator and administrator of EasyJobApplied.',
      'India'
    ]);
    adminId = res.lastInsertRowid;
    console.log(`Configured admin in Turso: ${adminEmail}`);
  } else {
    adminId = existingAdmin.id;
    await db.run(`
      UPDATE users 
      SET 
        role = 'admin',
        name = 'Hiramani Chauhan',
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `, [adminPasswordHash, adminEmail]);
    console.log(`Verified admin credentials in Turso: ${adminEmail}`);
  }

  // Remove unauthorized legacy accounts
  await db.run('DELETE FROM users WHERE email != ? AND id NOT IN (SELECT id FROM users WHERE email = ?)', [adminEmail, adminEmail]);

  // Seed user_links if empty
  const linksCountRow = await db.get('SELECT COUNT(*) as count FROM user_links');
  if (linksCountRow && Number(linksCountRow.count) === 0 && adminId) {
    const defaultLinks = [
      [
        adminId,
        'Google Senior Frontend Role - Dublin/Remote',
        'https://www.google.com/about/careers/applications/jobs/results/',
        'Job Post',
        'applied',
        'Applied via referral from John. Role focuses on Next.js & internal analytics tooling.',
        'Google, Frontend, Next.js'
      ],
      [
        adminId,
        'My Hosted Portfolio & Interactive Resume',
        'https://github.com/hiramanichauhan',
        'Portfolio',
        'saved',
        'Updated with latest 2025 projects, open-source work, and live demos.',
        'Portfolio, GitHub, Resume'
      ],
      [
        adminId,
        'Stripe Careers Engineering Dashboard',
        'https://stripe.com/jobs/search',
        'Application Portal',
        'interviewing',
        'System design interview scheduled for next Thursday.',
        'Stripe, System Design, Payments'
      ],
      [
        adminId,
        'LeetCode 75 Curated Interview Prep Questions',
        'https://leetcode.com/studyplan/leetcode-75/',
        'Interview Prep',
        'saved',
        'Review Graph traversal and Dynamic Programming patterns.',
        'Algorithms, DSA, Prep'
      ]
    ];

    for (const link of defaultLinks) {
      await db.run(`
        INSERT INTO user_links (user_id, title, url, category, status, notes, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, link);
    }
    console.log('Seeded initial user links data in Turso.');
  }

  // Seed companies if empty
  const companyCountRow = await db.get('SELECT COUNT(*) as count FROM companies');
  if (companyCountRow && Number(companyCountRow.count) === 0) {
    console.log('Seeding curated company links in Turso...');

    const curatedCompanies = [
      {
        name: 'Google',
        website_url: 'https://google.com',
        careers_url: 'https://www.google.com/about/careers/applications/jobs/results/',
        description: 'Global technology leader specializing in search, cloud, AI, and consumer software.',
        category: 'Software Engineering',
        location: 'Remote / Global / India',
        work_type: 'Full-time',
        tags: 'FAANG, AI, Cloud, High CTC',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Microsoft',
        website_url: 'https://microsoft.com',
        careers_url: 'https://jobs.careers.microsoft.com/global/en/search',
        description: 'Empowering every person and organization on the planet to achieve more.',
        category: 'Software Engineering',
        location: 'Hybrid / Redmond / India',
        work_type: 'Full-time',
        tags: 'Cloud, Azure, TypeScript, AI',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Amazon',
        website_url: 'https://amazon.com',
        careers_url: 'https://www.amazon.jobs/en/',
        description: 'E-commerce, AWS cloud computing, digital streaming, and artificial intelligence.',
        category: 'Backend',
        location: 'Hybrid / Global / India',
        work_type: 'Full-time',
        tags: 'AWS, Distributed Systems, High Volume',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Stripe',
        website_url: 'https://stripe.com',
        careers_url: 'https://stripe.com/jobs/search',
        description: 'Financial infrastructure for the internet. Millions of businesses use Stripe APIs.',
        category: 'Full Stack',
        location: 'Remote / Global',
        work_type: 'Full-time',
        tags: 'Fintech, APIs, Payments, Remote-first',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Uber',
        website_url: 'https://uber.com',
        careers_url: 'https://www.uber.com/us/en/careers/list/',
        description: 'Mobility as a service, ride-hailing, food delivery, and freight logistics.',
        category: 'Software Engineering',
        location: 'Hybrid / India / US',
        work_type: 'Full-time',
        tags: 'Mobility, Go, Microservices, Scale',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Figma',
        website_url: 'https://figma.com',
        careers_url: 'https://www.figma.com/careers/',
        description: 'Collaborative web-based interface design tool built with WebAssembly and WebGL.',
        category: 'Frontend',
        location: 'Remote / US / UK',
        work_type: 'Full-time',
        tags: 'Frontend, WebAssembly, UI/UX, Design',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Atlassian',
        website_url: 'https://atlassian.com',
        careers_url: 'https://www.atlassian.com/company/careers/all-jobs',
        description: 'Makers of Jira, Confluence, Trello, and Bitbucket. TEAM Anywhere policy.',
        category: 'Full Stack',
        location: 'Remote Anywhere',
        work_type: 'Full-time',
        tags: 'Remote, React, Java, SaaS',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Canva',
        website_url: 'https://canva.com',
        careers_url: 'https://www.canva.com/careers/jobs/',
        description: 'Empowering the world to design. Online visual communications platform.',
        category: 'Frontend',
        location: 'Hybrid / Sydney / Remote',
        work_type: 'Full-time',
        tags: 'Canvas, TypeScript, Graphic Design',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Razorpay',
        website_url: 'https://razorpay.com',
        careers_url: 'https://razorpay.com/jobs/',
        description: 'India’s leading full-stack financial solutions and payment gateway company.',
        category: 'Backend',
        location: 'Bangalore / Hybrid',
        work_type: 'Full-time',
        tags: 'Fintech, India, Golang, High Scale',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Databricks',
        website_url: 'https://databricks.com',
        careers_url: 'https://www.databricks.com/company/careers',
        description: 'Data and AI company, creators of Apache Spark, Delta Lake, and MLflow.',
        category: 'AI / ML',
        location: 'Remote / US / India',
        work_type: 'Full-time',
        tags: 'Data, Spark, Python, Big Data',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Zomato & Blinkit',
        website_url: 'https://zomato.com',
        careers_url: 'https://www.zomato.com/careers',
        description: 'Quick commerce and food delivery platform connecting millions of diners daily.',
        category: 'Full Stack',
        location: 'Gurgaon / Hybrid',
        work_type: 'Full-time',
        tags: 'E-commerce, Consumer Tech, Node.js',
        status: 'approved',
        submitted_by_name: 'Admin'
      },
      {
        name: 'Swiggy',
        website_url: 'https://swiggy.com',
        careers_url: 'https://careers.swiggy.com/',
        description: 'Convenience delivery platform delivering food, groceries, and dining out in India.',
        category: 'Backend',
        location: 'Bangalore / Remote',
        work_type: 'Full-time',
        tags: 'Logistics, Golang, React Native, High Scale',
        status: 'approved',
        submitted_by_name: 'Admin'
      }
    ];

    for (const comp of curatedCompanies) {
      await db.run(`
        INSERT INTO companies (name, website_url, careers_url, description, category, location, work_type, tags, status, submitted_by_user_id, submitted_by_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        comp.name,
        comp.website_url,
        comp.careers_url,
        comp.description,
        comp.category,
        comp.location,
        comp.work_type,
        comp.tags,
        comp.status,
        null,
        comp.submitted_by_name
      ]);
    }

    const pendingCompanies = [
      {
        name: 'Notion',
        website_url: 'https://notion.so',
        careers_url: 'https://www.notion.so/careers',
        description: 'The all-in-one workspace for notes, docs, project management, and AI knowledge base.',
        category: 'Software Engineering',
        location: 'Remote / San Francisco',
        work_type: 'Full-time',
        tags: 'Productivity, React, TypeScript',
        status: 'pending',
        submitted_by_user_id: null,
        submitted_by_name: 'Applicant'
      },
      {
        name: 'Postman',
        website_url: 'https://postman.com',
        careers_url: 'https://www.postman.com/company/careers/',
        description: 'The leading API platform used by over 30 million developers worldwide.',
        category: 'Backend',
        location: 'Hybrid / Bangalore / San Francisco',
        work_type: 'Full-time',
        tags: 'APIs, Developer Tools, Node.js',
        status: 'pending',
        submitted_by_user_id: null,
        submitted_by_name: 'Applicant'
      }
    ];

    for (const comp of pendingCompanies) {
      await db.run(`
        INSERT INTO companies (name, website_url, careers_url, description, category, location, work_type, tags, status, submitted_by_user_id, submitted_by_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        comp.name,
        comp.website_url,
        comp.careers_url,
        comp.description,
        comp.category,
        comp.location,
        comp.work_type,
        comp.tags,
        comp.status,
        null,
        comp.submitted_by_name
      ]);
    }

    console.log('Seeded curated companies in Turso.');
  }
}
