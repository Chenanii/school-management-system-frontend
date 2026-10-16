import test from 'node:test';
import assert from 'node:assert/strict';

import { workspacePath, workspaceRoute } from './workspace-routing.js';

const pageIds = new Set(['overview', 'report-cards', 'school-profile']);

test('parses existing unprefixed application routes', () => {
  assert.deepEqual(workspaceRoute('/report-cards', pageIds), {
    page: 'report-cards',
    slug: null,
  });
});

test('parses school-prefixed routes and school overview URLs', () => {
  assert.deepEqual(workspaceRoute('/greenfields/report-cards', pageIds), {
    page: 'report-cards',
    slug: 'greenfields',
  });
  assert.deepEqual(workspaceRoute('/greenfields', pageIds), {
    page: 'overview',
    slug: 'greenfields',
  });
});

test('builds prefixed and unprefixed URLs', () => {
  assert.equal(workspacePath('report-cards', 'greenfields'), '/greenfields/report-cards');
  assert.equal(workspacePath('overview', 'greenfields'), '/greenfields');
  assert.equal(workspacePath('report-cards', null), '/report-cards');
  assert.equal(workspacePath('overview', null), '/');
});
