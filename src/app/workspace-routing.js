export function workspaceRoute(pathname, pageIds) {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return { page: 'overview', slug: null };
  if (pageIds.has(segments[0])) return { page: segments[0], slug: null };
  if (segments.length > 1 && pageIds.has(segments[1])) {
    return { page: segments[1], slug: segments[0] };
  }
  if (segments.length === 1) return { page: 'overview', slug: segments[0] };
  return { page: 'overview', slug: null };
}

export function workspacePath(page, slug) {
  const route = page === 'overview' ? '' : `/${page}`;
  return slug ? `/${slug}${route}` : route || '/';
}
