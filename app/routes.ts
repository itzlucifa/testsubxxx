import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
  // Login route (no layout)
  route("login", "./routes/login.tsx"),
  
  // Main app routes with layout
  layout("./components/layout/app-layout.tsx", [
    index("./routes/home.tsx"),
    
    // Monitoring & Detection
    route("devices", "./routes/devices.tsx"),
    route("network-monitor", "./routes/network-monitor.tsx"),
    route("threats", "./routes/threats.tsx"),
    route("vulnerabilities", "./routes/vulnerabilities.tsx"),
    
    // AI & Automation
    route("ai-assistant", "./routes/ai-assistant.tsx"),
    route("soar", "./routes/soar.tsx"),
    
    // Investigation & Testing
    route("forensics", "./routes/forensics.tsx"),
    route("pentest", "./routes/pentest.tsx"),
    
    // Compliance & Governance
    route("compliance", "./routes/compliance.tsx"),
    route("policies", "./routes/policies.tsx"),
    route("risk-assessment", "./routes/risk-assessment.tsx"),
    
    // Training & Utilities
    route("training", "./routes/training.tsx"),
    route("password-tools", "./routes/password-tools.tsx"),
    route("wifi-scanner", "./routes/wifi-scanner.tsx"),
    
    // Infrastructure
    route("zero-trust", "./routes/zero-trust.tsx"),
    route("asset-inventory", "./routes/asset-inventory.tsx"),
    
    // Existing routes
    route("alerts", "./routes/alerts.tsx"),
    route("analytics", "./routes/analytics.tsx"),
    route("reports", "./routes/reports.tsx"),
    route("settings", "./routes/settings.tsx"),
    route("help", "./routes/help.tsx"),
  ]),
] satisfies RouteConfig;
