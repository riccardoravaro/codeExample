/**
 * App.Components.Playmaker.MatchUpInterface
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
export interface LiveScores {
  sport: string;
  widget: string;
  competition: number;
  season:number
  template: string;
  live: boolean;
  show_venue: boolean;
  match_status: string;
  grouping: string;
  show_grouping: boolean;
  default_nav: number;
  start_on_current: boolean;
  switch_current: number;
  sub_grouping: string;
  show_subgrouping: boolean;
  order_by: string;
  show_crests: boolean;
  date_format: string;
  date_from: string;
  date_to: string;
  month_date_format: string;
  competition_naming: string;
  team_naming: string;
  pre_match: boolean;
  show_live: boolean;
  show_logo: boolean;
  show_title: boolean;
  breakpoints: string;
}

export interface LiveScoreNested {
  sport: string;
  widget: string;
  template: string;
  live: boolean;
  competition: number | string;
  season: number | string;
  match: number | string;
  show_match_header: false;
  show_attendance: boolean;
  show_cards: boolean;
  show_crests: false;
  show_goals: boolean;
  show_goals_combined: false;
  show_penalties_missed: false;
  show_referee: boolean;
  show_subs: boolean;
  show_venue: boolean;
  show_shootouts: false;
  player_naming: string;
  player_link: string;
  show_logo: boolean;
  breakpoints: string;
}

