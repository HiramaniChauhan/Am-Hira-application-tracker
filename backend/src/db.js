import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'easyjob.db');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  console.log('Initializing SQLite database at', dbPath);

  // Users table
  db.exec(`
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

  // Run migrations to ensure all user data columns exist in existing databases
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('headline')) db.exec("ALTER TABLE users ADD COLUMN headline TEXT;");
  if (!userCols.includes('phone')) db.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
  if (!userCols.includes('location')) db.exec("ALTER TABLE users ADD COLUMN location TEXT;");
  if (!userCols.includes('bio')) db.exec("ALTER TABLE users ADD COLUMN bio TEXT;");
  if (!userCols.includes('resume_url')) db.exec("ALTER TABLE users ADD COLUMN resume_url TEXT;");
  if (!userCols.includes('portfolio_url')) db.exec("ALTER TABLE users ADD COLUMN portfolio_url TEXT;");
  if (!userCols.includes('github_url')) db.exec("ALTER TABLE users ADD COLUMN github_url TEXT;");
  if (!userCols.includes('linkedin_url')) db.exec("ALTER TABLE users ADD COLUMN linkedin_url TEXT;");
  if (!userCols.includes('updated_at')) db.exec("ALTER TABLE users ADD COLUMN updated_at DATETIME;");

  // Companies table
  db.exec(`
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
      status TEXT NOT NULL DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
      submitted_by_user_id INTEGER,
      submitted_by_name TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // User Applications tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'to_apply', -- 'to_apply', 'applied', 'interviewing', 'offered', 'rejected'
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

  // User Stored Links table (Private Links Data Vault in SQLite)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Job Post', -- 'Job Post', 'Application Portal', 'Resume & Docs', 'Portfolio', 'Interview Prep', 'Company Site', 'Other'
      status TEXT NOT NULL DEFAULT 'saved', -- 'saved', 'applied', 'interviewing', 'done', 'archived'
      notes TEXT,
      tags TEXT,
      clicks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // 1. Seed default accounts if they do not exist
  const findUserByEmail = db.prepare('SELECT id FROM users WHERE email = ?');
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, headline, bio, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Seed default Admin account (Hiramani Chauhan) securely in SQLite database
  const adminEmail = process.env.ADMIN_EMAIL || 'hiramanichauhan2399@gmail.com';
  let adminUser = findUserByEmail.get(adminEmail);
  // Default bcrypt hash for secure initialization without exposing plaintext credentials in repository
  const adminPasswordHash = process.env.ADMIN_PASSWORD
    ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)
    : '$2a$10$YCuBtqLJN1jN.kzNh36TquNt07LJiku3bOTAZcoLynaEYof0lZw4u';

  if (!adminUser) {
    const res = insertUser.run(
      'Hiramani Chauhan',
      adminEmail,
      adminPasswordHash,
      'admin',
      'Platform Owner & Full Stack Software Engineer',
      'Creator and administrator of EasyJobApplied.',
      'India'
    );
    adminUser = { id: res.lastInsertRowid };
    console.log(`Configured admin in SQLite: ${adminEmail}`);
  } else {
    // Ensure admin role and updated password hash
    db.prepare(`
      UPDATE users 
      SET 
        role = 'admin',
        name = 'Hiramani Chauhan',
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).run(adminPasswordHash, adminEmail);
    console.log(`Verified admin credentials in SQLite: ${adminEmail}`);
  }

  // Remove any unauthorized legacy accounts
  db.prepare(`
    DELETE FROM users 
    WHERE email != ? AND id NOT IN (SELECT id FROM users WHERE email = ?)
  `).run(adminEmail, adminEmail);

  // 2. Seed initial stored links for admin user if user_links is empty
  const linksCount = db.prepare('SELECT COUNT(*) as count FROM user_links').get().count;
  if (linksCount === 0 && adminUser) {
    const insertLink = db.prepare(`
      INSERT INTO user_links (user_id, title, url, category, status, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertLink.run(
      adminUser.id,
      'Google Senior Frontend Role - Dublin/Remote',
      'https://www.google.com/about/careers/applications/jobs/results/',
      'Job Post',
      'applied',
      'Applied via referral from John. Role focuses on Next.js & internal analytics tooling.',
      'Google, Frontend, Next.js'
    );

    insertLink.run(
      adminUser.id,
      'My Hosted Portfolio & Interactive Resume',
      'https://github.com/hiramanichauhan',
      'Portfolio',
      'saved',
      'Updated with latest 2025 projects, open-source work, and live demos.',
      'Portfolio, GitHub, Resume'
    );

    insertLink.run(
      adminUser.id,
      'Stripe Careers Engineering Dashboard',
      'https://stripe.com/jobs/search',
      'Application Portal',
      'interviewing',
      'System design interview scheduled for next Thursday.',
      'Stripe, System Design, Payments'
    );

    insertLink.run(
      adminUser.id,
      'LeetCode 75 Curated Interview Prep Questions',
      'https://leetcode.com/studyplan/leetcode-75/',
      'Interview Prep',
      'saved',
      'Review Graph traversal and Dynamic Programming patterns.',
      'Algorithms, DSA, Prep'
    );

    console.log('Seeded initial user links data in SQLite.');
  }

  // 3. Seed curated companies if empty
  const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  if (companyCount === 0) {
    console.log('Seeding curated company links and pending submissions...');

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

    const insertCompany = db.prepare(`
      INSERT INTO companies (name, website_url, careers_url, description, category, location, work_type, tags, status, submitted_by_user_id, submitted_by_name)
      VALUES (@name, @website_url, @careers_url, @description, @category, @location, @work_type, @tags, @status, @submitted_by_user_id, @submitted_by_name)
    `);

    for (const comp of curatedCompanies) {
      insertCompany.run({
        ...comp,
        submitted_by_user_id: null
      });
    }

    // Insert 2 pending submissions so Admin can test the validation & approval flow right away!
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
      insertCompany.run(comp);
    }

    console.log('Seeded curated companies.');
  }
}
