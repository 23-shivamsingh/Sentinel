import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// In-memory policy engine rules
let activeRules: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies
  app.use(express.json());

  // --- INTERNAL API FOR ENGINE SYNC ---
  // The frontend pushes its rules here to keep the backend engine in sync
  app.post('/api/internal/sync-rules', (req, res) => {
    activeRules = req.body.rules || [];
    console.log(`[ENGINE] Synced ${activeRules.length} security rules from dashboard.`);
    res.json({ success: true, count: activeRules.length });
  });

  // --- THE SECURITY ENGINE MIDDLEWARE ---
  // Intercepts and evaluates ALL API requests against active policies
  app.use('/api', (req, res, next) => {
    // Bypass the internal sync endpoint
    if (req.path.startsWith('/internal')) return next();

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.path;
    
    // Evaluate Request Against Policies
    for (const rule of activeRules) {
      if (rule.status !== 'Active') continue;

      let triggered = false;
      
      // 1. Detect SQL Injection attempts in body or query
      if (rule.condition.includes('SQL Injection')) {
        const payloadStr = JSON.stringify(req.body || {}).toUpperCase() + JSON.stringify(req.query || {}).toUpperCase();
        if (payloadStr.includes('SELECT') || payloadStr.includes('OR 1=1') || payloadStr.includes('DROP TABLE')) {
          triggered = true;
        }
      }
      
      // 2. Detect exposed endpoints without auth
      if (rule.condition.includes('/api/v1/admin/*') && endpoint.startsWith('/v1/admin')) {
        if (!req.headers.authorization && rule.condition.includes('Auth == "None"')) {
          triggered = true;
        }
      }

      // 3. Simple IP Blocking condition (e.g. Threat == "X" AND IP == "1.2.3.4")
      if (rule.condition.includes('IP ==') && rule.condition.includes(clientIp)) {
         triggered = true;
      }

      // If a rule matches, intercept and enforce the action
      if (triggered) {
        console.warn(`[SECURITY ENGINE] Blocked request to ${endpoint} from ${clientIp}. Triggered Rule: ${rule.condition}`);
        
        switch (rule.action) {
          case 'BLOCK_IP':
            return res.status(403).json({ error: 'Forbidden', message: 'Request blocked by security policy engine.' });
          case 'RATE_LIMIT':
            return res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded due to suspicious activity.' });
          case 'SESSION_REVOKE':
            return res.status(401).json({ error: 'Unauthorized', message: 'Session revoked due to policy violation.' });
          default:
            return res.status(403).json({ error: 'Forbidden', message: 'Security policy violation intercepted.' });
        }
      }
    }
    
    // If no rules were triggered, allow the request to proceed to the actual API endpoint
    next();
  });

  // --- DUMMY API ENDPOINTS FOR TESTING ---
  
  // A standard login endpoint (might be tested with SQLi)
  app.post('/api/v1/login', (req, res) => {
    res.json({ success: true, message: 'Login successful (Dummy Backend)' });
  });

  // An exposed admin endpoint (tests the Auth == None rule)
  app.get('/api/v1/admin/users', (req, res) => {
    res.json({ data: ['Admin1', 'Admin2'], message: 'Sensitive admin data accessed' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'active', activeRulesCount: activeRules.length });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Security Engine Middleware running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
