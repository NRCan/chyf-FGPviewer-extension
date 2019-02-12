import { Map } from "api/map";
import { Extension, RenderStyle } from "../extensionManager/Extension";
import { BaseGeometry } from "api/geometry";
import { MapClickEvent } from "api/events";
import { Feature } from "../extensionManager/Feature";
import { Panel } from "api/panel";
import { SimpleLayer } from "api/layers";
import { geoconnexService, CatchmentsProperties, LinkedDataObj } from "./GeoconnexService";
import { GeojsonUtils } from "../utils/GeojsonUtils";

const LINKED_DATA_PANEL: string = "linkedDataPanel"
const INFO_PANEL: string = "infoPanel";

/**
 * Geoconnex extensions
 */
export class GeoconnexExtension extends Extension {

    private _features: Feature<CatchmentsProperties>[];
    private _layerLinkedData: SimpleLayer;

    constructor(map: Map, name: string, url: string) {
        super(map, name, url);
        this._layerLinkedData = null;
    }

    public renderStyleGeometries(): RenderStyle {
        return {    
                    outlineWidth: 0,
                    fillColor: '#000000',
                    fillOpacity: 0.3
                };
    }

    public persist(): boolean {
        return true;
    }

    public async actionBtn(map: Map): Promise<void> { 
        this._features = await geoconnexService.getFeaturesCatchments(this._url);
        const geometries: BaseGeometry[] = GeojsonUtils.convertFeaturesToGeometries(this._features, this.renderStyleGeometries());
        this.geometries = geometries;
    }

    public async actionMap(map: Map, mapClickEvent: MapClickEvent): Promise<void> {

        // Get the geometry from a point
        const geometry: BaseGeometry =  GeojsonUtils.getGeometryFromPoint(mapClickEvent.xy, this._features, this.geometries);
        
        if(geometry) {
            const feature: Feature<CatchmentsProperties> = GeojsonUtils.convertGeometryToFeature(geometry, this._features);
            await this.manageInfoPanel(map, feature);
        }
        
    }

    /**
     * Manage the info panel
     * @param map - The map
     * @param feature - The feature of the geometry
     */
    private async manageInfoPanel(map: Map, feature: Feature<CatchmentsProperties>): Promise<void> {
        
        let infoPanel: Panel = this.getPanel(INFO_PANEL);
        
        // If it doesn't exit, create it
        if(!infoPanel) {
            infoPanel = this.createInfoPanel();
        }

        // Set the informations
        infoPanel.content = new infoPanel.container(
            `
                <div>${feature.properties.name} 
                ${this.createHTMLButton("linked", feature.properties.uri)}
            `
        );

        // Manage the click event on the linked button
        $(`#${INFO_PANEL}`).find("button").on("click", (event: any) => {
            const uri: string = event.currentTarget.getAttribute("featureuri")
            this.manageLinkedDataPanel(map, uri);
        });
        
        // Close the Linked data panel
        let linkedDataPanel: Panel = this.getPanel(LINKED_DATA_PANEL);
        if(linkedDataPanel) {
            linkedDataPanel.close();
        }
        
        infoPanel.open();

    }

    /**
     * Manage the linked data panel
     * @param map - The map
     * @param url - The url of the linked data
     */
    private async manageLinkedDataPanel(map: Map, url: string): Promise<void> {

        let linkedDataPanel: Panel = this.getPanel(LINKED_DATA_PANEL);
        
        // If it doesn't exit, create it
        if(!linkedDataPanel) {
            linkedDataPanel = this.createLinkedDataPanel();

            // Create a layer for the linked geometries
            const layer: SimpleLayer[] = await map.layers.addLayer("LinkedData");
            this._layerLinkedData = layer[0];
        }

        // Get the linked data objects
        const linkedDataObjs: LinkedDataObj[] = await geoconnexService.getLinkedDataObjs(url);

        // Convert the objects to a HTML list
        const html: string = this.createLinkedDataHTML(linkedDataObjs);  
        linkedDataPanel.content = new linkedDataPanel.container(html);

        // Manage the click event from buttons
        $(`#${LINKED_DATA_PANEL}`).find("li").find("button").on("click", async (event: any) => {

            let uri: string = "";

            // If it is geometries to show
            uri = event.currentTarget.getAttribute("geojson")
            if(uri) {
                this.manageclickEventGeoBouton(uri);
            }

            // If it is linked data
            uri = event.currentTarget.getAttribute("featureuri")
            if(uri) {
                this._layerLinkedData.removeGeometry();
                this.manageLinkedDataPanel(map, uri);
            }
        });

        linkedDataPanel.open();
        this.getPanel(INFO_PANEL).close();
    }

