import { Tournament } from '../models/tournament';
import { User } from '../models/user';

export class Match{
	constructor(
		public _id: string,
		public tournament: Tournament,
		public game: string,
		public match_date: string,
		public status: number,
		public reporter: string,
		public week: number,
    public group: number,
    public home: User,
    public away: User,
    public homeAccept: boolean,
    public awayAccept: boolean,
    public homeScore: number,
    public awayScore: number,
		public go_round: number,
		public this_round: number,
    public chat: string,
    public metadata: string,
		public isEditable: boolean
	){}
}
