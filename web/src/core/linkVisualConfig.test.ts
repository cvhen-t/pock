import { describe, expect, it } from 'vitest';

import { formatLinkHint, parseLinkVisual } from './linkVisualConfig';

describe('linkVisualConfig', () => {
  it('formatLinkHint 替换占位符', () => {
    const visual = parseLinkVisual({
      linkHints: { willConnect: '松手后将连接{target}' },
    });
    expect(formatLinkHint(visual.linkHints.willConnect, { target: '传送节点' })).toBe(
      '松手后将连接传送节点',
    );
  });

  it('parseLinkVisual 含 breakEdgeColor 与 linkHints 默认值', () => {
    const visual = parseLinkVisual({});
    expect(visual.breakEdgeColor).toBe('#b04040');
    expect(visual.linkHints.tooFar).toContain('{distance}');
  });
});
