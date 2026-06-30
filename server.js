const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'backend/database.json');

// ─── In-Memory Database (persists across requests, resets on restart) ───────
// Load from file once at startup; Render's free tier has ephemeral FS
let memDb = null;

function getSeedData() {
  return {
    "users": [
      { "username": "admin", "email": "admin@12345", "password": "admin@12345", "role": "admin", "name": "System Administrator" }
    ],
    "jobs": [
      { "id": "job-1", "title": "Senior React Developer", "company": "TechCorp India", "location": "Remote - India", "salary": "₹18L - ₹25L LPA", "posted": "2 days ago", "industry": "Technology", "skills": ["React", "TypeScript", "Node.js"], "description": "Build next-gen web apps." },
      { "id": "job-2", "title": "DevOps Engineer", "company": "CloudBase Systems", "location": "Bengaluru, KA", "salary": "₹15L - ₹22L LPA", "posted": "3 days ago", "industry": "Technology", "skills": ["AWS", "Kubernetes", "Docker"], "description": "Own our cloud infrastructure." },
      { "id": "job-3", "title": "Product Manager", "company": "FinVista", "location": "Mumbai, MH", "salary": "₹20L - ₹30L LPA", "posted": "5 days ago", "industry": "Corporate Services", "skills": ["Roadmapping", "Agile", "Stakeholder Management"], "description": "Lead product strategy." },
      { "id": "job-4", "title": "Data Scientist", "company": "InsightAI", "location": "Remote - India", "salary": "₹22L - ₹35L LPA", "posted": "1 week ago", "industry": "Technology", "skills": ["Python", "ML", "TensorFlow"], "description": "Build predictive models." },
      { "id": "job-5", "title": "Full Stack Engineer", "company": "BuildFast", "location": "Delhi NCR", "salary": "₹14L - ₹20L LPA", "posted": "4 days ago", "industry": "Engineering", "skills": ["React", "Node.js", "PostgreSQL"], "description": "End-to-end feature development." }
    ],
    "applications": [
      { "id": "app-1", "candidateName": "Alex Mercer", "email": "seeker@stellarhire.com", "phone": "+91 98765 43210", "role": "Senior React Developer", "company": "TechCorp India", "status": "Pending Decision", "appliedDate": "Today", "score": 92, "skills": ["React", "TypeScript", "Node.js"], "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuBnt_CLR1qxfEuWUonL8ewZMke3KS5wlED0A1_tUU0nT8bGvit3WhnUiB1dTxMYXTvtfFEQEOBtCYVkzk_vYHecHI6Mw8kF-KTy2gJRU_ECXGS9q8vyWhYxR1_J7CH39jjoqgJX-5pZ65stgmRRYBhIzqNHvspVd-2lJDikdIl2zGjcNbqWCvwwnDHI3e9Dsb1WaX_bt8KvH8nfERYXUZvVzrdyd7y3yO4HCWMpWPehq7sMtfAGbKwbYbwJ23IbqVCQnsjXsByRa58", "resumeFile": "Alex_Mercer_CV.pdf" },
      { "id": "app-2", "candidateName": "Priya Sharma", "email": "priya@example.com", "phone": "+91 87654 32109", "role": "Data Scientist", "company": "InsightAI", "status": "Interview", "appliedDate": "Yesterday", "score": 88, "skills": ["Python", "ML", "TensorFlow"], "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuCPqQ78vlJf0ixP7FxMYiBELgLdkBfJUVrEVEQPMYeYuTPpLnJCUPwF9oA4MHqpMNAvbT3GJZ_MYEDcG_sZe3ik-s3x-O88Xg9k4hm7_QTfibwGVL2RP4oNS3fwA5h5MMlySwPh7-3_R7pI3BxPcJXIUdqQ1JMHC9EeBWPz5i55wQVFMq8VHQAlxKT5AadIHkCBWYDvW0YVDJ6g", "resumeFile": "Priya_Sharma_Resume.pdf" },
      { "id": "app-3", "candidateName": "Rohan Kapoor", "email": "rohan@example.com", "phone": "+91 76543 21098", "role": "DevOps Engineer", "company": "CloudBase Systems", "status": "Pending", "appliedDate": "Today", "score": 79, "skills": ["AWS", "Docker", "Terraform"], "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuBnt_CLR1qxfEuWUonL8ewZMke3KS5wlED0A1_tUU0nT8bGvit3WhnUiB1dTxMYXTvtfFEQEOBtCYVkzk_vYHecHI6Mw8kF-KTy2gJRU_ECXGS9q8vyWhYxR1_J7CH39jjoqgJX-5pZ65stgmRRYBhIzqNHvspVd-2lJDikdIl2zGjcNbqWCvwwnDHI3e9Dsb1WaX_bt8KvH8nfERYXUZvVzrdyd7y3yO4HCWMpWPehq7sMtfAGbKwbYbwJ23IbqVCQnsjXsByRa58", "resumeFile": "Rohan_CV.pdf" }
    ],
    "logs": [
      { "text": "StellarHire platform started successfully.", "time": "Just now", "type": "success" }
    ]
  };
}

