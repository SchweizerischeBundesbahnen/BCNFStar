import Command from './Command';

export default class CommandProcessor {
  MAX_UNDOS = 10;

  private commands = new Array<Command | undefined>(this.MAX_UNDOS);
  private currentUndos: number = 0;

  private get index(): number {
    return this.MAX_UNDOS - 1 - this.currentUndos;
  }

  public get length(): number {
    return this.commands.filter((command) => command).length;
  }

  public canUndo(): boolean {
    return this.length > this.currentUndos;
  }

  public canRedo(): boolean {
    return this.currentUndos > 0;
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
    if (!this.canUndo()) return;
    this.top().undo();
    this.currentUndos++;
  }

  public redo(): void {
    if (!this.canRedo()) return;
    this.currentUndos--;
    this.top().redo();
  }

  public top(): Command {
    return this.commands[this.index] as Command;
  }
}
