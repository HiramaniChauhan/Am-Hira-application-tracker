# 🚀 Am Hira — Job Application Tracker & Links Vault

> A fullstack job application tracker with a curated company directory, private user links vault, customizable profile, application status tracking, and a zero-configuration SQLite database.

---

## ⚡ Quick Start (Run Both Backend & Frontend)

From the project root directory, run:

```bash
npm run dev
```

This single command starts **both** servers concurrently:
- **Frontend**: [http://127.0.0.1:5174](http://127.0.0.1:5174) (Vite + React + Tailwind CSS)
- **Backend API**: [http://127.0.0.1:5005](http://127.0.0.1:5005) (Node.js + Express)
- **Database**: SQLite (Stored locally at `backend/data/easyjob.db`)

---

## ✨ Key Features

1. **Company Directory & Job Pipeline**:
   - Curated list of verified company career pages.
   - **`[✓] Applied`**: Track companies where you have submitted applications.
   - **`[🎯] Interviewed`**: Track companies currently in interview stages.
   - **`[⏳] To Apply`**: Curated companies queued to apply.

2. **Links Vault (Personal Stored Links in SQLite)**:
   - Private personal link repository for job posts, application portals, resumes, portfolios, and interview prep.
   - Category filtering, real-time search, click tracker, and notes.

3. **User Profile & Links Data**:
   - Profile modal for managing headline, bio, location, resume URL, portfolio, GitHub, and LinkedIn links.
   - In-app password change securely verified and updated via bcrypt in SQLite.

4. **Admin Moderation & Multi-Select Bulk Delete**:
   - **Post a Job**: Direct live submission for admins; user submissions route to **Approvals** moderation queue.
   - **My Post**: Track submission status (Pending, Approved, Rejected).
   - **Multi-Select Company Deletion**: Click **"Select"** to manually choose multiple companies with checkboxes (never auto-selects by default) and delete them in one atomic transaction.

5. **100% Free Persistent SQLite Database**:
   - Zero external cloud services, zero credit cards, zero configuration. Powered by `better-sqlite3`.

---

## 🔐 Security & Database

- User passwords hashed using 10-round `bcrypt`.
- JWT session tokens for stateless authentication.
- No credentials or sensitive tokens stored in frontend code.