function initDb() {
  if (memDb) return;
  try {
    memDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log('Database loaded from file.');
  } catch (e) {
    console.log('database.json not found or unreadable, using seed data.');
    memDb = getSeedData();
  }
}

function readDb() {
  if (!memDb) initDb();
  return memDb;
}

function writeDb(data) {
  memDb = data;
  // Also try writing to file (works locally, silently fails on Render ephemeral FS)
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) { /* silent fail in production */ }
}

// Helper to append activity log
function appendLog(text, type = 'info') {
  const db = readDb();
  db.logs.unshift({ text, time: new Date().toLocaleTimeString('en-IN'), type });
  if (db.logs.length > 50) db.logs.pop();
  writeDb(db);
}

// Initialize Express App for Backend APIs
const apiApp = express();
apiApp.use(cors());
apiApp.use(express.json());

// Initialize DB at startup
initDb();


// API: Auth Login
apiApp.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const db = readDb();
  const user = db.users.find(
    u => (u.email.toLowerCase() === email.toLowerCase() || (u.username && u.username.toLowerCase() === email.toLowerCase())) && 
         u.password === password && 
         u.role === role
  );
  
  if (user) {
    appendLog(`User ${user.name} logged in successfully as ${user.role}.`, 'info');
    res.json({ success: true, email: user.email, username: user.username || '', name: user.name, role: user.role, phone: user.phone || '', location: user.location || '', skills: user.skills || [], company: user.company || '' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials or role selection.' });
  }
});

// API: Auth Register (Job Seekers)
apiApp.post('/api/auth/register', (req, res) => {
  const { name, username, email, password, phone, location, skills } = req.body;
  if (!name || !email || !password || !username) {
    return res.status(400).json({ success: false, message: 'Name, username, email, and password are required.' });
  }
  const db = readDb();
  const existingEmail = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'seeker');
  if (existingEmail) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }
  const existingUsername = db.users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase() && u.role === 'seeker');
  if (existingUsername) {
    return res.status(409).json({ success: false, message: 'This username is already taken.' });
  }
  const newUser = {
    username,
    email,
    password,
    role: 'seeker',
    name,
    phone: phone || '',
    location: location || '',
    skills: skills || []
  };
  db.users.push(newUser);
  writeDb(db);
  appendLog(`New job seeker registered: ${name} (${username}).`, 'success');
  res.json({ success: true, email: newUser.email, username: newUser.username, name: newUser.name, role: 'seeker', phone: newUser.phone, location: newUser.location, skills: newUser.skills });
});

// API: Auth Register (Recruiters)
apiApp.post('/api/auth/register-recruiter', (req, res) => {
  const { name, username, email, password, company } = req.body;
  if (!name || !email || !password || !username || !company) {
    return res.status(400).json({ success: false, message: 'Name, username, email, company, and password are required.' });
  }
  const db = readDb();
  const existingEmail = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'recruiter');
  if (existingEmail) {
    return res.status(409).json({ success: false, message: 'A recruiter account with this email already exists.' });
  }
  const existingUsername = db.users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase() && u.role === 'recruiter');
  if (existingUsername) {
    return res.status(409).json({ success: false, message: 'This username is already taken.' });
  }
  const newRecruiter = {
    username,
    email,
    password,
    role: 'recruiter',
    name,
    company
  };
  db.users.push(newRecruiter);
  writeDb(db);
  appendLog(`New recruiter registered: ${name} (${username}) from ${company}.`, 'success');
  res.json({ success: true, email: newRecruiter.email, username: newRecruiter.username, name: newRecruiter.name, role: 'recruiter', company: newRecruiter.company });
});

// API: Update Seeker Profile
apiApp.post('/api/auth/update-profile', (req, res) => {
  const { email, name, phone, location, skills } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }
  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'seeker');
  if (user) {
    user.name = name;
    user.phone = phone || '';
    user.location = location || '';
    user.skills = skills || [];
    writeDb(db);
    res.json({ success: true, email: user.email, username: user.username || '', name: user.name, role: user.role, phone: user.phone, location: user.location, skills: user.skills });
  } else {
    res.status(404).json({ success: false, message: 'User not found.' });
  }
});

// API: Get Applications
apiApp.get('/api/applications', (req, res) => {
  const db = readDb();
  res.json(db.applications);
});

// API: Get Jobs
apiApp.get('/api/jobs', (req, res) => {
  const db = readDb();
  res.json(db.jobs);
});

// API: Post a new Job
apiApp.post('/api/jobs', (req, res) => {
  const { title, company, location, salary, skills, description } = req.body;
  if (!title || !company) {
    return res.status(400).json({ success: false, message: 'Title and company are required.' });
  }
  const db = readDb();
  const newJob = {
    id: 'job-' + Date.now(),
    title,
    company,
    location: location || 'Remote - India',
    salary: salary || '₹10L - ₹15L LPA',
    posted: 'Just now',
    skills: skills || [],
    description: description || ''
  };
  db.jobs.unshift(newJob);
  writeDb(db);
  appendLog(`New job posted: '${title}' at ${company} (${location}).`, 'info');
  res.json(newJob);
});

