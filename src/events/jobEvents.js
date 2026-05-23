/**
 * Simple event emitter for job lifecycle events.
 * Allows external code to hook into job start, success, failure, etc.
 */

const listeners = {};

const VALID_EVENTS = ['job:start', 'job:success', 'job:failure', 'job:retry', 'job:timeout', 'job:skipped'];

function on(event, listener) {
  if (!VALID_EVENTS.includes(event)) {
    throw new Error(`Unknown event: "${event}". Valid events: ${VALID_EVENTS.join(', ')}`);
  }
  if (typeof listener !== 'function') {
    throw new Error('Listener must be a function');
  }
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(listener);
}

function off(event, listener) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(l => l !== listener);
}

function emit(event, payload) {
  if (!listeners[event]) return;
  for (const listener of listeners[event]) {
    try {
      listener(payload);
    } catch (err) {
      console.error(`[jobEvents] Listener for "${event}" threw an error:`, err);
    }
  }
}

function once(event, listener) {
  function wrapper(payload) {
    listener(payload);
    off(event, wrapper);
  }
  on(event, wrapper);
}

function clearListeners(event) {
  if (event) {
    listeners[event] = [];
  } else {
    for (const key of Object.keys(listeners)) {
      listeners[key] = [];
    }
  }
}

function listenerCount(event) {
  return listeners[event] ? listeners[event].length : 0;
}

module.exports = { on, off, emit, once, clearListeners, listenerCount, VALID_EVENTS };
