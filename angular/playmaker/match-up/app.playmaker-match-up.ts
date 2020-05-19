/**
 * App.Components.Playmaker.MatchUp
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { Component, ElementRef, Renderer, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { PlaymakerAbstract } from '../app.playmaker-abstract'
import { MatchUpModel } from '../../../models/match-up/app.match-up-model';
import { TimeHelper } from '../../../helpers/app.time-helper';
import { MatchUp } from './app.playmaker-match-up-interface';
import { MatchCentreService } from '../../../services/app.match-centre-service';

@Component({
   providers: [MatchUpModel],
   selector: 'pm-match-up',
   templateUrl: './tpl/playmaker-match-up-tpl.html',
   encapsulation: ViewEncapsulation.None
})

export class PlaymakerMatchUp extends PlaymakerAbstract {

  /**
   * @description Attributes
   * @private
   */
  public loading: boolean = true;

  /**
   * @description Attributes
   * @private
   */
  public attrs: any;

  /**
   * @description Opta match ID
   * @private
   */
	public matchId: number;

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
   * @description Stores countdown intetal
   * @public
   */
  public countDownInterval: any | boolean = false;

  /**
   * @description observer subscription for shared service data
   * @private
   */
  private subscription: any;

  /**
   * @description Widget class name
   * @public
   */
  public class: string = 'pm pm-match-up';

  /**
   * @description Component settings
   * @private
   */
  public settings: any = {
    match_id: null,
    show_competition: true,
    show_attendence: true,
    show_referee: true,
    show_venue: true,
    show_count_down: true,
    show_match_summary: true,
    match_summary_split_events: true,
    match_events_both: false,
    competition: false,
    season: false,
    match: false,
    share_sources: true,
    show_crests: true
  }

  /**
   * @description Required component settings
   * @private
   */
  public required: any = ['match_id'];

  /**
   * @description Match summary component with pre-defined settings
   * @private
   */
  public matchSummaryComponent: any = {
    data: {
      competition: null,
      season: null,
      match: null,
      show_match_header: false,
      show_score: false,
      show_attendance: false,
      show_crests: false,
      show_team_formation: false,
      show_goals: true,
      show_penalties_missed: false,
      show_halftime_score: false,
      show_referee:false,
      show_subs: false,
      show_venue: false,
      show_tooltips: false,
      show_images: false,
      show_competition_name: false,
      player_naming: 'last_name',
      show_logo: false
    },
    type: 'OptaMatchSummary'
  };

  /**
   * @class PlaymakerMatchUp
   * @param {ElementRef} private elm
   * @param {MatchUpModel} private model
   * @return {void}
   */
  constructor(
  	public elm: ElementRef,
  	private model: MatchUpModel,
    private matchCentreService: MatchCentreService
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
    if(this.settings.share_sources) {
      this.startService();
      return;
    }
    this.requestModel(this.settings.match_id);
  }

 /**
  * @description Start serivice
  * @method App.PlaymakerMatchUp#startService
  * @return {void}
  * @public
  */
  private startService() {
    this.data = this.matchCentreService.data;

    this.subscription = this.matchCentreService.change.subscribe((value) => {
      this.data = value;
      this.loading = false;
      this.initialise();
    });

    this.matchCentreService.start(this.settings.match_id);
  }

 /**
  * @description Start serivice
  * @method App.PlaymakerMatchUp#requestModel
  * @return {void}
  * @public
  */
  private requestModel(matchId) {
    return this.model.fetch(matchId).subscribe(
      matchUp => this.data = matchUp,
      error => this.error = error,
      () => {
        this.loading = false;
        this.setSides();
        this.initialise();
      }
    );
  }

 /**
	* @description Initialise components behaviours
	* @method App.PlaymakerMatchUp#initialise
	* @return {void}
	* @public
	*/
  public initialise() {
    this.loading = false;
    this.data.date_mili = TimeHelper.secondsToMiliseconds(this.data.date);
    this.matchSummaryComponent.data.competition = this.data.competition.opta_id;
    this.matchSummaryComponent.data.season = this.data.competition.season_year;
    this.matchSummaryComponent.data.match = this.data.opta_id;

    if(this.data.date_mili > Date.now()) {
      this.data.preMatch = true;
      this.startCountDown();
    }
  }

 /**
	* @description Starts count down
	* @method App.PlaymakerMatchUp#startCountDown
	* @return {void}
	* @public
	*/
  public startCountDown() {
  	this.countDownInterval = setInterval(() => {
      this.countDown = TimeHelper.getTimeDiff(this.data.date_mili);

      if(this.data.date_mili <= Date.now()) {
        this.stopCountDown();
      }

		}, 1000);
  }

  /**
   * @description Set Sides
   * @method App.PlaymakerMatchUp#setSides
   * @return {Void}
   * @public
   */
  public setSides() {
    let sideA = (this.data.advantage) ? 'home' : 'away';
    let sideB = (!this.data.advantage) ? 'home' : 'away';

    this.data[sideA] = {
      name: this.data.team.name,
      crest: this.data.team.crest_url,
      score: this.data.score.team_score,
      ninety_score: this.data.score.team_ninety_score,
      aet_score: this.data.score.team_aet_score,
      ht_score: this.data.score.team_ht_score
    }

    this.data[sideB] = {
      name: this.data.opponent_team.name,
      crest: this.data.opponent_team.crest_url,
      score: this.data.score.opponent_score,
      ninety_score: this.data.score.opponent_ninety_score,
      aet_score: this.data.score.opponent_aet_score,
      ht_score: this.data.score.opponent_ht_score
    }
  }

 /**
  * @description Stops count down
  * @method App.PlaymakerMatchUp#stopCountDown
  * @return {void}
  * @public
  */
  public stopCountDown() {
    clearInterval(this.countDownInterval);
    this.countDownInterval = false;
    this.countDown = undefined;
  }



}
