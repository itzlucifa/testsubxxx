export interface ReportData {
  title: string;
  generatedAt: Date;
  dateRange: { start: Date; end: Date };
  metrics: {
    securityScore: number;
    threatsBlocked: number;
    vulnerabilitiesFixed: number;
    devicesProtected: number;
    uptime: number;
  };
  threats: Array<{
    id: string;
    type: string;
    severity: string;
    source: string;
    status: string;
    detectedAt: string;
    description: string;
  }>;
  devices: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    lastScan: string;
    vulnerabilities: number;
  }>;
  vulnerabilities: Array<{
    id: string;
    name: string;
    severity: string;
    device: string;
    status: string;
    cve?: string;
  }>;
  recommendations: string[];
}

export type ReportFormat = 'pdf' | 'csv' | 'json' | 'xlsx';
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'devices' | 'compliance' | 'ai-performance' | 'custom';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateCSV(data: ReportData): string {
  const lines: string[] = [];
  
  lines.push(`CYBERSHIELD Security Report`);
  lines.push(`Generated: ${formatDate(data.generatedAt)}`);
  lines.push(`Report: ${data.title}`);
  lines.push(`Date Range: ${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`);
  lines.push('');
  
  lines.push('SECURITY METRICS');
  lines.push(`Security Score,${data.metrics.securityScore}%`);
  lines.push(`Threats Blocked,${data.metrics.threatsBlocked}`);
  lines.push(`Vulnerabilities Fixed,${data.metrics.vulnerabilitiesFixed}`);
  lines.push(`Devices Protected,${data.metrics.devicesProtected}`);
  lines.push(`System Uptime,${data.metrics.uptime}%`);
  lines.push('');
  
  if (data.threats.length > 0) {
    lines.push('THREATS DETECTED');
    lines.push('ID,Type,Severity,Source,Status,Detected At,Description');
    data.threats.forEach(t => {
      lines.push(`${t.id},${t.type},${t.severity},${t.source},${t.status},${t.detectedAt},"${t.description}"`);
    });
    lines.push('');
  }
  
  if (data.devices.length > 0) {
    lines.push('DEVICE INVENTORY');
    lines.push('ID,Name,Type,Status,Last Scan,Vulnerabilities');
    data.devices.forEach(d => {
      lines.push(`${d.id},${d.name},${d.type},${d.status},${d.lastScan},${d.vulnerabilities}`);
    });
    lines.push('');
  }
  
  if (data.vulnerabilities.length > 0) {
    lines.push('VULNERABILITIES');
    lines.push('ID,Name,Severity,Device,Status,CVE');
    data.vulnerabilities.forEach(v => {
      lines.push(`${v.id},${v.name},${v.severity},${v.device},${v.status},${v.cve || 'N/A'}`);
    });
    lines.push('');
  }
  
  if (data.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    data.recommendations.forEach((r, i) => {
      lines.push(`${i + 1}. ${r}`);
    });
  }
  
  return lines.join('\n');
}

function generateJSON(data: ReportData): string {
  return JSON.stringify({
    report: {
      title: data.title,
      generatedAt: data.generatedAt.toISOString(),
      dateRange: {
        start: data.dateRange.start.toISOString(),
        end: data.dateRange.end.toISOString(),
      },
    },
    metrics: data.metrics,
    threats: data.threats,
    devices: data.devices,
    vulnerabilities: data.vulnerabilities,
    recommendations: data.recommendations,
  }, null, 2);
}

