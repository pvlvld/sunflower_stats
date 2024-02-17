const Escape = {
  markdownV1: escapeMarkdownV1,
  markdownV2: escapeMarkdownV2,
  html: escapeHTML,
};

function escapeMarkdownV2(str: string): string {
  return str.replace(/([-_.!|>()+#=*~{}`[\]\\])/g, "\\$1");
}

function escapeMarkdownV1(str: string): string {
  return str.replace(/([_*`[])/g, "\\$1");
}

function escapeHTML(str: string): string {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default Escape;
