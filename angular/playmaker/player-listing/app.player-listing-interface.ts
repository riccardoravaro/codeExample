/**
 * App.Components.Playmaker.PlayerListingInterface
 * @description Player Listing interface
 * @interface
 */
export interface PlayerListing {
  teamId: number,
  filters: boolean;
  titles: boolean;
  title: string | boolean;
  showPosition: any; // (abbr, full, false)
  showNubmer: boolean;
  showLink: boolean;
  showName: boolean;
  showCaptins: boolean;
  showLoans: boolean;
  showFilterTitle: boolean;
  showImage: boolean;
  linkAsName: boolean;
  alwaysShowNumber: boolean;
  showFilterTypeOnCards: boolean;
  inlineDetails: boolean;
  showMarkers: boolean;
  basic: boolean;
  ordered: boolean;
}