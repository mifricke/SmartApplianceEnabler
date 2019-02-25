export class EvStatus {
  id: number;
  name: string;
  socManual: string;

  public constructor(init?: Partial<EvStatus>) {
    Object.assign(this, init);
  }
}
