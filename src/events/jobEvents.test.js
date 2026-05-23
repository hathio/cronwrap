const {
  on, off, emit, once, clearListeners, listenerCount, VALID_EVENTS
} = require('./jobEvents');

beforeEach(() => {
  clearListeners();
});

describe('on / emit', () => {
  test('calls listener when event is emitted', () => {
    const fn = jest.fn();
    on('job:start', fn);
    emit('job:start', { jobName: 'test' });
    expect(fn).toHaveBeenCalledWith({ jobName: 'test' });
  });

  test('supports multiple listeners for same event', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    on('job:success', fn1);
    on('job:success', fn2);
    emit('job:success', { jobName: 'a' });
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  test('throws on unknown event', () => {
    expect(() => on('job:unknown', jest.fn())).toThrow('Unknown event');
  });

  test('throws if listener is not a function', () => {
    expect(() => on('job:start', 'notAFunction')).toThrow('Listener must be a function');
  });

  test('does not throw when emitting event with no listeners', () => {
    expect(() => emit('job:failure', { jobName: 'x' })).not.toThrow();
  });
});

describe('off', () => {
  test('removes a specific listener', () => {
    const fn = jest.fn();
    on('job:retry', fn);
    off('job:retry', fn);
    emit('job:retry', {});
    expect(fn).not.toHaveBeenCalled();
  });

  test('does not affect other listeners', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    on('job:timeout', fn1);
    on('job:timeout', fn2);
    off('job:timeout', fn1);
    emit('job:timeout', {});
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });
});

describe('once', () => {
  test('listener is called only once', () => {
    const fn = jest.fn();
    once('job:skipped', fn);
    emit('job:skipped', { jobName: 'j' });
    emit('job:skipped', { jobName: 'j' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('listenerCount', () => {
  test('returns correct count', () => {
    on('job:start', jest.fn());
    on('job:start', jest.fn());
    expect(listenerCount('job:start')).toBe(2);
  });

  test('returns 0 for event with no listeners', () => {
    expect(listenerCount('job:failure')).toBe(0);
  });
});

describe('clearListeners', () => {
  test('clears listeners for a specific event', () => {
    on('job:start', jest.fn());
    clearListeners('job:start');
    expect(listenerCount('job:start')).toBe(0);
  });

  test('clears all listeners when no event specified', () => {
    on('job:start', jest.fn());
    on('job:success', jest.fn());
    clearListeners();
    expect(listenerCount('job:start')).toBe(0);
    expect(listenerCount('job:success')).toBe(0);
  });
});

describe('VALID_EVENTS', () => {
  test('exports the list of valid events', () => {
    expect(Array.isArray(VALID_EVENTS)).toBe(true);
    expect(VALID_EVENTS).toContain('job:start');
  });
});
