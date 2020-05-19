/**
 * App.Components.PlaymakerTeamComparison
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { Component, ElementRef, Renderer, ViewEncapsulation } from '@angular/core';
import { PlaymakerAbstract } from '../app.playmaker-abstract';
import { TeamComparison } from '../../../models/team-comparison/app.team-comparison-interface';
import { TeamComparisonModel } from '../../../models/team-comparison/app.team-comparison-model';


@Component({
   providers: [TeamComparisonModel],
   selector: 'pm-team-comparison',
   templateUrl: './tpl/playmaker-team-comparison-tpl.html',
   encapsulation: ViewEncapsulation.None
})

export class PlaymakerTeamComparison extends PlaymakerAbstract {

  /**
   * @description loading flag
   * @private
   */
  public loading: boolean = true;

	/**
   * @description Widget error
   * @public
   */
	public error: string | null;

  /**
   * @description Widget class name
   * @private
   */
  public class: string = 'pm pm-team-comparison';

  /**
   * @description required attibutes
   * @private
   */
  public required: string[] = [
    'team_one',
    'team_two',
    'season',
    'competition'
  ];

  public teams: TeamComparison;

  /**
   * @class PlaymakerTeamComparison
   * @param {ElementRef} private elm
   * @return {void}
   */
  constructor(
    public elm: ElementRef,
    public model: TeamComparisonModel
    ) {
    super();
  }

  /**
   * @description
   * @method App.PlaymakerTeamComparison#_ngOnInit
   * @return {void}
   * @private
   */
  private ngOnInit() {
   this.requestModel();
  }

 /**
  * @description Starts opta when view has initialised
  * @method App.PlaymakerMatchUp#requestModel
  * @return {Observable}
  * @private
  */
  private requestModel() {
    return this.model.fetch().subscribe(
      teams => this.teams = teams,
      error => this.error = error,
      () => {
        this.loading = false;
      }
    );
  }
}



