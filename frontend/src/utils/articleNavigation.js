export function goToCreateArticlePage(navigate, source, extra = {}) {
  console.log('[Publish Article] Navigate to create page', {
    source,
    target: '/content/new',
    ...extra,
  });

  navigate('/content/new');
}
