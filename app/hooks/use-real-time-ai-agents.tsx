import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AIAgent } from '../types';

export function useRealTimeAIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    let mounted = true;

    const fetchAIAgents = async () => {
      try {
        const { data, error } = await supabase!
          .from('ai_agents')
          .select('*')
          .order('last_activity', { ascending: false });

        if (error) throw error;

        if (mounted) {
          const formattedAgents = (data || []).map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type as any,
            status: agent.status as any,
            accuracy: parseFloat(agent.accuracy),
            tasksCompleted: agent.tasks_completed,
            lastActivity: new Date(agent.last_activity),
          }));
          setAgents(formattedAgents);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching AI agents:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAIAgents();

    // Set up real-time subscription to update agents when data changes
    const agentsSubscription = supabase
      .channel('ai_agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
        },
        () => fetchAIAgents()
      )
      .subscribe();

    return () => {
      mounted = false;
      if (supabase) {
        supabase.removeChannel(agentsSubscription);
      }
    };
  }, []);

  return { agents, loading };
}