import { describe, it, expect } from 'vitest';
import { createMission, runInMission, getMission, useMission } from '../mission.js';

describe('Mission Module', () => {
  it('should create a fresh mission with empty object context', () => {
    const mission = createMission({ id: 'test-id' });
    expect(mission.id).toBe('test-id');
    expect(mission.agent.id).toBeDefined();
    expect(mission.agent.id).toMatch(/^agent-/);
    expect(Object.keys(mission.context).length).toBe(0);
    expect(mission.metadata.startTime).toBeDefined();
  });

  it('should inherit from parent mission', () => {
    const parent = createMission({ id: 'parent' });
    parent.context.shared = true;
    
    const child = createMission({}, parent);
    
    expect(child.id).toBe('parent');
    expect(child.agent.id).not.toBe(parent.agent.id); // Agent execution ID must be unique
    expect(child.context.shared).toBe(true);
    // Reference check: they should share the same object
    expect(child.context).toBe(parent.context);
  });

  it('should manage AsyncLocalStorage correctly', async () => {
    const mission = createMission({ id: 'async-test' });
    
    await runInMission(mission, async () => {
      const active = getMission();
      expect(active?.id).toBe('async-test');
      
      const { context, id } = useMission();
      context.foo = 'bar';
      
      expect(id).toBe('async-test');
      expect(mission.context.foo).toBe('bar');
    });
    
    expect(getMission()).toBeUndefined();
  });
});
