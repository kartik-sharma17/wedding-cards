export const ROUTES = {
  templates: "/template",
  template: (slug: string) => `/template/${slug}`,
  card: (templateSlug: string, cardId: string) => `/card/${templateSlug}/${cardId}`,
  login: (next?: string) => (next ? `/login?next=${encodeURIComponent(next)}` : "/login"),
};
