import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { supabase } from "../lib/supabase";

// Action function to handle POST requests from Raspberry Pi
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();
    const { devices, network_metrics, vulnerabilities } = data;

    // Process network metrics if provided
    if (network_metrics) {
      console.log('📡 Processing network metrics from Raspberry Pi:', network_metrics);
      // Here you could store network metrics in a separate table if needed
      // For now, we'll just log them
    }
    
    // Process vulnerabilities if provided
    if (vulnerabilities) {
      console.log('📡 Processing vulnerabilities from Raspberry Pi:', vulnerabilities);
      
      if (supabase) {
        // Store vulnerabilities in the database
        for (const vuln of vulnerabilities) {
          try {
            // Check if vulnerability already exists
            const { data: existingVuln } = await supabase
              .from('vulnerabilities')
              .select('id')
              .eq('cveId', vuln.cveId)
              .eq('title', vuln.title)
              .single();
            
            if (!existingVuln) {
              // Insert new vulnerability with a placeholder user_id
              const { error } = await supabase
                .from('vulnerabilities')
                .insert({
                  user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for network-scanned vulnerabilities
                  cveId: vuln.cveId,
                  title: vuln.title,
                  description: vuln.description,
                  cvssScore: vuln.cvssScore,
                  severity: vuln.severity,
                  status: vuln.status || 'open',
                  affectedDevices: [vuln.deviceId || ''],
                  discoveredAt: new Date().toISOString(),
                  patchAvailable: vuln.patchAvailable || false
                });
              
              if (error) {
                console.error('Error inserting vulnerability with placeholder user_id:', error);
                
                // If insertion with placeholder user_id fails, try to insert with the authenticated user
                try {
                  // First get the authenticated user ID if available
                  const { data: { session } } = await supabase.auth.getSession();
                  const authenticatedUserId = session?.user?.id;
                  
                  if (authenticatedUserId) {
                    // Insert with the authenticated user's ID
                    const { error: authError } = await supabase
                      .from('vulnerabilities')
                      .insert({
                        user_id: authenticatedUserId,
                        cveId: vuln.cveId,
                        title: vuln.title,
                        description: vuln.description,
                        cvssScore: vuln.cvssScore,
                        severity: vuln.severity,
                        status: vuln.status || 'open',
                        affectedDevices: [vuln.deviceId || ''],
                        discoveredAt: new Date().toISOString(),
                        patchAvailable: vuln.patchAvailable || false
                      });
                      
                    if (authError) {
                      console.error('Error inserting vulnerability with authenticated user_id:', authError);
                    }
                  } else {
                    console.log('No authenticated user found, skipping authenticated insert for vulnerability');
                  }
                } catch (authInsertError) {
                  console.error('Error during authenticated user vulnerability insert:', authInsertError);
                }
              }
            }
          } catch (insertError) {
            console.error('Error inserting vulnerability:', insertError);
          }
        }
      }
    }
    
    // Process threats if provided
    if (data.threats) {
      const threats = data.threats;
      console.log('📡 Processing threats from Raspberry Pi:', threats);
      
      if (supabase) {
        // Store threats in the database
        for (const threat of threats) {
          try {
            // Check if threat already exists
            const { data: existingThreat } = await supabase
              .from('threats')
              .select('id')
              .eq('description', threat.description)
              .eq('source', threat.source)
              .single();
            
            if (!existingThreat) {
              // Insert new threat with a placeholder user_id
              const { error } = await supabase
                .from('threats')
                .insert({
                  user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for network-scanned threats
                  type: threat.type,
                  severity: threat.severity,
                  source: threat.source,
                  target: threat.target,
                  timestamp: new Date().toISOString(),
                  blocked: threat.blocked || false,
                  auto_remediated: threat.autoRemediated || false,
                  confidence: threat.confidence || 50,
                  description: threat.description
                });
              
              if (error) {
                console.error('Error inserting threat with placeholder user_id:', error);
                
                // If insertion with placeholder user_id fails, try to insert with the authenticated user
                try {
                  // First get the authenticated user ID if available
                  const { data: { session } } = await supabase.auth.getSession();
                  const authenticatedUserId = session?.user?.id;
                  
                  if (authenticatedUserId) {
                    // Insert with the authenticated user's ID
                    const { error: authError } = await supabase
                      .from('threats')
                      .insert({
                        user_id: authenticatedUserId,
                        type: threat.type,
                        severity: threat.severity,
                        source: threat.source,
                        target: threat.target,
                        timestamp: new Date().toISOString(),
                        blocked: threat.blocked || false,
                        auto_remediated: threat.autoRemediated || false,
                        confidence: threat.confidence || 50,
                        description: threat.description
                      });
                      
                    if (authError) {
                      console.error('Error inserting threat with authenticated user_id:', authError);
                    }
                  } else {
                    console.log('No authenticated user found, skipping authenticated insert for threat');
                  }
                } catch (authInsertError) {
                  console.error('Error during authenticated user threat insert:', authInsertError);
                }
              }
            }
          } catch (insertError) {
            console.error('Error inserting threat:', insertError);
          }
        }
      }
    }
    
    // Process alerts if provided
    if (data.alerts) {
      const alerts = data.alerts;
      console.log('📡 Processing alerts from Raspberry Pi:', alerts);
      
      if (supabase) {
        // Store alerts in the database
        for (const alert of alerts) {
          try {
            // Check if alert already exists
            const { data: existingAlert } = await supabase
              .from('alerts')
              .select('id')
              .eq('title', alert.title)
              .eq('message', alert.message)
              .eq('timestamp', alert.timestamp)
              .single();
            
            if (!existingAlert) {
              // Insert new alert with a placeholder user_id
              const { error } = await supabase
                .from('alerts')
                .insert({
                  user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for network-scanned alerts
                  title: alert.title,
                  message: alert.message,
                  severity: alert.severity || 'info',
                  timestamp: alert.timestamp || new Date().toISOString(),
                  read: alert.read || false,
                  whatsapp_sent: alert.whatsappSent || false,
                  category: alert.category || 'network',
                  title_hindi: alert.titleHindi || null,
                  message_hindi: alert.messageHindi || null
                });
              
              if (error) {
                console.error('Error inserting alert with placeholder user_id:', error);
                
                // If insertion with placeholder user_id fails, try to insert with the authenticated user
                try {
                  // First get the authenticated user ID if available
                  const { data: { session } } = await supabase.auth.getSession();
                  const authenticatedUserId = session?.user?.id;
                  
                  if (authenticatedUserId) {
                    // Insert with the authenticated user's ID
                    const { error: authError } = await supabase
                      .from('alerts')
                      .insert({
                        user_id: authenticatedUserId,
                        title: alert.title,
                        message: alert.message,
                        severity: alert.severity || 'info',
                        timestamp: alert.timestamp || new Date().toISOString(),
                        read: alert.read || false,
                        whatsapp_sent: alert.whatsappSent || false,
                        category: alert.category || 'network',
                        title_hindi: alert.titleHindi || null,
                        message_hindi: alert.messageHindi || null
                      });
                      
                    if (authError) {
                      console.error('Error inserting alert with authenticated user_id:', authError);
                    }
                  } else {
                    console.log('No authenticated user found, skipping authenticated insert for alert');
                  }
                } catch (authInsertError) {
                  console.error('Error during authenticated user alert insert:', authInsertError);
                }
              }
            }
          } catch (insertError) {
            console.error('Error inserting alert:', insertError);
          }
        }
      }
    }
    
    if (!devices || !Array.isArray(devices)) {
      return new Response(JSON.stringify({ error: 'Invalid data format. Expected { devices: [...] }' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store device data in Supabase
    if (supabase) {
      // For network-scanned devices, we'll try to insert with a placeholder user ID
      // The actual implementation will depend on your RLS policies
      
      // Insert new device data
      for (const device of devices) {
        // Attempt to insert the device, handling potential RLS policy restrictions
        try {
          // Insert new device with a placeholder user_id
          // Note: This will respect your RLS policies - if the authenticated user doesn't
          // have permission to insert for another user_id, this will fail
          const { error } = await supabase
            .from('devices')
            .insert({
              user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for network-scanned devices
              name: device.name || 'Unknown Device',
              type: device.type || 'unknown',
              ip_address: device.ip,
              mac_address: device.mac,
              manufacturer: device.manufacturer || 'Unknown',
              os: device.os || 'Unknown',
              firmware: device.firmware || 'Unknown',
              status: device.status || 'safe',
              vulnerability_count: device.vulnerability_count || 0,
              last_seen: new Date().toISOString()
            });
            
          if (error) {
            console.error('Error inserting device with placeholder user_id:', error);
            
            // If insertion with placeholder user_id fails, try to insert with the authenticated user
            // This allows the endpoint to work for authenticated users
            try {
              // First get the authenticated user ID if available
              const { data: { session } } = await supabase.auth.getSession();
              const authenticatedUserId = session?.user?.id;
              
              if (authenticatedUserId) {
                // Insert with the authenticated user's ID
                const { error: authError } = await supabase
                  .from('devices')
                  .insert({
                    user_id: authenticatedUserId,
                    name: device.name || 'Unknown Device',
                    type: device.type || 'unknown',
                    ip_address: device.ip,
                    mac_address: device.mac,
                    manufacturer: device.manufacturer || 'Unknown',
                    os: device.os || 'Unknown',
                    firmware: device.firmware || 'Unknown',
                    status: device.status || 'safe',
                    vulnerability_count: device.vulnerability_count || 0,
                    last_seen: new Date().toISOString()
                  });
                  
                if (authError) {
                  console.error('Error inserting device with authenticated user_id:', authError);
                }
              } else {
                console.log('No authenticated user found, skipping authenticated insert');
              }
            } catch (authInsertError) {
              console.error('Error during authenticated user device insert:', authInsertError);
            }
          }
        } catch (insertError) {
          console.error('Error inserting device:', insertError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Processed ${devices.length} devices`, timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing device scan data:', error);
    return new Response(JSON.stringify({ error: 'Failed to process device scan data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Loader function to handle GET requests (for retrieving scan data and network metrics)
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const includeMetrics = url.searchParams.get('metrics') === 'true';
          
  if (includeMetrics) {
    // Return network metrics along with device scan info
    return new Response(JSON.stringify({ 
      message: 'Device scan and network metrics API endpoint', 
      timestamp: new Date().toISOString(),
      networkMetrics: {
        bandwidth: { download: 0, upload: 0 },
        latency: 0,
        packetLoss: 0,
        activeConnections: 0,
        connectionQuality: 'good'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    // Return device scan info only
    return new Response(JSON.stringify({ 
      message: 'Device scan API endpoint. Send POST request with device data.', 
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}