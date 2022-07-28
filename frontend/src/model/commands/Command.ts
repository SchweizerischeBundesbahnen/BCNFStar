export default class Command {
  /**
   * Custom callback that is executed after the command
   * is executed or re-executed via the redo button
   */
  public onDo: () => void = function () {};
  /**
   * Custom callback that is executed after the user
   * undos this command.
   */
  public onUndo: () => void = function () {};

  protected _do(): void {}
  protected _undo(): void {}
  protected _redo(): void {}

  public do(): void {
    this._do();
    if (this.onDo) this.onDo();
  }

  public undo(): void {
    this._undo();
    if (this.onUndo) this.onUndo();
  }

  public redo(): void {
    this._redo();
    if (this.onDo) this.onDo();
  }
}
