function parseCmdArgs(command: string): string[] {
  return command.split(/\s+/).slice(1);
}

export default parseCmdArgs;
