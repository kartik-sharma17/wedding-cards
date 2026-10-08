export const ROUTES = {
  templates: "/template",
  template: (slug: string) => `/template/${slug}`,
  /** Where the user lands after a card is created. */
  card: (templateSlug: string, cardId: string) => `/templates/${templateSlug}/${cardId}`,
  login: (next?: string) => (next ? `/login?next=${encodeURIComponent(next)}` : "/login"),
};