    /**
     * Create the HTML structure and list for the linked data panel from linked data objects
     * @param linkedDataObjs - The objects to convert
     */
    private createLinkedDataHTML(linkedDataObjs: LinkedDataObj[]): string {
        let listItemsHTML: string = "";
        linkedDataObjs.forEach( (obj: LinkedDataObj, index: number) => {

            // The first element represent the catchment itself
            if(index===0) {return;}

            listItemsHTML += `<li>`;
            listItemsHTML += `<strong>${obj.type}: </strong>`;
            listItemsHTML += `${obj.name}`;

            listItemsHTML += this.createHTMLButton("linked",obj.uri);
            listItemsHTML += this.createHTMLButton("html",obj.uri);
            obj.dataUris.forEach( (uri: string) => {
                listItemsHTML += this.createHTMLButton("geo", uri);
                ;
            });

            listItemsHTML += `</li>`;
        });

        const html: string = `
            <div>
                ${linkedDataObjs[0].name}
                <hr>
                <ul>
                    ${listItemsHTML}
                </ul>
            </div>
        `;

        return html;
    }

    /**
     * Create the info panel
     */
    private createInfoPanel(): Panel {

        const infoPanel: Panel = this.addPanel(INFO_PANEL);

        infoPanel.panelContents.css({
            left: "410px",
            right: "0px",
            overflow: "auto"
        });

        let closeBtn = new infoPanel.button('X');
        closeBtn.element.css('float', 'right');
        infoPanel.controls = [closeBtn];

        return infoPanel;
    }

    /**
     * Create the linked data panel
     */
    private createLinkedDataPanel(): Panel {
        const linkedDataPanel: Panel = this.addPanel(LINKED_DATA_PANEL);

        linkedDataPanel.panelContents.css({
            left: "410px",
            width: "650px"
        });

        linkedDataPanel.panelBody.css("height", "500px");

        let title: string = new linkedDataPanel.container("<h2>Linked Data</h2>");
        let closeBtn: any = new linkedDataPanel.button("X");
        let minimizeBtn: any = new linkedDataPanel.button("T");
        closeBtn.element.css("float", "right");
        linkedDataPanel.controls = [minimizeBtn, title, closeBtn];

        return linkedDataPanel;
    }

    /**
     * Manage the click event on the geo button
     * @param url - The url of the geometries
     */
    private async manageclickEventGeoBouton(url: string): Promise<void> {

        const features: Feature<any>[] = await geoconnexService.getFeaturesCatchments(url);
        const geometries: BaseGeometry[] = GeojsonUtils.convertFeaturesToGeometries(features, {   
            colour: '#9e0e0e',
            icon: "M255,0C114.75,0,0,114.75,0,255s114.75,255,255,255s255-114.75,255-255S395.25,0,255,0z M255,459    c-112.2,0-204-91.8-204-204S142.8,51,255,51s204,91.8,204,204S367.2,459,255,459z"
        });

        this._layerLinkedData.removeGeometry();
        this._layerLinkedData.addGeometry(geometries);
    }

