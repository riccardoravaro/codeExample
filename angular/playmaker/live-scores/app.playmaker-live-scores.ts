/**
 * App.Components.Playmaker.MatchUp
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { Component, ElementRef, Renderer, ViewEncapsulation } from '@angular/core';
import { PlaymakerAbstract } from '../app.playmaker-abstract'
import { LiveScores, LiveScoreNested } from './app.playmaker-live-scores-interface';

/**
 * @description Define opta object
 * @type {any}
 * @public
 */
declare var Opta: any;

@Component({
   providers: [],
   selector: 'pm-live-scores',
   templateUrl: './tpl/playmaker-live-scores-tpl.html',
   encapsulation: ViewEncapsulation.None
})

export class PlaymakerLiveScores extends PlaymakerAbstract {

  /**
   * @description Attributes
   * @private
   */
  public attrs: any;

	/**
   * @description Widget error
   * @public
   */
	public error: string | null;

	/**
   * @description Match up object
   * @public
   */
  public data: any;

  /**
   * @description Match countdown;
   * @public
   */
  public countDown: any;

  /**
   * @description Widget class name
   * @public
   */
  public class: string = 'pm pm-live-scores';

  /**
   * @description Component settings
   * @private
   */
  public settings: LiveScores = {
    sport: 'football',
    widget: 'fixtures',
    competition: null,
    season: null,
    template: 'normal',
    live: false,
    show_venue: false,
    match_status: 'all',
    grouping: 'date',
    show_grouping: false,
    default_nav: 1,
    start_on_current: true,
    switch_current: 0,
    sub_grouping: 'date',
    show_subgrouping: false,
    order_by: 'date_acending',
    show_crests: false,
    date_format: 'dddd D MMMM YYYY',
    date_from: null,
    date_to: null,
    month_date_format: 'MMMM',
    competition_naming: 'full',
    team_naming: 'brief',
    pre_match: false,
    show_live: false,
    show_logo: false,
    show_title: false,
    breakpoints: '400'
  }

  /**
   * @description Nested match summary component
   * @type {LiveScoreNested}
   */
  public nestedSettings: LiveScoreNested = {
    sport: 'football',
    widget: 'match_summary',
    template: 'normal',
    live: false,
    competition: '',
    season: '',
    match: '',
    show_match_header: false,
    show_attendance: false,
    show_cards: true,
    show_crests: false,
    show_goals: true,
    show_goals_combined: false,
    show_penalties_missed: false,
    show_referee: false,
    show_subs: false,
    show_venue: false,
    show_shootouts: false,
    player_naming: 'last_name',
    player_link: '',
    show_logo: false,
    breakpoints: '400'
  }

  /**
   * @description Required component settings
   * @private
   */
  public required: any = [
    'competition',
    'season',
    'date_from',
    'date_to'
  ];

  /**
   * @class PlaymakerMatchUp
   * @param {ElementRef} private elm
   * @param {MatchUpModel} private model
   * @return {void}
   */
  constructor(
  	public elm: ElementRef
  	) {
    super();
  }

 /**
  * @description On Component init
  * @method App.PlaymakerMatchUp#_ngOnInit
  * @return {void}
  * @public
  */
  public ngOnInit() {
    this.updateDefaultSettings();
  }

  /**
   * @description
   * @method App.PlaymakerMatchUp#_ngAfterViewInit
   * @return {void}
   * @private
   */
  private ngAfterViewInit() {
    Opta.start();
  };



}
