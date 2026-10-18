/** Positions each page's content area. Shared by the screen view and the print view. */
export const CONTENT_CSS = `
.fb-content{position:absolute;inset:var(--card-pad-y,14cqw) var(--card-pad-x,12cqw);display:flex;flex-direction:column;overflow-y:auto;scrollbar-width:none}
.fb-content::-webkit-scrollbar{display:none}
`;