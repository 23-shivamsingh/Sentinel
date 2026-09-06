import { RequestEvent, ThreatEvent, ActionType, OwaspCategory, Severity } from '../types';

export class TrafficSimulator {
  private static instance: TrafficSimulator;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: ((event: RequestEvent) => void)[] = [];
  private constructor() {}
  public static getInstance(): TrafficSimulator {
    if (!TrafficSimulator.instance) { TrafficSimulator.instance = new TrafficSimulator(); }
    return TrafficSimulator.instance;
  }
  public subscribe(callback: (event: RequestEvent) => void) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(cb => cb !== callback); };
  }
  public start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => { this.generateEvent(); }, 2000);
  }
  public stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }
  public triggerAttack(type: OwaspCategory) {
    const event = this.generateSpecificAttack(type);
    this.notifyListeners(event);
    return event;
  }
  private notifyListeners(event: RequestEvent) { 
    this.listeners.forEach(cb => cb(event)); 
    
    // Maintain discovered endpoints in localStorage
    try {
      const storedEndpoints = JSON.parse(localStorage.getItem('app_endpoints') || '[]');
      const existing = storedEndpoints.find((e: any) => e.method === event.method && e.path === event.path);
      
      if (!existing) {
        const newEndpoint = {
          id: crypto.randomUUID(),
          method: event.method,
          path: event.path,
          status: event.threats.length > 0 ? (event.threats[0].severity === 'CRITICAL' ? 'Critical' : 'Warning') : 'Secured',
          score: event.threats.length > 0 ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 20) + 80,
          lastSeen: new Date().toISOString()
        };
        localStorage.setItem('app_endpoints', JSON.stringify([newEndpoint, ...storedEndpoints]));
      } else if (event.threats.length > 0) {
        // Update existing endpoint if a new threat is found
        existing.status = event.threats[0].severity === 'CRITICAL' ? 'Critical' : 'Warning';
        existing.score = Math.floor(Math.random() * 40) + 30;
        existing.lastSeen = new Date().toISOString();
        localStorage.setItem('app_endpoints', JSON.stringify(storedEndpoints));
      }
    } catch (e) {}
  }
  private generateEvent() {
    const isThreat = Math.random() < 0.2;
    if (isThreat) {
      const categories: OwaspCategory[] = ['BOLA', 'Broken Authentication', 'Injection', 'Unrestricted Resource Consumption'];
      const cat = categories[Math.floor(Math.random() * categories.length)];
      this.notifyListeners(this.generateSpecificAttack(cat));
    } else {
      this.notifyListeners(this.generateNormalRequest());
    }
  }
  private generateNormalRequest(): RequestEvent {
    const endpoints = [
      { method: 'GET', path: '/api/v1/users' },
      { method: 'GET', path: '/api/v1/products' },
      { method: 'POST', path: '/api/v1/checkout' },
      { method: 'GET', path: '/api/v1/inventory' },
    ];
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    return {
      id: crypto.randomUUID(), timestamp: new Date().toISOString(), method: ep.method, path: ep.path, status: 200, latencyMs: Math.floor(Math.random() * 50) + 10, sourceIp: this.randomIp(), user: 'user_' + Math.floor(Math.random() * 1000), session: crypto.randomUUID(), riskScore: Math.floor(Math.random() * 15), decision: 'ALLOW', threats: [], headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Authorization': 'Bearer ...', }, queryParams: {}, bodySize: Math.floor(Math.random() * 1024),
    };
  }
  private generateSpecificAttack(category: OwaspCategory): RequestEvent {
    const base = this.generateNormalRequest();
    let threat: ThreatEvent = { id: crypto.randomUUID(), requestId: base.id, category, severity: 'HIGH', confidence: 0.95, evidence: '', signals: [], recommendation: '', timestamp: base.timestamp };
    base.decision = 'BLOCK'; base.status = 403;
    if (category === 'BOLA') {
      base.path = '/api/v1/users/9999/profile'; base.riskScore = 92; threat.evidence = 'User ID in path does not match authenticated user ID token.'; threat.signals = ['Object ID Mismatch', 'Sequential Traversal']; threat.recommendation = 'Enforce authorization checks at the object property level.';
    } else if (category === 'Injection') {
      base.path = '/api/v1/products'; base.queryParams = { q: "' OR 1=1 --" }; base.riskScore = 98; threat.severity = 'CRITICAL'; threat.evidence = 'SQL Injection payload detected in query parameter "q".'; threat.signals = ['Known SQLi Pattern', 'Syntax Anomaly']; threat.recommendation = 'Use parameterized queries or an ORM. Implement input validation.';
    } else if (category === 'Broken Authentication') {
      base.path = '/api/v1/login'; base.method = 'POST'; base.riskScore = 85; base.decision = 'RATE_LIMIT'; base.status = 429; threat.severity = 'MEDIUM'; threat.evidence = 'High volume of failed login attempts from single IP.'; threat.signals = ['Credential Stuffing Pattern', 'Velocity Anomaly']; threat.recommendation = 'Implement strict rate limiting and account lockout policies.';
    } else {
      base.riskScore = 75; base.decision = 'MONITOR'; base.status = 200; threat.severity = 'MEDIUM'; threat.evidence = 'Anomalous request pattern detected.'; threat.signals = ['High frequency API usage']; threat.recommendation = 'Review access logs and adjust rate limits.';
    }
    base.threats = [threat]; return base;
  }
  private randomIp() { return Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255); }
}
