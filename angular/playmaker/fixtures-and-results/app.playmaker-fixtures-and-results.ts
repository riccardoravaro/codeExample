/**
 * App.Components.PlaymakerFixturesAndResults
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { Component, ElementRef, Renderer, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PlaymakerAbstract } from '../app.playmaker-abstract'
import { TimeHelper } from '../../../helpers/app.time-helper';
import { FixturesAndResultsModel } from '../../../models/fixtures-and-results/app.fixtures-and-results-model';
import { FixturesAndResults } from '../../../models//fixtures-and-results/app.fixtures-and-results-model-interface';
import { PlaymakerLastMeetings } from '../../playmaker/last-meetings/app.playmaker-last-meetings';
import { OptaFixtures } from '../../opta/v3/fixtures/app.opta-fixtures';
import { OptaTeamCompare } from '../../opta/v3/team-compare/app.opta-team-compare';

declare var Timeline: any;

@Component({
   providers: [FixturesAndResultsModel],
   selector: 'pm-fixtures-and-results',
   templateUrl: './tpl/playmaker-fixtures-and-results-tpl.html',
   encapsulation: ViewEncapsulation.None
})

export class PlaymakerFixturesAndResults extends PlaymakerAbstract {

  /**
   * @description Widget error
   * @public
   */
  public error: string | null;

  /**
   * @description loading flag
   * @public
   */
  public loading: boolean = true;

 /**
  * @description Selected Season
  * @public
  */
  public selectedSeason: any;

 /**
  * @description All seasons
  * @public
  */
  public seasons: any[];

 /**
  * @description All competitions
  * @public
  */
  public competitions: any[];

 /**
  * @description selected competitions
  * @public
  */
  public selectedCompetition: any;

 /**
  * @description Current seasonal month
  * @public
  */
  public currentMonth: any;

 /**
  * @description Venues
  * @public
  */
  public venues: string[] = [
    'All',
    'Home',
    'Away'
  ]

 /**
  * @description Venues
  * @public
  */
  public selectedVenue: string = 'All';

  /**
   * @description Widget class name
   * @public
   */
  public class: string = 'pm pm-fixtures-listings';

  /**
   * @description Seaonal months
   * @public
   */
  public seasonalMonths: string[];

 /**
  * @description Endpoint data
  * @type {FixturesAndResults | null}
  */
  public data: FixturesAndResults = null;

 /**
  * @description  settings
  * @public
  */
  public settings: any = {
    default_season: null,
    team_id: null,
    hasFooter: true,
    yearFormat: 'yyyy',
    timeFormat: 'H:mm'
  };

 /**
  * @description required
  * @public
  */
  public required: any[] = [
    'default_season',
    'team_id'
  ];

  public checkTimeline: any;

  /**
   * @class PlaymakerFixturesAndResults
   * @param {ElementRef} private elm
   * @return {void}
   */
  constructor(
    public elm: ElementRef,
    private model: FixturesAndResultsModel,
    public sanitizer: DomSanitizer) {
    super();
  }

  /**
   * @description
   * @method App.PlaymakerFixturesAndResults#_ngOnInit
   * @return {void}
   * @private
   */
  private ngOnInit() {
    this.updateDefaultSettings();
    this.requestModel(this.settings.default_season, this.settings.team_id);
  }

 /**
  * @method App.PlaymakerFixturesAndResults#_initialise
  * @return {Void}
  * @private
  */
  private initialise() {
    if(this.seasons === undefined) {
      this.seasons = this.data.seasons;
      this.selectedSeason = this.seasons[0];
    }
    this.seasonalMonths = this.getSeasonalMonths(this.selectedSeason.season, this.settings.yearFormat);
    this.competitions = this.selectedSeason.competitions;
    this.competitions.unshift({
      id: 0,
      name: 'All'
    });
    this.selectedCompetition = this.competitions[0];

    for(let i = 0, x = this.seasonalMonths.length; i < x; i++) {
      if(this.seasonalMonths[i]['current']) {
        this.changeMonth(this.seasonalMonths[i]);
      }
    }

    this.indexResults();
    this.loading = false;
    this.checkTimelineElement();
  }

  private checkTimelineElement() {
    this.checkTimeline = setInterval(() => {
      if(this.elm.nativeElement.querySelector('.timeline') !== null) {
        this.clearCleckTimelineElement();
        new Timeline('.timeline');
      }
    }, 1000);
  }

  private clearCleckTimelineElement() {
    clearInterval(this.checkTimeline);
  }

 /**
  * @method App.PlaymakerFixturesAndResults#_requestModel
  * @param {Number} season
  * @return {Observable}
  * @private
  */
  private requestModel(season, teamId) {
    return this.model.fetch(season, teamId).subscribe(
      response => this.data = response,
      error => this.error = error,
      () => {
        this.formatSeasonDisplayText();
        this.initialise();
      }
    );
  }

 /**
  * @method App.PlaymakerFixturesAndResults#formatSeasonDisplayText
  * @return {Void}
  * @private
  */
  private formatSeasonDisplayText() {
    this.data.seasons.forEach((value, key) => {
      let split = this.data.seasons[key].display.split('/');
      let val = 'Season ' + split[0].replace(' ', '')+'/'+split[1].replace(' ', '').split('0')[1];
      this.data.seasons[key].display = val;
    });
  }

 /**
  * @method App.PlaymakerFixturesAndResults#matchPreview
  * @param {Nubmer} index
  * @return {Boolean}
  * @private
  */
  public matchPreview(index) {
    if(!this.data.matches[index].preview_loaded) {
      this.setDynamicComponents(index);
    }
    if(!this.data.matches[index].preview_open ||
       this.data.matches[index].preview_open === undefined) {
      return this.data.matches[index].preview_open = true;
    }
    return this.data.matches[index].preview_open = false;
  }

 /**
  * @method App.PlaymakerFixturesAndResults#_setDynamicComponents
  * @param {Nubmer} index
  * @return {Void}
  * @private
  */
  private setDynamicComponents(index) {
    this.data.matches[index].components = [
      {
        data: {
          competition: `${this.data.matches[index].competition}, ${this.data.matches[index].competition}`,
          season: `${parseInt(this.selectedSeason.season)}, ${parseInt(this.selectedSeason.season)}`,
          team: `${this.data.matches[index].home.id}, ${this.data.matches[index].away.id}`,
          template:'normal',
          navigation:'tabs',
          default_nav:'1',
          show_selects: false,
          show_crests: true,
          competition_naming: 'full',
          team_naming: 'full',
          show_logo:false,
          show_title: false
        },
        type: 'OptaTeamCompare'
      },
      {
        data: {
          competition: this.data.matches[index].competition,
          season: parseInt(this.selectedSeason.season)-1,
          team: `${this.data.matches[index].home.id},${this.data.matches[index].away.id} `,
          template:'normal',
          live: false,
          team_filter:'head_to_head',
          pre_match: false,
          show_title: false,
        },
        type: 'OptaFixtures'
      },
      {
        data: {
          competition: this.data.matches[index].competition,
          season: this.data.matches[index].season,
          matchday: this.data.matches[index].gameweek,
          match_status: 'all',
          show_grouping: false,
          show_crests: false,
          team_naming: 'breif'
        },
        type: 'OptaFixtures'
      },
      {
        data: {
          match_id: this.data.matches[index].match_id,
          match_summary_split_events: false,
          show_crests: false,
          share_sources: false
        },
        type: 'PlaymakerMatchUp'
      },
    ];

    this.data.matches[index].preview_loaded = true;
  }

 /**
  * @method App.PlaymakerFixturesAndResults#changeSeason
  * @param {Any} $event
  * @return {Void}
  * @public
  */
  public changeSeason($event) {
    this.selectedSeason = $event;
    this.requestModel($event.season, this.settings.team_id);
  }

 /**
  * @method App.PlaymakerFixturesAndResults#changeMonth
  * @param {Any} $event
  * @return {Void}
  * @public
  */
  public changeMonth($event) {
    this.currentMonth = $event;
  }

 /**
  * @method App.PlaymakerFixturesAndResults#changeCompetition
  * @param {Any} $event
  * @return {Void}
  * @public
  */
  public changeCompetition($event) {
    this.selectedCompetition = $event;
  }

 /**
  * @method App.PlaymakerFixturesAndResults#changeVenue
  * @param {Any} $event
  * @return {Void}
  * @public
  */
  public changeVenue($event) {
    this.selectedVenue = $event;
  }

 /**
  * @method App.PlaymakerFixturesAndResults#_indexResults
  * @return {Void}
  * @private
  */
  private indexResults() {
    for(let index = 0, len = this.data.matches.length; index < len; index++) {
       this.data.matches[index].index = index;
    }
  }

 /**
  * @method App.PlaymakerFixturesAndResults#_competitionIdsToString
  * @return {Void}
  * @private
  */
  private competitionIdsToString(): string {
    let competitionIds: number[] = [];
    for(let competition of this.competitions) {
      competitionIds.push(competition.id);
    }
    return competitionIds.join();
  }

 /**
  * @method App.PlaymakerFixturesAndResults#_seasonsToString
  * @return {Void}
  * @private
  */
  private seasonsToString(): string {
    let seasons: number[] = [];
    let index = 0;
    for(let season of this.seasons) {
      if(index >= 2) {
        break;
      }
      seasons.push(season.season);
      index++;
    }
    return seasons.join();
  }
}







