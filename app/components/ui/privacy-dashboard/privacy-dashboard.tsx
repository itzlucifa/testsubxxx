import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../card/card';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';
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
  MicOff
} from 'lucide-react';
import type { NetworkActivity } from '../../../hooks/use-privacy-voice';

interface PrivacyDashboardProps {
  privacyStatus: 'secure' | 'warning' | 'compromised';
  networkActivity: NetworkActivity[];
  isListening: boolean;
  isWakeActive: boolean;
  onToggleWakeWord: () => void;
  className?: string;
}

export function PrivacyDashboard({
  privacyStatus,
  networkActivity,
  isListening,
  isWakeActive,
  onToggleWakeWord,
  className = ''
}: PrivacyDashboardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    switch (privacyStatus) {
      case 'secure': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'compromised': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (privacyStatus) {
      case 'secure': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'compromised': return <XCircle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getBlockedCount = () => {
    return networkActivity.filter(activity => activity.isBlocked).length;
  };

  const getRecentActivity = () => {
    return networkActivity.slice(-10);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Protection Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status Indicator */}
        <div className="mb-6 p-4 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getStatusColor()} bg-opacity-20`}>
                {getStatusIcon()}
              </div>
              <div>
                <h3 className="font-semibold capitalize">{privacyStatus} Status</h3>
                <p className="text-sm text-muted-foreground">
                  {privacyStatus === 'secure' && 'All voice data processed locally'}
                  {privacyStatus === 'warning' && 'Some suspicious activity detected'}
                  {privacyStatus === 'compromised' && 'Potential privacy breach detected'}
                </p>
              </div>
            </div>
            <Badge variant={privacyStatus === 'secure' ? 'default' : privacyStatus === 'warning' ? 'destructive' : 'secondary'}>
              {getBlockedCount()} blocked attempts
            </Badge>
          </div>
        </div>

        {/* Active Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {isListening ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-gray-400" />}
              <span>Voice Recognition</span>
            </div>
            <Badge variant={isListening ? 'default' : 'secondary'}>
              {isListening ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {isWakeActive ? <EyeOff className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              <span>Wake Word Detection</span>
            </div>
            <Button 
              size="sm" 
              variant={isWakeActive ? 'default' : 'outline'}
              onClick={onToggleWakeWord}
            >
              {isWakeActive ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* Network Activity */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <Network className="w-4 h-4" />
              Recent Network Activity
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
          
          {showDetails && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {getRecentActivity().map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 text-sm rounded border"
                >
                  <div className="flex items-center gap-2">
                    <Activity className={`w-3 h-3 ${activity.isBlocked ? 'text-red-500' : 'text-green-500'}`} />
                    <span className="truncate">{activity.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.isBlocked && (
                      <Badge variant="destructive" className="text-xs">
                        Blocked
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {networkActivity.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No network activity detected
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy Features Summary */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Privacy Features Active
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Local voice processing (no cloud transmission)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              On-device wake word detection
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Network activity monitoring
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Automatic blocking of tracking domains
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Encrypted local storage
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}