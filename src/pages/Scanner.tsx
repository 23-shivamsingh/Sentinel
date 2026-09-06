import React, { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Upload, PlayCircle, Loader2 } from 'lucide-react';

interface Finding { id: string; severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; category: string; endpoint: string; description: string; }
interface ScanResults { apiName: string; score: number; grade: string; critical: number; high: number; medium: number; endpointsScanned: number; findings: Finding[]; }

const initialMockResults: ScanResults = {
  apiName: "Sentinel Demo API v1", score: 72, grade: "C (Needs Improvement)", critical: 2, high: 5, medium: 12, endpointsScanned: 24,
  findings: [
    { id: '1', severity: "CRITICAL", category: "Security Misconfiguration", endpoint: "GET /api/v1/admin/debug", description: "Endpoint exposed without authentication requirements in production definition." },
    { id: '2', severity: "CRITICAL", category: "BOPLA", endpoint: "GET /api/v1/users/:id", description: "Response schema exposes sensitive internal PII fields (ssn, passwordHash)." },
    { id: '3', severity: "HIGH", category: "Unrestricted Resource Consumption", endpoint: "GET /api/v1/search", description: "Missing pagination limits on query parameters 'limit' and 'offset'." },
    { id: '4', severity: "HIGH", category: "Broken Authentication", endpoint: "POST /api/v1/auth/login", description: "No rate limiting headers or definitions found on authentication endpoint." }
  ]
};

