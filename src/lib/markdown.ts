import MarkdownIt from "markdown-it";
import type { MarkdownIt as MarkdownItInstance, StateCore } from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: (code, language) => {
    const className = language
      ? ` class="language-${escapeHtml(language.trim())}"`
      : "";
    return `<pre><code${className}>${escapeHtml(code)}</code></pre>`;
  },
});

function taskListsPlugin(parser: MarkdownItInstance): void {
  parser.core.ruler.after("inline", "toolmd-task-lists", (state: StateCore) => {
    state.tokens.forEach((token, index) => {
      if (token.type !== "inline" || !token.children?.length) return;
      const listItem = state.tokens[index - 2];
      const firstChild = token.children[0];
      const task =
        listItem?.type === "list_item_open" && firstChild?.type === "text"
          ? firstChild.content.match(/^\[([ xX])\]\s+/)
          : null;
      if (!task) return;

      firstChild.content = firstChild.content.slice(task[0].length);
      token.content = token.content.slice(task[0].length);
      const checkbox = new state.Token("html_inline", "", 0);
      checkbox.content = `<input class="task-list-item-checkbox" type="checkbox" disabled${task[1].toLowerCase() === "x" ? " checked" : ""}> `;
      token.children.unshift(checkbox);
      listItem.attrJoin("class", "task-list-item");

      for (let previous = index - 3; previous >= 0; previous -= 1) {
        const parent = state.tokens[previous];
        if (parent.type === "bullet_list_open" || parent.type === "ordered_list_open") {
          parent.attrJoin("class", "contains-task-list");
          break;
        }
        if (parent.type === "list_item_close") break;
      }
    });
  });
}

markdown.use(taskListsPlugin);

const defaultValidateLink = markdown.validateLink;
markdown.validateLink = (url: string): boolean => {
  if (url.startsWith("#") || url.startsWith("/")) return true;
  try {
    const protocol = new URL(url, "https://toolmd.local").protocol;
    return ["http:", "https:", "mailto:", "tel:"].includes(protocol);
  } catch {
    return defaultValidateLink(url);
  }
};

const defaultLinkOpen = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index].attrSet("target", "_blank");
  tokens[index].attrSet("rel", "noreferrer");
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options);
};

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export function renderMarkdown(source: string): string {
  return markdown.render(source);
}
