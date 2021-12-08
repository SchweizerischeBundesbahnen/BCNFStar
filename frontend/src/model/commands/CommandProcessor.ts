import Command from './Command';

export default class CommandProcessor {
  MAX_UNDOS = 10;

  commands = new Array<Command>(this.MAX_UNDOS);
  currentUndos: number = 0;

  private get index(): number {
    return this.commands.length - 1 - this.currentUndos;
  }

  public do(command: Command) {
    for (let i = 0; i < this.currentUndos; i++) {
      this.commands.pop();
    }
    if (this.commands.length == this.MAX_UNDOS) this.commands.shift();
    this.commands.push(command);
    command.do();
  }

  public undo() {
    if (this.index < 0) return;
    this.commands[this.index].undo();
    this.currentUndos++;
  }

  public redo() {
    if (this.currentUndos == 0) return;
    this.currentUndos--;
    this.commands[this.index].do();
  }
}
