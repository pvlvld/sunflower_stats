function escapeMarkdownV2(str: string): string {
  return str.replace(/([-_.!|>()+#=*~{}`[\]])/g, "\\$1");
}

export default escapeMarkdownV2;
