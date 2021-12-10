export default abstract class Command {
  public onDo: Function = function () {};
  public onUndo: Function = function () {};

  protected abstract _do(): void;

  public do(): void {
    this._do();
    if (this.onDo) this.onDo();
  }

  protected abstract _undo(): void;

  public undo(): void {
    this._undo();
    if (this.onUndo) this.onUndo();
  }
}
