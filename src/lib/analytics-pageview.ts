export function createPageViewEvent(pathname: string): {
  eventName: 'page_view';
  params: { page_path: string };
} {
  return {
    eventName: 'page_view',
    params: { page_path: pathname },
  };
}
