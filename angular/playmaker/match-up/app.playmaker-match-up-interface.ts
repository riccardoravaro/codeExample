/**
 * App.Components.Playmaker.MatchUpInterface
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
export interface MatchUp {
  match_id: number;
  show_competition: boolean;
  show_attendence: boolean;
  show_referee: boolean;
  show_venue: boolean;
  show_count_down: boolean;
  show_match_summary: boolean;
  match_summary_split_events: boolean;
  competition: any;
  season: any;
  match: any;
  share_sources: boolean;
  show_crests: boolean;
}

