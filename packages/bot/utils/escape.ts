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

const html_replacements = Object.freeze({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
}) as Record<string, string>;
function escapeHTML(text: string) {
    return text.replace(/[<>&"]/g, (char) => html_replacements[char]);
}

export default Escape;
