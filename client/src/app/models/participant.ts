export class Participant{
	constructor(
		public _id: string,
		public tournament: string,
		public user: string,
		public last_updated: string,
		public checkin: boolean,
		public packs: number,
    public cards_pool: string,
    public decks: string
	){}
}
