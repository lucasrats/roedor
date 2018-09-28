export class Notification{
	constructor(
		public _id: string,
		public user: string,
    public status: number,
  	public type: string,
  	public timestamp: number,
  	public url: string
	){}
}