export function Scanner() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [specContent, setSpecContent] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResults>(initialMockResults);
  const [filter, setFilter] = useState<string>("All");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        setSpecContent(parsed);
        toast(`Successfully loaded ${parsed.info?.title || 'OpenAPI Spec'}. Ready for scan.`, "success");
      } catch (err) {
        console.error(err);
        toast("Invalid OpenAPI JSON file. Could not parse.", "error");
      }
      if (fileInputRef.current) { fileInputRef.current.value = ""; }
    };
    reader.readAsText(file);
  };

  const runScan = () => {
    if (!specContent) { toast("Please upload an OpenAPI JSON specification first.", "warning"); return; }
    setIsScanning(true);
    toast("Initiating full vulnerability scan...", "info");
    setTimeout(() => {
      const scanResults = analyzeSpec(specContent);
      setResults(scanResults);
      setIsScanning(false);
      setFilter("All");
      toast(`Scan complete! Found ${scanResults.findings.length} potential vulnerabilities.`, "success");
    }, 2500);
  };

  const analyzeSpec = (spec: any): ScanResults => {
    let critical = 0, high = 0, medium = 0;
    const findings: Finding[] = [];
    let endpointsScanned = 0;
    const apiName = spec.info?.title || 'Imported API';
    const globalSecurity = spec.security;
    if (spec.paths) {
      Object.keys(spec.paths).forEach(path => {
        Object.keys(spec.paths[path]).forEach(method => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            endpointsScanned++;
            const operation = spec.paths[path][method];
            const endpointStr = `${method.toUpperCase()} ${path}`;
            const opSecurity = operation.security;
            const hasSecurity = (opSecurity && opSecurity.length > 0) || (!opSecurity && globalSecurity && globalSecurity.length > 0);
            if (!hasSecurity) {
              critical++;
              findings.push({ id: Math.random().toString(), severity: "CRITICAL", category: "Broken Authentication", endpoint: endpointStr, description: "Endpoint lacks security definitions (no authentication required)." });
            }
            if (method === 'get' && !path.includes('{')) {
              const params = operation.parameters || [];
              const hasPagination = params.some((p: any) => p.name?.toLowerCase().includes('limit') || p.name?.toLowerCase().includes('offset') || p.name?.toLowerCase().includes('page'));
              if (!hasPagination) {
                high++;
                findings.push({ id: Math.random().toString(), severity: "HIGH", category: "Unrestricted Resource Consumption", endpoint: endpointStr, description: "Missing pagination limits on query parameters." });
              }
            }
            const responses = operation.responses || {};
            const successRes = responses['200'] || responses['201'];
            if (successRes && successRes.content && successRes.content['application/json']) {
              const schemaStr = JSON.stringify(successRes.content['application/json'].schema || {});
              const lowerSchema = schemaStr.toLowerCase();
              if (lowerSchema.includes('password') || lowerSchema.includes('ssn') || lowerSchema.includes('secret') || lowerSchema.includes('token')) {
                critical++;
                findings.push({ id: Math.random().toString(), severity: "CRITICAL", category: "Sensitive Data Exposure", endpoint: endpointStr, description: "Response schema appears to expose sensitive internal fields." });
              }
            }
            if (successRes && !successRes.headers && (method === 'post' || method === 'put' || method === 'delete')) {
              medium++;
              findings.push({ id: Math.random().toString(), severity: "MEDIUM", category: "Missing Rate Limiting", endpoint: endpointStr, description: "No rate limiting headers defined for state-changing operation." });
            }
          }
        });
      });
    }
    if (findings.length === 0) { return { apiName, score: 100, grade: "A+ (Excellent)", critical: 0, high: 0, medium: 0, endpointsScanned, findings: [] }; }
    let score = 100 - (critical * 12) - (high * 6) - (medium * 2);
    if (score < 0) score = 0;
    let grade = "A (Excellent)";
    if (score < 90) { grade = "B (Good)"; }
    if (score < 80) { grade = "C (Needs Improvement)"; }
    if (score < 60) { grade = "D (Poor)"; }
    if (score < 40) { grade = "F (Critical Risk)"; }
    return { apiName, score, grade, critical, high, medium, endpointsScanned, findings };
  };

  const filteredFindings = filter === "All" ? results.findings : results.findings.filter(f => f.severity === filter.toUpperCase());
  const getScoreColor = (score: number) => {
    if (score >= 90) return "border-green-500 text-green-500";
    if (score >= 80) return "border-green-400 text-green-400";
    if (score >= 60) return "border-orange-500 text-orange-400";
    return "border-red-500 text-red-500";
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E4E4E7]">API Security Scanner</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Statically analyze your API definitions for security misconfigurations.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button variant="outline" className="border border-[#27272A] bg-transparent hover:bg-[#161616] text-[#E4E4E7]" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
            <Upload className="h-4 w-4 mr-2" />
            {specContent ? "Update OpenAPI Spec" : "Upload OpenAPI Spec"}
          </Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-500 border-0" onClick={runScan} disabled={isScanning || !specContent}>
            {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            {isScanning ? "Scanning..." : "Run Full Scan"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[#27272A] bg-[#111111]">
          <CardHeader className="pb-4"><CardTitle className="text-sm font-medium text-[#52525B] text-center uppercase tracking-widest">Overall Posture</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            <div className={`relative w-32 h-32 flex items-center justify-center rounded-full border-8 ${getScoreColor(results.score).split(' ')[0]}/20`}>
              <div className={`absolute inset-0 rounded-full border-8 ${getScoreColor(results.score).split(' ')[0]} border-r-transparent border-b-transparent transform rotate-45`}></div>
              <div className="text-4xl font-bold text-[#E4E4E7]">{results.score}<span className="text-lg text-[#71717A]">/100</span></div>
            </div>
            <p className={`mt-4 font-semibold ${getScoreColor(results.score).split(' ')[1]}`}>Grade: {results.grade}</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-3 border-[#27272A] bg-[#111111]">
          <CardHeader><CardTitle>Scan Summary: {results.apiName}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"><p className="text-sm text-red-400/80 mb-1">Critical Findings</p><p className="text-3xl font-bold text-red-500">{results.critical}</p></div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4"><p className="text-sm text-orange-400/80 mb-1">High Findings</p><p className="text-3xl font-bold text-orange-500">{results.high}</p></div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"><p className="text-sm text-blue-400/80 mb-1">Medium Findings</p><p className="text-3xl font-bold text-blue-500">{results.medium}</p></div>
            <div className="bg-[#161616] border border-[#27272A] rounded-lg p-4"><p className="text-sm text-[#A1A1AA] mb-1">Endpoints Scanned</p><p className="text-3xl font-bold text-[#E4E4E7]">{results.endpointsScanned}</p></div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-[#27272A] bg-[#111111]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Vulnerability Findings</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className={`border-white/10 cursor-pointer ${filter === 'All' ? 'bg-[#27272A] text-white' : 'bg-[#161616] text-[#A1A1AA]'}`} onClick={() => setFilter("All")}>All</Badge>
              <Badge variant="outline" className={`border-red-500/30 text-red-400 cursor-pointer ${filter === 'Critical' ? 'bg-red-500/20' : 'bg-[#161616]'}`} onClick={() => setFilter("Critical")}>Critical ({results.critical})</Badge>
              <Badge variant="outline" className={`border-orange-500/30 text-amber-400 cursor-pointer ${filter === 'High' ? 'bg-orange-500/20' : 'bg-[#161616]'}`} onClick={() => setFilter("High")}>High ({results.high})</Badge>
              <Badge variant="outline" className={`border-blue-500/30 text-blue-400 cursor-pointer ${filter === 'Medium' ? 'bg-blue-500/20' : 'bg-[#161616]'}`} onClick={() => setFilter("Medium")}>Medium ({results.medium})</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFindings.length === 0 ? (
            <div className="text-center py-8 text-[#A1A1AA]">No vulnerabilities found matching this filter.</div>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-[#161616] hover:bg-[#161616]"><TableHead>Severity</TableHead><TableHead>Category</TableHead><TableHead>Endpoint</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredFindings.map(finding => (
                  <TableRow key={finding.id} className="cursor-pointer hover:bg-[#161616]">
                    <TableCell><Badge variant={finding.severity === 'CRITICAL' ? 'destructive' : finding.severity === 'HIGH' ? 'warning' : 'secondary'}>{finding.severity}</Badge></TableCell>
                    <TableCell className="font-medium text-[#E4E4E7]">{finding.category}</TableCell>
                    <TableCell className="font-mono text-xs text-[#A1A1AA]">{finding.endpoint}</TableCell>
                    <TableCell className="text-sm text-[#A1A1AA]">{finding.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
