export class EventDto<T> {
  public readonly requestId: string;
  constructor(
    requestId: string,
    public readonly payload: T,
    public readonly retryCount: number = 0,
  ) {
    this.requestId = requestId;
  }
}