// API: Get Logs
apiApp.get('/api/logs', (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

// API: Delete a Job
apiApp.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const idx = db.jobs.findIndex(j => j.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Job not found.' });
  const [removed] = db.jobs.splice(idx, 1);
  writeDb(db);
  appendLog(`Job posting '${removed.title}' at ${removed.company} was deleted by recruiter.`, 'info');
  res.json({ success: true });
});

// API: Clear System Logs
apiApp.delete('/api/logs', (req, res) => {
  const db = readDb();
  db.logs = [];
  writeDb(db);
  res.json({ success: true });
});

// API: Apply for a job
apiApp.post('/api/applications', (req, res) => {
  const { candidateName, email, phone, role, company, score, skills, avatar, resumeFile } = req.body;
  const db = readDb();
  
  // Check if already applied
  const existing = db.applications.find(
    a => a.candidateName.toLowerCase() === candidateName.toLowerCase() && 
         a.role.toLowerCase() === role.toLowerCase()
  );
  
  if (existing) {
    return res.json(existing);
  }
  
  const newApp = {
    id: 'app-' + Date.now(),
    candidateName,
    email: email || '',
    phone: phone || '',
    role,
    company: company || 'StellarHire',
    status: 'Pending',
    appliedDate: 'Today',
    score: score || Math.floor(Math.random() * 20) + 80,
    skills: skills || ["React", "CSS", "JavaScript"],
    avatar: avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnt_CLR1qxfEuWUonL8ewZMke3KS5wlED0A1_tUU0nT8bGvit3WhnUiB1dTxMYXTvtfFEQEOBtCYVkzk_vYHecHI6Mw8kF-KTy2gJRU_ECXGS9q8vyWhYxR1_J7CH39jjoqgJX-5pZ65stgmRRYBhIzqNHvspVd-2lJDikdIl2zGjcNbqWCvwwnDHI3e9Dsb1WaX_bt8KvH8nfERYXUZvVzrdyd7y3yO4HCWMpWPehq7sMtfAGbKwbYbwJ23IbqVCQnsjXsByRa58',
    resumeFile: resumeFile || ''
  };
  
  db.applications.unshift(newApp);
  writeDb(db);
  appendLog(`New application received for '${role}' from candidate ${candidateName}${resumeFile ? ' (Resume: ' + resumeFile + ')' : ''}.`, 'info');
  res.json(newApp);
});

// API: Update Status
apiApp.post('/api/applications/status', (req, res) => {
  const { id, status } = req.body;
  const db = readDb();
  const app = db.applications.find(a => a.id === id);
  if (app) {
    const oldStatus = app.status;
    app.status = status;
    writeDb(db);
    appendLog(`Application status for ${app.candidateName} (${app.role}) updated from '${oldStatus}' to '${status}'.`, 'success');
    res.json({ success: true, application: app });
  } else {
    res.status(404).json({ success: false, message: 'Application not found.' });
  }
});

// API: Add System Log
apiApp.post('/api/logs', (req, res) => {
  const { text, type } = req.body;
  appendLog(text, type);
  res.json({ success: true });
});

// --- Unified Server Launcher ---
const PORT = process.env.PORT || 8000;

const app = apiApp;

// Serve client.js on all subroutes
app.get('/client.js', (req, res) => res.sendFile(path.join(__dirname, 'portals/client.js')));
app.get('/jobseeker/client.js', (req, res) => res.sendFile(path.join(__dirname, 'portals/client.js')));
app.get('/recruiter/client.js', (req, res) => res.sendFile(path.join(__dirname, 'portals/client.js')));
app.get('/admin/client.js', (req, res) => res.sendFile(path.join(__dirname, 'portals/client.js')));

// Redirect base portal routes to their login pages
app.get('/jobseeker', (req, res) => res.redirect('/jobseeker/login.html'));
app.get('/jobseeker/', (req, res) => res.redirect('/jobseeker/login.html'));
app.get('/recruiter', (req, res) => res.redirect('/recruiter/login.html'));
app.get('/recruiter/', (req, res) => res.redirect('/recruiter/login.html'));
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));
app.get('/admin/', (req, res) => res.redirect('/admin/login.html'));

// Serve Frontends on relative Subroutes
app.use('/', express.static(path.join(__dirname, 'portals/welcome')));
app.use('/jobseeker', express.static(path.join(__dirname, 'portals/jobseeker')));
app.use('/recruiter', express.static(path.join(__dirname, 'portals/recruiter')));
app.use('/admin', express.static(path.join(__dirname, 'portals/admin')));

app.listen(PORT, () => {
  console.log(`Unified server running on port ${PORT}`);
});