    /**
     * Create a HTML button based on the type
     * @param type - Type must be (linked | html | geo)
     * @param url  - The button's url 
     */
    private createHTMLButton(type: string, url: string): string {

        let html: string = "";

        switch (type) {
            case "html":
                html = `<button class="md-icon-button primary md-button md-ink-ripple" type="button">
                            <a target="_blank" href="${url}">
                                <md-icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 56 56" focusable="false">
                                        <g>
                                            <path style="fill:#E9E9E0;" d="M36.985,0H7.963C7.155,0,6.5,0.655,6.5,1.926V55c0,0.345,0.655,1,1.463,1h40.074   c0.808,0,1.463-0.655,1.463-1V12.978c0-0.696-0.093-0.92-0.257-1.085L37.607,0.257C37.442,0.093,37.218,0,36.985,0z"/>
                                            <polygon style="fill:#D9D7CA;" points="37.5,0.151 37.5,12 49.349,12  "/>
                                            <path style="fill:#EC6630;" d="M48.037,56H7.963C7.155,56,6.5,55.345,6.5,54.537V39h43v15.537C49.5,55.345,48.845,56,48.037,56z"/>
                                        </g>
                                        <g>
                                            <path style="fill:#FFFFFF;" d="M17.455,42.924V53h-1.641v-4.539h-4.361V53H9.785V42.924h1.668v4.416h4.361v-4.416H17.455z"/>
                                            <path style="fill:#FFFFFF;" d="M27.107,42.924v1.121H24.1V53h-1.654v-8.955h-3.008v-1.121H27.107z"/>
                                            <path style="fill:#FFFFFF;" d="M36.705,42.924h1.668V53h-1.668v-6.932l-2.256,5.605H33l-2.27-5.605V53h-1.668V42.924h1.668    l2.994,6.891L36.705,42.924z"/>
                                            <path style="fill:#FFFFFF;" d="M42.57,42.924v8.832h4.635V53h-6.303V42.924H42.57z"/>
                                        </g>
                                        <g>
                                            <path style="fill:#EC6630;" d="M23.207,16.293c-0.391-0.391-1.023-0.391-1.414,0l-6,6c-0.391,0.391-0.391,1.023,0,1.414l6,6    C21.988,29.902,22.244,30,22.5,30s0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.023,0-1.414L17.914,23l5.293-5.293    C23.598,17.316,23.598,16.684,23.207,16.293z"/>
                                            <path style="fill:#EC6630;" d="M41.207,22.293l-6-6c-0.391-0.391-1.023-0.391-1.414,0s-0.391,1.023,0,1.414L39.086,23    l-5.293,5.293c-0.391,0.391-0.391,1.023,0,1.414C33.988,29.902,34.244,30,34.5,30s0.512-0.098,0.707-0.293l6-6    C41.598,23.316,41.598,22.684,41.207,22.293z"/>
                                        </g>
                                    </svg>
                                </md-icon>
                            </a>
                        </button>`
                break;
            case "linked":
                html = `<button featureuri="${url}" type="button" class="md-icon-button primary md-button md-ink-ripple" type="button">
                            <md-icon>
                                <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 314.000000 358.000000" focusable="false">
                                    <g transform="translate(0.000000,358.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                                        <path d="M2271 3395 c-137 -31 -267 -113 -345 -216 -88 -116 -116 -202 -121 -373 -5 -152 -23 -193 -133 -298 -199 -190 -486 -318 -643 -287 -75 14 -82 17 -134 40 -80 36 -144 49 -240 49 -160 0 -289 -50 -403 -155 -237 -220 -253 -590 -36 -824 116 -126 261 -191 424 -191 142 0 186 13 383 118 40 21 61 25 125 24 183 -2 488 -150 627 -305 75 -82 96 -132 106 -246 17 -191 93 -334 232 -438 79 -58 153 -91 245 -109 93 -18 139 -17 227 1 234 50 410 227 460 462 19 88 19 136 -1 231 -33 163 -149 325 -284 396 -30 16 -66 38 -78 50 -126 113 -173 607 -81 852 26 68 63 114 135 167 116 85 188 193 224 333 61 239 -33 489 -237 627 -129 88 -310 124 -452 92z m219 -91 c36 -8 84 -26 107 -40 50 -29 66 -49 22 -27 -65 33 -208 14 -316 -41 l-51 -25 16 -43 c19 -53 12 -87 -27 -131 -27 -30 -35 -32 -107 -37 -76 -5 -79 -6 -101 -39 -52 -77 -75 -221 -49 -306 l15 -50 -24 29 c-37 45 -65 146 -65 230 0 200 128 384 320 460 38 15 70 21 185 35 6 0 39 -6 75 -15z m-350 -1017 l105 -52 32 -65 c41 -81 59 -153 74 -288 31 -291 -36 -538 -164 -603 -23 -12 -58 -34 -77 -49 -45 -35 -87 -42 -168 -30 -246 40 -598 255 -680 417 -17 32 -22 62 -23 145 -3 97 -1 108 23 149 76 130 366 332 568 397 146 47 178 44 310 -21z m-1320 -115 c25 -11 54 -28 65 -37 l20 -17 -20 7 c-73 26 -195 13 -290 -31 -79 -36 -79 -36 -59 -76 22 -47 12 -98 -26 -136 -33 -33 -68 -43 -127 -35 -35 5 -45 2 -66 -19 -59 -59 -94 -240 -63 -328 8 -24 13 -46 11 -48 -7 -7 -57 88 -71 136 -34 111 -10 272 56 376 67 105 192 197 306 225 65 16 212 7 264 -17z m1839 -947 c33 -15 66 -35 73 -43 12 -14 10 -14 -12 -2 -62 34 -228 10 -328 -47 -42 -24 -42 -24 -27 -53 47 -90 -29 -190 -134 -176 -56 7 -82 -8 -111 -64 -50 -98 -61 -238 -24 -313 l15 -32 -22 25 c-65 74 -95 220 -70 343 38 178 192 337 374 383 80 21 193 11 266 -21z"/>
                                    </g>
                                </svg>
                            </md-icon>
                        </button>`
                break;
            case "geo":
                html = `<button geojson="${url}" class="md-icon-button primary md-button md-ink-ripple" type="button">
                            <md-icon>
                                <svg xmlns="http://www.w3.org/2000/svg" fit="" height="100%" width="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" focusable="false">
                                    <g id="place">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                                    </g>
                                </svg>
                            </md-icon>
                        </button>`
                break;
            default:
                break;
        }

        return html;
    }

}