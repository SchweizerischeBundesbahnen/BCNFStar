export default abstract class Command<T = any, V = any> {
  public abstract do(): T;

  public abstract undo(): V;
}
