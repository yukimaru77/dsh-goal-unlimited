import test from 'node:test'
import assert from 'node:assert/strict'
import { UNLIMITED, apply } from '../index.js'

const tick = () => new Promise(resolve => setTimeout(resolve, 5))

function harness(goal) {
  const listeners = new Map()
  const agent = { id: 'a1' }
  const edits = []
  let dispatching = false
  const ctx = {
    logger: { warn() {} },
    agents: { get: id => id === 'a1' ? agent : undefined, list: () => [agent] },
    goals: {
      get: () => goal,
      edit(target, ref, request) {
        if (dispatching) throw new Error('session append cannot reenter')
        assert.equal(ref.revision, goal.revision)
        edits.push(request)
        goal = { ...goal, ...request, revision: goal.revision + 1 }
      },
    },
    on(name, fn) { listeners.set(name, [...(listeners.get(name) ?? []), fn]) },
  }
  apply(ctx)
  const emit = (name, payload) => { dispatching = true; try { for (const fn of listeners.get(name) ?? []) fn(payload) } finally { dispatching = false } }
  return { agent, edits, emit, goal: () => goal, set: (next) => { goal = next } }
}

test('an existing capped goal is lifted at startup, outside any dispatch', async () => {
  const h = harness({ id: 'g', revision: 3, phase: 'active', maxGoalRounds: 256 })
  await tick()
  assert.deepEqual(h.edits, [{ maxGoalRounds: UNLIMITED }])
  assert.equal(h.goal().revision, 4)
})

test('a goal created with an explicit cap is lifted; lifted and complete goals are left alone', async () => {
  const h = harness(undefined)
  await tick()
  h.set({ id: 'g', revision: 1, phase: 'active', maxGoalRounds: 5 })
  h.emit('goal/changed', { agent: h.agent })
  await tick()
  assert.equal(h.goal().maxGoalRounds, UNLIMITED)
  h.emit('goal/changed', { agent: h.agent })
  await tick()
  assert.equal(h.edits.length, 1)
  h.set({ id: 'g2', revision: 1, phase: 'complete', maxGoalRounds: 5 })
  h.emit('goal/changed', { agent: h.agent })
  await tick()
  assert.equal(h.edits.length, 1)
})
