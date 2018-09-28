export class Tournament{
	constructor(
		public _id: string,
    public name: string,
    public game: string,
    public created_by: string,
    public start_date: string,
    public max_players: number,
    public type: string,
    public rules: string,
    public active: boolean,
		public week: number,
    public bans: number,
    public bo: number,
    public lower_bracket: boolean,
    public draft: number,
    public chat: string,
		public byes: string,
		public decks: number
	){}
}
