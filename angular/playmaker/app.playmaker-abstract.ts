/**
 * App.Components.PlaymakerAbstract
 * @author Riccardo Ravaro <ravaro.riccardo@gmail.com>
 */
import { ElementRef  } from '@angular/core';
import { AppController } from '../../app.controller';

export class PlaymakerAbstract extends AppController {

  /**
   * @type {ElementRef}
   * @public
   */
  public elm: ElementRef;

  /**
   * @type string
   * @public
   */
  public pmLoadClass: string = 'pm-load';

  /**
   * @type string
   * @private
   */
  private findNativeElementInterval: any;

  /**
   * @return {void}
   */
  constructor() {
    super();
    this.findNativeElement();
  }

 /**
  * @method App.PlaymakerAbstract#_findNativeElement
  * @return {Void}
  * @private
  */
  private findNativeElement() {
    this.findNativeElementInterval = setTimeout(() => {
      if(this.elm.nativeElement !== undefined) {
        this.clearPmLoadIndicator();
        this.clearFindNativeElementInterval();
      }
    }, 1000);
  }

 /**
  * @method App.PlaymakerAbstract#_clearFindNativeElementInterval
  * @return {Void}
  * @private
  */
  private clearFindNativeElementInterval() {
    clearInterval(this.findNativeElementInterval);
  }

 /**
  * @method App.PlaymakerAbstract#_clearPmLoadIndicator
  * @return {Void}
  * @private
  */
  private clearPmLoadIndicator() {
    if(this.elm.nativeElement.classList.contains(this.pmLoadClass)) {
      this.elm.nativeElement.classList.remove(this.pmLoadClass);
    }
  }

}
