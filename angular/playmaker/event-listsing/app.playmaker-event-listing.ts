/**
 * App.Components.PlaymakerEventListings
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { Component, ElementRef, Renderer, ViewEncapsulation, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { PlaymakerAbstract } from '../app.playmaker-abstract';
import { MatchCentreService } from '../../../services/app.match-centre-service';
import * as moment from 'moment';


/**
 * @description Global twitter object
 * @global
 */
declare var twttr: any;

@Component({
   providers: [],
   selector: 'pm-event-listing',
   templateUrl: './tpl/playmaker-event-listing-tpl.html',
   encapsulation: ViewEncapsulation.None
})

export class PlaymakerEventListing extends PlaymakerAbstract {

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
  public class: string = 'pm pm-event-listings-ingnore';

  /**
  * @description  settings
  * @public
  */
  public settings: any = {
    commentary_details: true,
    type: null,
    limit: 3,
    notification: false,
    show_event_date: false,
    date_format: 'default'
  }

  /**
   * @description
   * @public
   */
  public loadMoreAmount;

  /**
   * @description required attibutes
   * @private
   */
  public required: string[] = [
    'type'
  ];

  /**
   * @description match center service data subscription
   * @public
   */
  public subscription;

  /**
   * @description
   * @public
   */
  public subscriptionStarted: boolean = false;

  /**
   * @description
   * @public
   */
  public data: any;

  /**
   * @description current url
   * @public
   */
  public url: string;

  /**
   * @description Event Updates
   * @public
   */
  public eventUpdates: any[] = [];

   /**
   * @description Show load more button
   * @public
   */
   public showMoreButton: boolean = false;

  /**
   * @class PlaymakerEventListing
   * @param {MatchCentreService} private matchCentreService
   * @param {ElementRef} private elm
   * @param {Any} private document
   * @return {void}
   */
  constructor(
    public elm: ElementRef,
    public matchCentreService: MatchCentreService,
    @Inject(DOCUMENT) private document: any
    ) {
    super();
    this.data = matchCentreService.data;
    this.url = this.document.location.href;

    this.subscription = matchCentreService.change.subscribe((value) => {

      if(this.data !== undefined) {

        let update = this.eventsDiff(
          this.data.events[this.settings.type],
          value.events[this.settings.type]
        );

        if(this.eventUpdates.length === 0) {
          this.eventUpdates = update;
        } else {

          let pendingDiff = this.eventsDiff(
            this.eventUpdates,
            update
          );

          pendingDiff.forEach((event) => {
            this.eventUpdates.unshift(event);
          });
        }
      }

      if(!this.subscriptionStarted) {
        this.data = value;
        this.subscriptionStarted = true;
      }

      this.loading = false;
      this.renderTwitter();

    });
  }

  /**
   * @description
   * @method App.PlaymakerEventListing#_ngOnInit
   * @return {void}
   * @private
   */
  private ngOnInit() {
    this.updateDefaultSettings();
    this.loadMoreAmount = this.settings.limit;
  }

  /**
   * @description shows more items in the events list
   * @return void
   * @public
   */
  public showMore() {
    this.settings.limit = this.settings.limit+this.loadMoreAmount;
    this.renderTwitter();
  }

  /**
   * @description shows more items in the events list
   * @return void
   * @public
   */
  public afterForRender(index) {
    if((index+1) >= this.data.events[this.settings.type].length) {
      this.showMoreButton = false
      return;
    }
    this.showMoreButton = true;
  }

  /**
   * @description
   * @method App.PlaymakerEventListing#eventsDiff
   * @param arrayOne {Array}
   * @param arrayTwo {Array}
   * @return {void}
   * @public
   */
  public eventsDiff(arrayOne, arrayTwo) {
    let one = arrayOne.map(item => item.id);
    let two = arrayTwo.map(item => item.id);

    return one.map((id, index) => {
      if(two.indexOf(id) < 0) {
        return arrayOne[index];
      }
    }).concat(two.map((id, index) => {
      if(one.indexOf(id) < 0) {
        return arrayTwo[index];
      }
    })).filter(item => item != undefined);
  }

  /**
   * @description
   * @method App.PlaymakerEventListing#updateEvents
   * @return {void}
   * @public
   */
   public updateEvents() {
    this.eventUpdates.sort(function(a,b){
      return b.display_time + a.display_time
    }).forEach((event) => {
      this.data.events[this.settings.type].unshift(event);
    });
    this.eventUpdates = [];
  }

  /**
   * @description
   * @method App.PlaymakerEventListing#renderTwitter
   * @return {void}
   * @public
   */
  public renderTwitter() {
    let findTwitterWidget = setInterval(() => {
      if(typeof twttr === 'object') {
        twttr.widgets.load();
        clearFindTwitterWidget();
      }
    }, 1000);

    let clearFindTwitterWidget = () => {
      clearInterval(findTwitterWidget);
    };
  }

  /**
   * @description
   * @method App.PlaymakerEventListing#encodeUri
   * @return {void}
   * @public
   */
  public encodeLink(string) {
    if(string !== null && string !== undefined) {
      return string.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }
    return string;
  }

   /**
   * @description
   * @method App.PlaymakerEventListing#showTimeFrom
   * @param timestamp {int}
   * @return {void}
   * @public
   */
   /**
   * @description
   * @method App.PlaymakerEventListing#showTimeFrom
   * @param timestamp {int}
   * @return {void}
   * @public
   */
  public showTimeFrom(timestamp) {
    return moment.utc().endOf('day').unix() < timestamp;
  }

}
