import Command from './Command';

export default class CommandProcessor {
  MAX_UNDOS = 10;

  commands = new Array<Command | undefined>(this.MAX_UNDOS);
  currentUndos: number = 0;

  private get index(): number {
    return this.MAX_UNDOS - 1 - this.currentUndos;
  }

  public do(command: Command): void {
    while (this.currentUndos > 0) {
      this.commands.unshift(undefined);
      this.commands.pop();
      this.currentUndos--;
    }
    this.commands.shift();
    this.commands.push(command);
    command.do();
  }

  public undo(): void {
    if (this.index < 0) return;
    this.top().undo();
    this.currentUndos++;
  }

  public redo(): void {
    if (this.currentUndos == 0) return;
    this.currentUndos--;
    this.top().do();
  }

  public top(): Command {
    return this.commands[this.index] as Command;
  }
}
