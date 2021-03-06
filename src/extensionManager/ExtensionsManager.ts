import { Extension } from "./Extension";
import { MapClickEvent } from "api/events";
import { Map } from "api/map";
import { SimpleLayer } from "api/layers";

const PANEL_EXTENSION = "panel-extensions";

/**
 * The extensions manager allows to create the HTML component of the extensions and bind the events on buttons and map
 */
export class ExtensionsManager {

    private _map: Map;
    private _name: String;
    private _extensions: Extension[];
    private _HTMLName: string = "";
    private _baseMapChanged = false;

    public constructor(api: Map, name: string) {
        this._HTMLName = name;
        // Remove space in the name   
        this._name = name.replace(/\s/g, '');
        this._map = api;

        if( $(`#mainExtensions${this._name}`).length != 0 ) {
            this._baseMapChanged = true;
        }

        // Global variable to know which extension is selected
        (<any>window).SELECTED_EXTENSION = null;
        this._extensions = [];

        this.init(); 
    }

    /**
     * Initialise the events on buttons and map and create the HTML base extension component.
     */
    private init(): void{
        this.createHTMLBaseComponent();
        this.manageClickEventMap();
    }

    /**
     * Create the HTML extensions base component.
     */
    private createHTMLBaseComponent(): void {
        if ( $("ul.rv-legend-level-0").length ) {

            // Check if basemap has changed to not duplicate extensions
            if(this._baseMapChanged) {
                return;
            }

            // Create the HTML base for the extensions
            $("ul.rv-legend-level-0").after(
                `<div class="ng-isolate-scope border-top">
                    <div id="mainExtensions${this._name}" class="main-appbar rv-whiteframe-z2">
                        <h2 class="md-headline title-extensions ng-scope">${this._HTMLName}</h2>
                    </div>
                </div>
                
                <ul class="${PANEL_EXTENSION}"></ul>
                `
            );
        }
    }

    /**
     * Add extensions to the manager
     * @param extensions - The extensions to add
     */
    public addExtensions(extensions: Extension[]): void {

        if(this._baseMapChanged) {
            return;
        } 

        extensions.forEach( async (extension: Extension, index: number) => {

            this._extensions.push(extension);
        
            if(!this._baseMapChanged) {
                this.addHTMLButton(extension);
            } 
            
            // Create a layer from the button
            const layer: SimpleLayer = await extension.addLayer(extension.name);

            // Manage click event on extension
            $(`#${extension.name}`).click( async () => {
                await this.manageClickEventBtn(extension);
            });
        }); 

        this.manageClickEventClearButton();
    }

    /**
     * Add a button to the base component
     * @param name - The extension's name
     */
    private addHTMLButton(extension: Extension) {
        $(`ul.${PANEL_EXTENSION}`).first().append(`
            <li>
                ${extension.HTMLElement}
                <div class="clearExtension">
                    <md-button ext="${extension.name}" type="button" aria-label="${extension.name}" class="md-icon-button primary rv-icon-20 md-button md-ink-ripple">
                        <md-icon md-svg-src="action:search" class="ng-scope" role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="90%" height="90%" version="1.1">
                                <g>
                                    <path d="m478.1875 237.945312c22.070312-22.070312 22.070312-57.980468 0-80.050781l-140.867188-140.867187c-10.660156-10.660156-24.871093-16.527344-40.023437-16.527344s-29.367187 5.867188-40.023437 16.527344l-141.859376 141.855468 220.917969 220.917969zm0 0"/>
                                    <path d="m497 399.265625h-183.625l-219.171875-219.167969-77.652344 77.652344c-22.066406 22.066406-22.066406 57.976562 0 80.046875l87.074219 87.074219c2.8125 2.816406 6.628906 4.394531 10.605469 4.394531h382.769531c8.28125 0 15-6.714844 15-15s-6.71875-15-15-15zm0 0"/>
                                </g>
                            </svg>
                        </md-icon>
                    </md-button>
                </div>
            </li>
        `);
    }

    /**
     * Manage the click event on an extension
     * @param extension - The clicked extension
     */
    private async manageClickEventBtn(extension: Extension): Promise<void> {

        //if(extension === this._selectedExtension) {
        if( (<any>window).SELECTED_EXTENSION === null) { 
            (<any>window).SELECTED_EXTENSION = {
                name: ""
            }
        }
        if( (<any>window).SELECTED_EXTENSION.name === extension.name ) {
            this.deselectAll();
        } else {
            // Need to deselect every buttons when we select a new button for remove unwanted state
            this.deselectAll();
            (<any>window).SELECTED_EXTENSION = extension;
            $(`#${extension.name}`).css("background-color", "#ECECEC");
            // Extension-specific actions
            await extension.actionBtn(this._map);
        }
    }

    /**
     * Remove selected state and style for every buttons
     */
    private deselectAll(): void {
        $(`ul.${PANEL_EXTENSION}`).toArray().forEach((panel) => {
            const liArray: Element[] = Array.from(panel.children); 
            liArray.forEach( (li: HTMLElement) => {
                li.children[0].removeAttribute("style");
            });
        });

        this._map.mapI.setMapCursor("default");
        (<any>window).SELECTED_EXTENSION = null;
    }

    /**
     * Manage the click events on the map
     */
    private manageClickEventMap(): void {
        this._map.click.subscribe( async (mapClickEvent: MapClickEvent) => {

            const selectedExtension = (<any>window).SELECTED_EXTENSION;
            if(selectedExtension) {

                // Extension-specific actions
                await selectedExtension.actionMap(this._map, mapClickEvent);
                
                // Allows to not open the details panel
                $($(".rv-esri-map")[0]).removeClass("rv-map-highlight");
                this._map.panelRegistryAttr.find( panel => panel.idAttr == "details").close();

                if (!selectedExtension.persist()) {
                    this.deselectAll();
                }
            }
        });
    }

    /**
     * Add a component in the extensions menu
     * @param component - The component to add
     */
    public addHTMLComponent(component: string): void {
        if(!this._baseMapChanged) {
            $(`ul.${PANEL_EXTENSION}`).first().append(`<li>${component}</li>`);
        } 
    }

    /**
     * Add a button to clear the active layer.
     */
    private manageClickEventClearButton(): void {
        $(".clearExtension").find("md-button").click( (event: JQuery.Event) => {
            const id = $(event.currentTarget).attr("ext");
            const extension = this._extensions.find( (extension: Extension) => {
                return id == extension.name;
            });   
            
            if(extension) {
                extension.removeAllGeometries();
                this.deselectAll();
                extension.closePanels();
            }
        });
    }

}

