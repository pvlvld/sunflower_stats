function parseCmdArgs(command: string): string[] | undefined[] {
  return command.split(/\s+/).slice(1);
}

export default parseCmdArgs;
