export default abstract class Command {
  public onDo: Function = function () {};
  public onUndo: Function = function () {};

  protected abstract _do(): void;
  protected abstract _undo(): void;
  protected abstract _redo(): void;

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