function generateHTMLReport(data: ReportData): string {
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    info: '#3b82f6',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title} - CYBERSHIELD</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #0a0a0f; color: #e5e7eb; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #00d4ff; padding-bottom: 20px; }
    .header h1 { color: #00d4ff; margin: 0; font-size: 32px; }
    .header p { color: #9ca3af; margin: 10px 0 0; }
    .meta { display: flex; justify-content: space-between; background: #1a1a2e; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .meta-item { text-align: center; }
    .meta-label { color: #9ca3af; font-size: 12px; }
    .meta-value { color: #00d4ff; font-size: 24px; font-weight: bold; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #00d4ff; border-bottom: 1px solid #374151; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #1a1a2e; color: #00d4ff; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #374151; }
    tr:hover { background: #1a1a2e; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-critical { background: #ef4444; color: white; }
    .badge-high { background: #f97316; color: white; }
    .badge-medium { background: #eab308; color: black; }
    .badge-low { background: #22c55e; color: white; }
    .recommendations { background: #1a1a2e; padding: 20px; border-radius: 8px; }
    .recommendations li { margin: 10px 0; padding-left: 10px; border-left: 3px solid #00d4ff; }
    @media print { body { background: white; color: black; } .header h1 { color: #0066cc; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>CYBERSHIELD</h1>
    <p>${data.title}</p>
    <p style="font-size: 14px;">Generated: ${formatDate(data.generatedAt)}</p>
    <p style="font-size: 14px;">Period: ${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}</p>
  </div>
  
  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Security Score</div>
      <div class="meta-value">${data.metrics.securityScore}%</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Threats Blocked</div>
      <div class="meta-value">${data.metrics.threatsBlocked}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Vulnerabilities Fixed</div>
      <div class="meta-value">${data.metrics.vulnerabilitiesFixed}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Devices Protected</div>
      <div class="meta-value">${data.metrics.devicesProtected}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">System Uptime</div>
      <div class="meta-value">${data.metrics.uptime}%</div>
    </div>
  </div>
  
  ${data.threats.length > 0 ? `
  <div class="section">
    <h2>Threats Detected (${data.threats.length})</h2>
    <table>
      <thead>
        <tr><th>Type</th><th>Severity</th><th>Source</th><th>Status</th><th>Detected</th><th>Description</th></tr>
      </thead>
      <tbody>
        ${data.threats.map(t => `
          <tr>
            <td>${t.type}</td>
            <td><span class="badge badge-${t.severity.toLowerCase()}">${t.severity}</span></td>
            <td>${t.source}</td>
            <td>${t.status}</td>
            <td>${t.detectedAt}</td>
            <td>${t.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${data.devices.length > 0 ? `
  <div class="section">
    <h2>Device Inventory (${data.devices.length})</h2>
    <table>
      <thead>
        <tr><th>Name</th><th>Type</th><th>Status</th><th>Last Scan</th><th>Vulnerabilities</th></tr>
      </thead>
      <tbody>
        ${data.devices.map(d => `
          <tr>
            <td>${d.name}</td>
            <td>${d.type}</td>
            <td>${d.status}</td>
            <td>${d.lastScan}</td>
            <td>${d.vulnerabilities}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${data.vulnerabilities.length > 0 ? `
  <div class="section">
    <h2>Vulnerabilities (${data.vulnerabilities.length})</h2>
    <table>
      <thead>
        <tr><th>Name</th><th>Severity</th><th>Device</th><th>Status</th><th>CVE</th></tr>
      </thead>
      <tbody>
        ${data.vulnerabilities.map(v => `
          <tr>
            <td>${v.name}</td>
            <td><span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span></td>
            <td>${v.device}</td>
            <td>${v.status}</td>
            <td>${v.cve || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${data.recommendations.length > 0 ? `
  <div class="section">
    <h2>Recommendations</h2>
    <div class="recommendations">
      <ul>
        ${data.recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
  </div>
  ` : ''}
  
  <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px;">
    <p>This report was automatically generated by CYBERSHIELD AI Security Platform</p>
    <p>For questions, contact your security administrator</p>
  </div>
</body>
</html>
  `;
}

export function generateReport(
  data: ReportData,
  format: ReportFormat
): { content: string; filename: string; mimeType: string } {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `cybershield-${data.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
  
  switch (format) {
    case 'csv':
      return {
        content: generateCSV(data),
        filename: `${baseFilename}.csv`,
        mimeType: 'text/csv',
      };
    case 'json':
      return {
        content: generateJSON(data),
        filename: `${baseFilename}.json`,
        mimeType: 'application/json',
      };
    case 'pdf':
    case 'xlsx':
      return {
        content: generateHTMLReport(data),
        filename: `${baseFilename}.html`,
        mimeType: 'text/html',
      };
    default:
      return {
        content: generateHTMLReport(data),
        filename: `${baseFilename}.html`,
        mimeType: 'text/html',
      };
  }
}

export function downloadReport(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getDateRangeForReportType(type: ReportType): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (type) {
    case 'daily':
      start.setDate(start.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
}

export function generateRecommendations(
  threats: any[],
  vulnerabilities: any[],
  devices: any[]
): string[] {
  const recommendations: string[] = [];
  
  const criticalThreats = threats.filter(t => t.severity === 'critical');
  if (criticalThreats.length > 0) {
    recommendations.push(`Address ${criticalThreats.length} critical threats immediately to prevent potential breaches`);
  }
  
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical' && v.status !== 'fixed');
  if (criticalVulns.length > 0) {
    recommendations.push(`Patch ${criticalVulns.length} critical vulnerabilities as a priority`);
  }
  
  const offlineDevices = devices.filter(d => d.status === 'offline');
  if (offlineDevices.length > 0) {
    recommendations.push(`Investigate ${offlineDevices.length} offline devices for potential security issues`);
  }
  
  const outdatedDevices = devices.filter(d => d.firmware_status === 'outdated');
  if (outdatedDevices.length > 0) {
    recommendations.push(`Update firmware on ${outdatedDevices.length} devices to close security gaps`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Security posture is strong - continue monitoring for new threats');
    recommendations.push('Consider implementing additional security layers for defense in depth');
    recommendations.push('Schedule regular security audits and penetration tests');
  }
  
  return recommendations;
}
