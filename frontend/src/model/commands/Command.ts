export default class Command {
  public onDo: Function = function () {};
  public onUndo: Function = function () {};

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
