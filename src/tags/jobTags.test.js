const {
  setTags,
  addTags,
  removeTags,
  getTags,
  getJobsByTag,
  hasTag,
  clearTags,
  clearAllTags,
} = require('./jobTags');

beforeEach(() => {
  clearAllTags();
});

describe('setTags', () => {
  it('sets tags for a job', () => {
    setTags('myJob', ['critical', 'nightly']);
    expect(getTags('myJob')).toEqual(['critical', 'nightly']);
  });

  it('replaces existing tags', () => {
    setTags('myJob', ['old']);
    setTags('myJob', ['new']);
    expect(getTags('myJob')).toEqual(['new']);
  });

  it('deduplicates tags', () => {
    setTags('myJob', ['a', 'a', 'b']);
    expect(getTags('myJob')).toEqual(['a', 'b']);
  });

  it('throws if jobName is missing', () => {
    expect(() => setTags(null, ['a'])).toThrow('jobName is required');
  });

  it('throws if tags is not an array', () => {
    expect(() => setTags('myJob', 'critical')).toThrow('tags must be an array');
  });
});

describe('addTags', () => {
  it('adds tags without removing existing ones', () => {
    setTags('myJob', ['a']);
    addTags('myJob', ['b', 'c']);
    expect(getTags('myJob')).toEqual(['a', 'b', 'c']);
  });

  it('does not duplicate tags', () => {
    setTags('myJob', ['a']);
    addTags('myJob', ['a', 'b']);
    expect(getTags('myJob')).toEqual(['a', 'b']);
  });

  it('works on a job with no existing tags', () => {
    addTags('newJob', ['x']);
    expect(getTags('newJob')).toEqual(['x']);
  });
});

describe('removeTags', () => {
  it('removes specified tags', () => {
    setTags('myJob', ['a', 'b', 'c']);
    removeTags('myJob', ['b']);
    expect(getTags('myJob')).toEqual(['a', 'c']);
  });

  it('is a no-op for tags that do not exist', () => {
    setTags('myJob', ['a']);
    removeTags('myJob', ['z']);
    expect(getTags('myJob')).toEqual(['a']);
  });
});

describe('getJobsByTag', () => {
  it('returns all jobs with a given tag', () => {
    setTags('jobA', ['critical', 'nightly']);
    setTags('jobB', ['critical']);
    setTags('jobC', ['nightly']);
    expect(getJobsByTag('critical').sort()).toEqual(['jobA', 'jobB']);
  });

  it('returns empty array if no jobs have the tag', () => {
    expect(getJobsByTag('unknown')).toEqual([]);
  });
});

describe('hasTag', () => {
  it('returns true if job has the tag', () => {
    setTags('myJob', ['critical']);
    expect(hasTag('myJob', 'critical')).toBe(true);
  });

  it('returns false if job does not have the tag', () => {
    setTags('myJob', ['critical']);
    expect(hasTag('myJob', 'nightly')).toBe(false);
  });
});

describe('clearTags', () => {
  it('removes all tags for a job', () => {
    setTags('myJob', ['a', 'b']);
    clearTags('myJob');
    expect(getTags('myJob')).toEqual([]);
  });
});
