/**
 * App.Components.PlaymakerPlayerListing
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { Component, ElementRef, Renderer, ViewEncapsulation, Inject } from '@angular/core';
import { PlaymakerAbstract } from './../app.playmaker-abstract';
import { PlayerListingsModel } from './../../../models/player-listings/app.player-listings-model';
import { PlayerListing } from './app.player-listing-interface';


@Component({
   providers: [PlayerListingsModel],
   selector: 'pm-player-listing',
   templateUrl: './tpl/playmaker-player-listing-tpl.html',
   encapsulation: ViewEncapsulation.None
})
export class PlaymakerPlayerListing extends PlaymakerAbstract {

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
  public class: string = 'pm pm-player-listings';

  /**
  * @description  settings
  * @public
  */
  public settings: PlayerListing = {
    teamId: null,
    filters: true,
    titles: true,
    title: false,
    showPosition: 'abbr', // (abbr, full, false - hide)
    showNubmer: true,
    showLink: true,
    showName: true,
    showCaptins: true,
    showLoans: true,
    showFilterTitle: true,
    showImage: true,
    linkAsName: false,
    alwaysShowNumber: false,
    showFilterTypeOnCards: true,
    inlineDetails: false,
    showMarkers: false,
    basic: false,
    ordered: true
  };

  /**
   * @description required attibutes
   * @private
   */
  public required: string[] = [];

  /**
   * @description model data placeholder
   * @public
   */
  public data: any;

  /**
   * @description List of positions
   * @public
   */
  public positions: Position[] = [
    {
      short: 'all',
      long: 'all player'
    },
    {
      short: 'gk',
      long: 'goalkeeper'
    },
    {
      short: 'df',
      long: 'defender'
    },
    {
      short: 'mf',
      long: 'midfielder'
    },
    {
      short: 'fw',
      long: 'forward'
    }
  ];

  /**
   * @description Sort by options
   * @public
   */
  public sortBy: string[] = [
    'position'
  ];

  /**
   * @description Filters
   * @public
   */
   public filters: any = {
    all: [
      'position',
    ]
  };

  /**
   * @description
   * @public
   */
  public teams: any[] = []

  /**
   * @description placeholder for selected position
   * @public
   */
  public postionsInView: Position[] | Position;

  /**
   * @description Selected position
   * @public
   */
  public selectedPosition: Position;

  /**
   * @description Selected sort by
   * @public
   */
  public selectedSortBy: string = 'position';

  /**
   * @description Selected team
   * @public
   */
  public selectedTeam: string;

  /**
   * @class PlaymakerPlayerListing
   * @return {void}
   */
  constructor(
    public elm: ElementRef,
    public model: PlayerListingsModel
    ) {
    super();
    this.updateDefaultSettings();
    this.requestModel();
    this.selectedPosition = this.positions[0];
    this.selectedSortBy = 'postions';
  }

 /**
  * @description Fetches data from model
  * @method App.PlaymakerPlayerListing#requestModel
  * @return {Observable}
  * @private
  */
  private requestModel() {
    return this.model.fetch((this.settings.teamId) ? this.settings.teamId : null).subscribe(
      data => this.data = data,
      error => this.error = error,
      () => {
        this.loading = false;
        this.getTeams();
        this.setupTeam();
        this.checkQueryStringForSetTeam();
      }
    );
  }

 /**
  * @description Sets up data for currently selected team
  * @method App.PlaymakerPlayerListing#changeTeam
  * @param {String} $event
  * @return {Void}
  * @private
  */
  public changeTeam($event) {
    this.selectedTeam = $event;
    this.setupTeam();
  }

 /**
  * @description Stats object to array
  * @method App.PlaymakerPlayerListing#statsObjToArray
  * @return {Void}
  * @private
  */
  public statsObjToArray() {
    for(let i = 0, x = this.data[this.selectedTeam].length; i < x; i ++) {
      this.data[this.selectedTeam][i].statsArr = [];

      for(let prop in this.data[this.selectedTeam][i].stats) {
        this.data[this.selectedTeam][i].statsArr.push({
          name: prop,
          value: this.data[this.selectedTeam][i].stats[prop]
        });
      }
    }
  }

 /**
  * @description Filter event
  * @method App.PlaymakerPlayerListing#filter
  * @return {Void}
  * @public
  */
  public filter() {
    this.selectedSortBy = this.filters[this.selectedPosition.short][0];
  }

 /**
  * @description gets the stats options from the data response
  * @method App.PlaymakerPlayerListing#getStatsFilterOptions
  * @return {Void}
  * @private
  */
  private getStatsFilterOptions() {
    for(let propery in this.data[this.selectedTeam][0].stats) {
      this.sortBy.push(propery);
    }
  }

 /**
  * @description Generate filters from play data
  * @method App.PlaymakerPlayerListing#generateFilters
  * @return {Void}
  * @private
  */
  private generateFilters() {
    for(let position of this.positions) {
      if(position.short === 'all') {
        continue;
      }

      this.filters[position.short] = [];

      for(let player of this.data[this.selectedTeam]) {
        if(player.position.short === position.short) {
          this.filters[position.short] = [];

          for(let key in player.stats) {
            this.filters[position.short].push(key);
            this.filters.all.push(key);

            this.filters.all = this.filters.all.filter((filter, index) => {
              return this.filters.all.indexOf(filter) == index;
            })
          }

          break;
        }
      }
    }

    this.filter();
    return;
  }

 /**
  * @description Get a list of teams from model
  * @method App.PlaymakerPlayerListing#getTeams
  * @return {Void}
  * @private
  */
  private getTeams() {
    for(let team in this.data){
      this.teams.push(team);
    }
    this.selectedTeam = this.teams[0];
  }

 /**
  * @description Sets up data for currently selected team
  * @method App.PlaymakerPlayerListing#setupTeam
  * @return {Void}
  * @private
  */
  private setupTeam() {
    this.getStatsFilterOptions();
    this.statsObjToArray();
    this.generateFilters();
  }

 /**
  * @description Sets up data for currently selected team
  * @method App.PlaymakerPlayerListing#checkQueryString
  * @return {Void}
  * @private
  */
  private checkQueryStringForSetTeam() {
    let team = this.getParameterByName('team');
    if(team !== null) {
      this.changeTeam(team);
    }
  }
}

/**
 * @interface Postion
 */
export interface Position {
  short: string;
  long: string;
}


