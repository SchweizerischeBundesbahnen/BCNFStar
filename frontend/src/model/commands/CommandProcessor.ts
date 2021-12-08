import Command from './Command';

export default class CommandProcessor {
  MAX_UNDOS = 10;

  commands = new Array<Command>(this.MAX_UNDOS);
  currentUndos: number = 0;

  private get index(): number {
    return this.commands.length - 1 - this.currentUndos;
  }

  public do<T, V>(command: Command<T, V>): T {
    while (this.currentUndos > 0) {
      this.commands.pop();
      this.currentUndos--;
    }
    if (this.commands.length == this.MAX_UNDOS) this.commands.shift();
    this.commands.push(command);
    return command.do();
  }

  public undo(): any {
    if (this.index < 0) return undefined;
    let result: any = this.commands[this.index].undo();
    this.currentUndos++;
    return result;
  }

  public redo(): any {
    if (this.currentUndos == 0) return;
    this.currentUndos--;
    return this.commands[this.index].do();
  }
}
