/**
 * App.Components.PlaymakerLastMeetings
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { Component, ElementRef, Renderer, ViewEncapsulation } from '@angular/core';
import { PlaymakerAbstract } from '../app.playmaker-abstract';
import { LastMeetingsModel } from '../../../models/last-meeting/app.last-meetings-model';
import { LastMeetings } from '../../../models/last-meeting/app.last-meetings-interface';


@Component({
   providers: [LastMeetingsModel],
   selector: 'pm-last-meeting',
   templateUrl: './tpl/playmaker-last-meetings-tpl.html',
   encapsulation: ViewEncapsulation.None
})

export class PlaymakerLastMeetings extends PlaymakerAbstract {

  /**
   * @description Widget class name
   * @private
   */
  public class: string = 'pm pm-last-meetings';

  /**
   * @description loading flag
   * @private
   */
  public loading: boolean = true;

  /**
   * @description loading flag
   * @private
   */
  public games: LastMeetings;

	/**
   * @description Widget error
   * @public
   */
	public error: string | null;

  /**
   * @description required attibutes
   * @private
   */
  public required: string[] = [];

  /**
   * @class PlaymakerLastMeetings
   * @param {ElementRef} private elm
   * @return {void}
   */
  constructor(
    public elm: ElementRef,
    public model: LastMeetingsModel) {
    super();
  }

  /**
   * @description
   * @method App.PlaymakerLastMeetings#_ngOnInit
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
      games => this.games = games,
      error => this.error = error,
      () => {
        this.loading = false;
      }
    );
  }
}



