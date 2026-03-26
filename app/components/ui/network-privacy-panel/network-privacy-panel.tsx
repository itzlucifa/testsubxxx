import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../card/card';
import { Button } from '../button/button';
import { Badge } from '../badge/badge';
import { 
  Shield, 
  Wifi, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  EyeOff,
  Lock,
  Unlock,
  Network,
  Mic,
  MicOff,
  Settings,
  Trash2
} from 'lucide-react';
import type { NetworkPrivacyState, PrivacyViolation } from '../../../hooks/use-network-privacy-guard';

interface NetworkPrivacyPanelProps {
  privacyState: NetworkPrivacyState;
  onToggle: () => void;
  onClearViolations: () => void;
  getReport: () => any;
  className?: string;
}

export function NetworkPrivacyPanel({
  privacyState,
  onToggle,
  onClearViolations,
  getReport,
  className = ''
}: NetworkPrivacyPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getProtectionColor = () => {
    switch (privacyState.protectionLevel) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getProtectionIcon = () => {
    switch (privacyState.protectionLevel) {
      case 'high': return <Shield className="w-5 h-5" />;
      case 'medium': return <AlertTriangle className="w-5 h-5" />;
      case 'low': return <XCircle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    return privacyState.isActive ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = () => {
    return privacyState.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
  };

  const getViolationTypeColor = (type: PrivacyViolation['type']) => {
    switch (type) {
      case 'voice-tracking': return 'bg-red-100 text-red-800';
      case 'analytics': return 'bg-blue-100 text-blue-800';
      case 'social-media': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getViolationTypeLabel = (type: PrivacyViolation['type']) => {
    switch (type) {
      case 'voice-tracking': return 'Voice Tracking';
      case 'analytics': return 'Analytics';
      case 'social-media': return 'Social Media';
      case 'custom': return 'Custom Block';
      default: return 'Unknown';
    }
  };

  const report = getReport();

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Network Privacy Guard
          </CardTitle>
          <Button 
            size="sm" 
            variant={privacyState.isActive ? 'default' : 'outline'}
            onClick={onToggle}
            className={privacyState.isActive ? 'animate-pulse' : ''}
          >
            {privacyState.isActive ? (
              <>
                <Lock className="w-4 h-4 mr-1" />
                Active
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-1" />
                Inactive
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Status Overview */}
        <div className="mb-6 p-4 rounded-lg bg-muted">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getStatusColor()} bg-opacity-20`}>
                {getStatusIcon()}
              </div>
              <div>
                <h3 className="font-semibold">Guard Status</h3>
                <p className="text-sm text-muted-foreground">
                  {privacyState.isActive ? 'Protecting your network' : 'Protection disabled'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getProtectionColor()} bg-opacity-20`}>
                {getProtectionIcon()}
              </div>
              <div>
                <h3 className="font-semibold">Protection Level</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {privacyState.protectionLevel} protection
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500 bg-opacity-20">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">Blocked Attempts</h3>
                <p className="text-sm text-muted-foreground">
                  {privacyState.violationsBlocked} violations blocked
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Protection Categories */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Protection Categories
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-red-500" />
                <span>Voice Tracking</span>
              </div>
              <Badge variant={report.blockedCategories.voiceTracking ? 'default' : 'secondary'}>
                {report.blockedCategories.voiceTracking ? 'Blocked' : 'Allowed'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span>Analytics</span>
              </div>
              <Badge variant={report.blockedCategories.analytics ? 'default' : 'secondary'}>
                {report.blockedCategories.analytics ? 'Blocked' : 'Allowed'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-purple-500" />
                <span>Social Media</span>
              </div>
              <Badge variant={report.blockedCategories.socialMedia ? 'default' : 'secondary'}>
                {report.blockedCategories.socialMedia ? 'Blocked' : 'Allowed'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Recent Violations */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Recent Blocked Attempts
            </h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
              {privacyState.currentViolations.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onClearViolations}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {showDetails && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {privacyState.currentViolations.length > 0 ? (
                privacyState.currentViolations.map((violation: PrivacyViolation, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 text-sm rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getViolationTypeColor(violation.type)}`}>
                        {getViolationTypeLabel(violation.type)}
                      </span>
                      <span className="truncate">{violation.domain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        Blocked
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No violations blocked yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy Features Summary */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            Privacy Features Active
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Blocks voice data collection from major platforms
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Prevents analytics and tracking scripts
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Stops social media data harvesting
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Network-wide protection across all applications
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Real-time monitoring and blocking
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}