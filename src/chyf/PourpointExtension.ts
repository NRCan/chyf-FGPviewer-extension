import { Extension, RenderStyle } from "../extensionManager/Extension";
import { Feature } from "../extensionManager/Feature";
import { Map } from "api/map";
import { MapClickEvent } from "api/events";
import { Panel } from "api/panel";
import { XY, Point, BaseGeometry } from "api/geometry";
import { SimpleLayer } from "api/layers";
import { chyfService } from "./ChyfService";
import { GeojsonUtils } from "../utils/GeojsonUtils";
import { loader } from "../utils/Loader";

const POURPOINT_MAIN_PANEL_NAME: string = "pourpointPanel";
const POURPOINT_INFO_PANEL_NAME: string = "pourpointInfoPanel";

const POINT_INPUT_TEXT_ID = "pointInputTxt";
const POURPOINT_PANEL_INFO_ID = "mainPourpointInfo";
const CLEAR_INPUT_POURPOINT_CLASS = "clearInputBtn";
const POINT_ERR_LBL = "lblPointError";

// Button ids
const POINT_ADD_BTN_ID = "pointAddBtn";
const SELET_ON_MAP_BTN_ID = "selectOnMapBtn";
const CALCULATE_BTN_ID = "calculateBtn";
const ZOOM_BTN_CLASS = "zoomBtn";

// Checkbox ids
const POURPOINT_OUTPUT_CBX_ID = "outputpourpoints";
const POURPOINT_DISTANCE_CBX_ID = "pourpointdistance";
const ASSOCIATE_CATCHMENTS_CBX_ID = "associatedcatchments";
const SUBCATCHMENTS_CBX_ID = "subcatchments";
const SUBCATCHMENTS_RELATIONS_CBX_ID = "subcatchmentrelations";
const PARTITIONED_CATCHMENTS_CBX_ID = "partitionedcatchments";
const PARTITIONED_CATCHMENTS_RELATIONS_CBX_ID = "partitionedcatchmentrelations";
const INTERIOR_CATCHMENTS_CBX_ID = "interiorcatchments";
const REMOVE_HOLES_CBX_ID = "ppholes";
const INCLUDE_CBX_ID = "includestats";

export enum CODE {
    Pourpoint = "op",
    PourpointMinDstMatrix = "opdmin",
    PourpointMaxDstMatrix = "opdmax",
    PourpointPrimaryDstMatrix = "opdprimary",
    CatchmentContainmentRelationships = "ccr",
    Subcatchments = "sc",
    SubcatchmentFlowRelationships = "scr",
    PartitionedCatchments = "pc",
    PartitionedCatchmentFlowRelationships = "pcr",
    InteriorCatchments = "ic",
    PourpointRelationshipTree = "prt",
    Catchments = "c",

}

export class PourpointExtension extends Extension {

    private _features: Feature<any>[];
    private _pourpointMainPanel: Panel = null;
    private _pourpointInfoPanel: Panel = null;
    private _inputPourpoints: InputPourpoint[];
    private _btnAddPointActif: boolean = false;
    // Show the points icon on the map
    private _layerClickedPoint: SimpleLayer = null;
    // Show catchments for the mouseover event 
    private _layerOverview: SimpleLayer = null;
    private _lastIdClikedPoint: string;

    constructor(map: Map, name: string, url: string) {
        super(map, name, url);
        this._features = [];
        this._inputPourpoints = [];
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

        this._layerClickedPoint = await this.addLayer("clikedPoint");
        this._layerOverview = await this.addLayer("overviewLayer");

        this.removeAllGeometries();

        if(!this._pourpointMainPanel) {
            this._pourpointMainPanel = this.createMainPourpointPanel();
        }

        this.setBodyMainPourpointPanel();
        this._pourpointMainPanel.open();
        this.createMainPourpointBtnEvents();
        
    }

    public async actionMap(map: Map, mapClickEvent: MapClickEvent): Promise<void> {
        // If the "select on map" button is active
        if(this._btnAddPointActif) {
            // If the point was not added to the input
            // Remove the icon of the last point on map when the user selects another point on map
            if(this._lastIdClikedPoint) {
                this.removeGeometries(this._layerClickedPoint, this._lastIdClikedPoint);
            }

            this.createPointIconOnMap(mapClickEvent.xy);

            // Set the value on the inputText of the selected point
            (<HTMLInputElement>$(`#${POINT_INPUT_TEXT_ID}`)[0]).value =
                 `${mapClickEvent.xy.x.toFixed(4)},${mapClickEvent.xy.y.toFixed(4)}`;
        }
    }

    /*
        Return the Main pourpoint panel
    */
    private createMainPourpointPanel(): Panel {
        const pourpointPanel = this.addPanel(POURPOINT_MAIN_PANEL_NAME);
        const title = new pourpointPanel.container("<h2>Pourpoint</h2>");
        const closeBtn = new pourpointPanel.button("X");

        pourpointPanel.panelContents.css({left: "410px", width: "320px", bottom: 0});
        closeBtn.element.css("float", "right");

        pourpointPanel.setControls([title, closeBtn]);
        return pourpointPanel;
    }

    /*
        Set the default body to the main panel
    */
    private setBodyMainPourpointPanel() {
        this._pourpointMainPanel.setBody(
            `
            <div class="sectionTitle">Add Pourpoint</div>

            <div>
                <span class="labelPourpoint">C-Code:</span>
                <select id="addPourpointCode">
                    <option value="-2" selected="">-2</option>
                    <!-- ccode of -1 not supported at this time -->
                    <!--<option value="-1">-1</option>-->
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                </select>
            </div>

            <div id="pourpointAdd">
                <div>
                    <span class="labelPourpoint">Point: </span>
                    <input type="text" id="${POINT_INPUT_TEXT_ID}" class="${POINT_INPUT_TEXT_ID}" value="-73.27366, 45.46230">
                    <button id="${SELET_ON_MAP_BTN_ID}" class="pourpointIconBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
                            <g>
                                <path xmlns="http://www.w3.org/2000/svg" d="M256,0C153.755,0,70.573,83.182,70.573,185.426c0,126.888,165.939,313.167,173.004,321.035    c6.636,7.391,18.222,7.378,24.846,0c7.065-7.868,173.004-194.147,173.004-321.035C441.425,83.182,358.244,0,256,0z M256,278.719    c-51.442,0-93.292-41.851-93.292-93.293S204.559,92.134,256,92.134s93.291,41.851,93.291,93.293S307.441,278.719,256,278.719z"></path>
                            </g>
                        </svg>
                    </button>
                </div>
            </div>

            <div>
                <p id="${POINT_ERR_LBL}" style="display: none;">Le point n'est pas valide</p>
                <button id="${POINT_ADD_BTN_ID}" type="button" title="Add Point">Add Point</button>
            </div>

            <div class="sectionTitle">Input Pourpoints</div>
            <div>
                <div id="inputPourpoints">
                </div>
            </div>

            <div class="sectionTitle">Output Layers</div>
            <div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="${POURPOINT_OUTPUT_CBX_ID}" checked="">
                    <label class="form-check-label" for="${POURPOINT_OUTPUT_CBX_ID}">Pourpoints</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="${POURPOINT_DISTANCE_CBX_ID}" checked="">
                    <label class="form-check-label" for="${POURPOINT_DISTANCE_CBX_ID}">Output Pourpoint Distances</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="${ASSOCIATE_CATCHMENTS_CBX_ID}" checked="">
                    <label class="form-check-label" for="${ASSOCIATE_CATCHMENTS_CBX_ID}">Associated Catchments</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="${SUBCATCHMENTS_CBX_ID}" checked="">
                    <label class="form-check-label" for="${SUBCATCHMENTS_CBX_ID}">Subcatchments</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="${SUBCATCHMENTS_RELATIONS_CBX_ID}" checked="">
                    <label class="form-check-label" for="${SUBCATCHMENTS_RELATIONS_CBX_ID}">Subcatchment Relations</label>
                </div>
                <div class="form-check" style="white-space:nowrap">
                    <input class="form-check-input" type="checkbox" value="" id="${PARTITIONED_CATCHMENTS_CBX_ID}" checked="">
                    <label class="form-check-label" for="${PARTITIONED_CATCHMENTS_CBX_ID}">Partitioned Catchments</label>
                </div>
                <div class="form-check" style="white-space:nowrap">
                    <input class="form-check-input" type="checkbox" value="" id="${PARTITIONED_CATCHMENTS_RELATIONS_CBX_ID}" checked="">
                    <label class="form-check-label" for="${PARTITIONED_CATCHMENTS_RELATIONS_CBX_ID}">Partitioned Catchments Relations</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="${INTERIOR_CATCHMENTS_CBX_ID}" checked="">
                    <label class="form-check-label" for="${INTERIOR_CATCHMENTS_CBX_ID}">Interior Catchments</label>
                </div>
            </div>

            <div class="sectionTitle">Options</div>
            <div>
                <div>
                    <input class="form-check-input" type="checkbox" value="" id="${REMOVE_HOLES_CBX_ID}" checked="">
                    <label class="form-check-label" for="${REMOVE_HOLES_CBX_ID}">Remove Holes</label>
                </div>
                <div>
					<input class="form-check-input" type="checkbox" value="" id="${INCLUDE_CBX_ID}">
					<label class="form-check-label" for="${INCLUDE_CBX_ID}">Include Catchment Slope, Elevation, Aspect, &amp; Distance to Water Statistics</label>
				</div>
            </div>

            <div class="sectionTitle">Actions</div>
            <div>
                <button id=${CALCULATE_BTN_ID}>Calculate</button>
            <div>
            `
        )
    }

    /**
        Create the events for the main pourpoint panel
    */
    private createMainPourpointBtnEvents(): void {

        // Event trigger when we add a new input point
        $(`#${POINT_ADD_BTN_ID}`).click( () => {

            const xy: XY = this.getXYFromInputText(POINT_INPUT_TEXT_ID)

            // Check if the point is valid
            if(!xy) {
                (<HTMLInputElement>$(`#${POINT_ERR_LBL}`)[0]).style.display = "block";
            } else {
                this.manageAddPointButton(xy);
                (<HTMLInputElement>$(`#${POINT_ERR_LBL}`)[0]).style.display = "none";
            }
        })

        // Event trigger when we activate the "select on map" button
        $(`#${SELET_ON_MAP_BTN_ID}`).click( () => {
            if(!this._btnAddPointActif) {
                this._map.mapI.setMapCursor("crosshair");
                this._btnAddPointActif = true;
            } else {
                this._map.mapI.setMapCursor("default");
                this._btnAddPointActif = false;
            }
        });

        // Event trigger when we calculate the input pourpoints
        $(`#${CALCULATE_BTN_ID}`).click( async () => {

            loader.start();
            // Remove the last calculated catchments
            this.removeGeometries();

            // Get all checked checkboxes
            let opts: string[] = [];
            if ((<HTMLInputElement>$(`#${POURPOINT_OUTPUT_CBX_ID}`)[0]).checked) { opts.push("op"); opts.push("prt"); } 
            if ((<HTMLInputElement>$(`#${POURPOINT_DISTANCE_CBX_ID}`)[0]).checked) { opts.push("opdmin"); opts.push("opdmax"); opts.push("opdprimary"); }
            if ((<HTMLInputElement>$(`#${ASSOCIATE_CATCHMENTS_CBX_ID}`)[0]).checked) { opts.push("c"); opts.push("ccr"); } 
            if ((<HTMLInputElement>$(`#${SUBCATCHMENTS_CBX_ID}`)[0]).checked) { opts.push("sc"); } 
            if ((<HTMLInputElement>$(`#${SUBCATCHMENTS_RELATIONS_CBX_ID}`)[0]).checked) { opts.push("scr"); } 
            if ((<HTMLInputElement>$(`#${PARTITIONED_CATCHMENTS_CBX_ID}`)[0]).checked) { opts.push("pc"); } 
            if ((<HTMLInputElement>$(`#${PARTITIONED_CATCHMENTS_RELATIONS_CBX_ID}`)[0]).checked) { opts.push("pcr"); } 
            if ((<HTMLInputElement>$(`#${INTERIOR_CATCHMENTS_CBX_ID}`)[0]).checked) { opts.push("ic"); } 
            let removeHole: boolean = (<HTMLInputElement>$(`#${REMOVE_HOLES_CBX_ID}`)[0]).checked
            let includeStats: boolean = (<HTMLInputElement>$(`#${INCLUDE_CBX_ID}`)[0]).checked

            // Get all the calculated input pourpoint objects
            const pourpointDataObjs: PourpointDataObj[] = await chyfService.getPourpointData(this.url, this._inputPourpoints, opts, removeHole, includeStats);
            
            if(!this._pourpointInfoPanel) {
                this._pourpointInfoPanel = this.createPourpointInfoPanel();
            }
            this.setBodyPourpointInfoPanel(pourpointDataObjs);
            this._pourpointInfoPanel.open();
            this.createPourpointInfoTabsBtnEvents(pourpointDataObjs);

            // Show the main catchments on map
            const catchmentObj = pourpointDataObjs.find( (obj:PourpointDataObj) => obj.code == CODE.Catchments);
            catchmentObj.features.forEach( (features: Feature<any>) => {
                this._features = GeojsonUtils.getFeaturesFromGeoJSON(features);
                const geos = GeojsonUtils.convertFeaturesToGeometries(this._features,this.renderStyleGeometries());
                this.addGeometries(geos);
            });
            loader.stop();
        });
    }

    /**
        Show a point icon on map
    */
    private createPointIconOnMap(xy: XY) {
        let point: Point = new Point(Math.random() * 100000000000000, xy, {icon: 'M365.027,44.5c-30-29.667-66.333-44.5-109-44.5s-79,14.833-109,44.5s-45,65.5-45,107.5    c0,25.333,12.833,67.667,38.5,127c25.667,59.334,51.333,113.334,77,162s38.5,72.334,38.5,71c4-7.334,9.5-17.334,16.5-30    s19.333-36.5,37-71.5s33.167-67.166,46.5-96.5c13.334-29.332,25.667-59.667,37-91s17-55,17-71    C410.027,110,395.027,74.167,365.027,44.5z M289.027,184c-9.333,9.333-20.5,14-33.5,14c-13,0-24.167-4.667-33.5-14    s-14-20.5-14-33.5s4.667-24,14-33s20.5-13.5,33.5-13.5c13,0,24.167,4.5,33.5,13.5s14,20,14,33S298.36,174.667,289.027,184z'});
        this.addGeometries(point, this._layerClickedPoint);
        this._lastIdClikedPoint = point.id;
        // Add the geometries to the inputs
        this._inputPourpoints[this._inputPourpoints.length-1].geo = point;
    }

    /**
        Manage the actions of the button when adding an input pourpoints
     */
    private manageAddPointButton(xy: XY) {
        // create a new input pourpoint and show it on the panel
        const code: number = Number.parseFloat(((<HTMLInputElement>$("#addPourpointCode")[0]).value));
        const pourpoint: InputPourpoint = new InputPourpoint(xy, code, `P${this._inputPourpoints.length+1}`);
        this._inputPourpoints.push(pourpoint);
        this.addHTMLInputPourpoint(pourpoint);

        // Desactivate the "select on map" button
        this._btnAddPointActif = false;
        this._map.mapI.setMapCursor("default");

        // Create an icon if none is display for the pourpoint
        if(this._lastIdClikedPoint == null) {
            this.createPointIconOnMap(pourpoint.point);
        }

        // clear the last clicked point to keep the icon on the map
        this._lastIdClikedPoint = null;

        // Clear the point input text
        (<HTMLInputElement>$(`#${POINT_INPUT_TEXT_ID}`)[0]).value = "";
    }

    /**
     *  Return the XY point from an inputText
     */
    private getXYFromInputText(id: string): XY {
        let point: string[] = (<HTMLInputElement>$(`#${id}`)[0]).value.split(",");
        let xy: XY = new XY(Number.parseFloat(point[0]), Number.parseFloat(point[1]));

        if(isNaN(xy.x) || isNaN(xy.y)) return null
        return xy
    } 
    
    /**
     * Add an HTML input pourpoint entry
     */
    private addHTMLInputPourpoint(pourpoint: InputPourpoint) {
        $("#inputPourpoints").append(
            `
            <div>
                <input type="text" class="inputPourpointId" value="${pourpoint.id}" disabled>
                <input type="text" class="inputPourpointCode" value="${pourpoint.code}" disabled>
                <input type="text" class="inputPourpointPoint" value="${pourpoint.point.x},${pourpoint.point.y}" disabled>
                <button class="${ZOOM_BTN_CLASS} pourpointIconBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 250.313 250.313" style="enable-background:new 0 0 250.313 250.313;" xml:space="preserve">
                        <g>
                            <path xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;" d="M244.186,214.604l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76   c10.7-16.231,16.945-35.66,16.945-56.554C205.822,46.075,159.747,0,102.911,0S0,46.075,0,102.911   c0,56.835,46.074,102.911,102.91,102.911c20.895,0,40.323-6.245,56.554-16.945c0.269,0.301,0.47,0.64,0.759,0.929l54.38,54.38   c8.169,8.168,21.413,8.168,29.583,0C252.354,236.017,252.354,222.773,244.186,214.604z M102.911,170.146   c-37.134,0-67.236-30.102-67.236-67.235c0-37.134,30.103-67.236,67.236-67.236c37.132,0,67.235,30.103,67.235,67.236   C170.146,140.044,140.043,170.146,102.911,170.146z"></path>
                        </g>
                    </svg>
                </button>
                <button class="${CLEAR_INPUT_POURPOINT_CLASS} pourpointIconBtn">X</button>
            <div>
            `
        )

        // Event trigger when clicking on the zoom button
        $($(`.${ZOOM_BTN_CLASS}`)[this._inputPourpoints.length-1]).click( (event: any) => {
            this._map.setCenter(pourpoint.point);
            this._map.zoom = 18;
        });

        // Event trigger when clicking on the X button
        $($(`.${CLEAR_INPUT_POURPOINT_CLASS}`)[this._inputPourpoints.length-1]).click( (event: any) => {       
            const index: number = this._inputPourpoints.lastIndexOf(pourpoint);
            // Remove the pourpoint from the list
            this._inputPourpoints = this._inputPourpoints.slice(0,index).concat(this._inputPourpoints.slice(index+1, this._inputPourpoints.length));
            // Remove the HTML input pourpoint
            $("#inputPourpoints > div")[index].remove();
            // Remove the icon on map
            this.removeGeometries(this._layerClickedPoint, pourpoint.geo.id);
        });
    }

    /*
    ------------ INFO CATCHMENTS SECTION ------------
    Display information about the calculated input pourpoints
    */

    /**
    *   Return the Info pourpoint panel
    */
    private createPourpointInfoPanel(): Panel {
            const pourpointInfoPanel = this.addPanel(POURPOINT_INFO_PANEL_NAME);
            const title = new pourpointInfoPanel.container("<h2>Pourpoint</h2>");
            const closeBtn = new pourpointInfoPanel.button("X");

            pourpointInfoPanel.panelContents.css({left: "410px", width: "320px", bottom: 0});
            closeBtn.element.css("float", "right");

            pourpointInfoPanel.setControls([title, closeBtn]);
            return pourpointInfoPanel;
        }

    /**
    *   Set the body of the Info pourpoint panel
    */
    private setBodyPourpointInfoPanel(pourpointDataObjs: PourpointDataObj[]): void {
        let tabs: String[] = [];
        // Get all real names from the codes
        [   CODE.Catchments,
            CODE.Subcatchments, 
            CODE.PartitionedCatchments, 
            CODE.InteriorCatchments, 
            CODE.Pourpoint
        ].forEach( (code: string) => {
            let obj = pourpointDataObjs.find( (obj: PourpointDataObj) => obj.code == code);
            if(obj) {
                tabs.push(obj.name);
            }
        });

        // Generate the HTML tab buttons
        let tabsHTML = `<div><div class="tab">`;
        tabs.forEach( (name: string) => {
            tabsHTML += `<button class="tablinks" id="tab${name.replace(/\s/g, '')}">${name}</button>`;
        });
        tabsHTML += `</div></div>`;

        this._pourpointInfoPanel.setBody(
            `
            ${tabsHTML}
            <div>
                <div id="${POURPOINT_PANEL_INFO_ID}"></div>
            </div>
            `
        )
    }

    /**
     *  Create events for the tabs of the info pourpoint panel
     */
    private createPourpointInfoTabsBtnEvents(pourpointDataObjs: PourpointDataObj[]): void {
        pourpointDataObjs.forEach( (obj:PourpointDataObj) => {
            let name = obj.name.replace(/\s/g, '');

            // If Catchments
            if(obj.code == "c") {
                $(`#tab${name}`).click( () => {
                    let catchmentContainmentRelationships = pourpointDataObjs.find( (obj:PourpointDataObj) => obj.code == "ccr");
                    this.createCatchmentsHTML(obj, [catchmentContainmentRelationships]);
                    this.createInfoTableHoverEvents(obj);
                });
            }
            // If Subcatchments
            else if(obj.code == "sc") {
                $(`#tab${name}`).click( () => {
                    let subcatchmentsFlowObj = pourpointDataObjs.find( (obj:PourpointDataObj) => obj.code == "scr");
                    this.createSubCatchmentsHTML(obj, [subcatchmentsFlowObj]);
                    this.createInfoTableHoverEvents(obj);
                });
            }
            // If PartionedCatchments
            else if(obj.code == "pc") {
                $(`#tab${name}`).click( () => {
                    let partitionedCatchmentsFlowObj = pourpointDataObjs.find( (obj:PourpointDataObj) => obj.code == "pcr");
                    this.createPartitionedCatchmentsHTML(obj, [partitionedCatchmentsFlowObj]);
                    this.createInfoTableHoverEvents(obj);
                });
            }
            // If Interior Catchments
            else if(obj.code == "ic") {
                $(`#tab${name}`).click( () => {
                    this.createInteriorCatchmentsHTML(obj);
                    this.createInfoTableHoverEvents(obj);
                });
            }
            // If Pourpoints
            else if(obj.code == "op") {
                $(`#tab${name}`).click( () => {
                    let pourpointRelationshipTree = pourpointDataObjs.find( (obj:PourpointDataObj) => obj.code == "prt");
                    let pourpointMinDistanceMatrixObj = pourpointDataObjs.find( (obj:PourpointDataObj) => obj.code == "opdmin");
                    let pourpointMaxDistanceMatrixObj = pourpointDataObjs.find( (obj:PourpointDataObj) => obj.code == "opdmax");
                    this.createPourpointsHTML(obj, pourpointRelationshipTree, [pourpointMinDistanceMatrixObj, pourpointMaxDistanceMatrixObj]);
                    this.createInfoTableHoverEvents(obj);
                });
            }
        });
    }

    /**
     * Show the Catchments information
    */
    private createCatchmentsHTML(pourpointDataObj: PourpointDataObj, pourpointMatrixObj?: PourpointDataObj[]) {

        let tableCatchments = this.createInfoTable(pourpointDataObj);
        let tableMatrix = this.createMatrixTable(pourpointMatrixObj[0]);

        (<HTMLInputElement>$(`#${POURPOINT_PANEL_INFO_ID}`)[0]).innerHTML = 
        `
            <div class="sectionTitle">${pourpointDataObj.name}</div>
            <div>${tableCatchments}</div>
            <p>*Areas are provided in hectares (ha), Distances in meters (m), Elevation in meters (m), Slope in degrees (o)</p>
            <div class="sectionTitle">${pourpointMatrixObj[0].name}</div>
            <div>${tableMatrix}</div>
            <p>
                [i,j]<br>
                1 = i contains j;<br>
                -1 = i contained by j
            </p>
        `
    }

    /**
     * Show the SubCatchments information
    */
    private createSubCatchmentsHTML(pourpointDataObj: PourpointDataObj, pourpointMatrixObj?: PourpointDataObj[]) {

        let tableCatchments = this.createInfoTable(pourpointDataObj);
        let tableMatrix = this.createMatrixTable(pourpointMatrixObj[0]);

        (<HTMLInputElement>$(`#${POURPOINT_PANEL_INFO_ID}`)[0]).innerHTML = 
        `
            <p>Subcatchments are useful as a means of understanding general relationships, however they have limitations in the context of 
            some hydrologic applications as their upstream/downstream relationships may be only partly true.</p>

            <div class="sectionTitle">${pourpointDataObj.name}</div>
            <div>${tableCatchments}</div>
            <p>*Areas are provided in hectares (ha), Distances in meters (m), Elevation in meters (m), Slope in degrees (o)</p>
            <div class="sectionTitle">${pourpointMatrixObj[0].name}</div>
            <div>${tableMatrix}</div>
            <p>
                [i,j]<br>
                1 = i upstream* of j;<br>
                -1 = i downstream* of j<br>
                *Upstream and downstream (as defined on the Flow Relationships table below) may be only partly true, as the 
                definition of the subcatchments involves a subtractive process that does not guarantee a partitioned result. 
                As well, in some situations where secondary flows exist, the areas associated with different pourpoints may overlap.
                Details are provided elsewhere. For some purposes, partitioned catchments are preferred.
            </p>
        `
    }

    /**
     * Show the Partitioned Catchments information
    */
    private createPartitionedCatchmentsHTML(pourpointDataObj: PourpointDataObj, pourpointMatrixObj?: PourpointDataObj[]) {

        let tableCatchments = this.createInfoTable(pourpointDataObj);
        let tableMatrix = this.createMatrixTable(pourpointMatrixObj[0]);

        (<HTMLInputElement>$(`#${POURPOINT_PANEL_INFO_ID}`)[0]).innerHTML = 
        `
            <p>Partitioning implies that all inflows to a lower catchment flow through a single hydro node, and that the hydro node is 
            upstream of all parts of the lower catchment.</p>

            <div class="sectionTitle">${pourpointDataObj.name}</div>
            <div>${tableCatchments}</div>
            <p>*Areas are provided in hectares (ha), Distances in meters (m), Elevation in meters (m), Slope in degrees (o)</p>
            <div class="sectionTitle">${pourpointMatrixObj[0].name}</div>
            <div>${tableMatrix}</div>
            <p>
                [i,j]<br>
                1 = i upstream of j;<br>
                -1 = i downstream of j<br>
            </p>
        `
    }

    /**
     * Show the Interior Catchments information
    */
    private createInteriorCatchmentsHTML(pourpointDataObj: PourpointDataObj, pourpointMatrixObj?: PourpointDataObj[]) {

        let tableCatchments = this.createInfoTable(pourpointDataObj);

        (<HTMLInputElement>$(`#${POURPOINT_PANEL_INFO_ID}`)[0]).innerHTML = 
        `
            <div class="sectionTitle">${pourpointDataObj.name}</div>
            <div>${tableCatchments}</div>
            <p>*Areas are provided in hectares (ha), Distances in meters (m), Elevation in meters (m), Slope in degrees (o)</p>
        `
    }

    /**
     * Show the Pourpoints information
    */
    private createPourpointsHTML(pourpointDataObj: PourpointDataObj, tree: PourpointDataObj, pourpointMatrixObj?: PourpointDataObj[]) {

        pourpointDataObj.features.forEach( (feature: Feature<any>) => {
            feature.properties["Projected-X"] = feature.geometry.coordinates[0];
            feature.properties["Projected-Y"] = feature.geometry.coordinates[1];
        });

        let tableCatchments = this.createInfoTable(pourpointDataObj);
        let tableMinDistanceMatrix = this.createMatrixTable(pourpointMatrixObj[0]);
        let tableMaxDistanceMatrix = this.createMatrixTable(pourpointMatrixObj[1]);

        (<HTMLInputElement>$(`#${POURPOINT_PANEL_INFO_ID}`)[0]).innerHTML = 
        `
            <div class="sectionTitle">${pourpointDataObj.name}</div>
            <div>${tableCatchments}</div>
            <p>Raw x/y is the input data and Projected x/y is the output data.</p>

            <div class="sectionTitle">${tree.name}</div>
            <p>${tree.tree}</p>

            <div class="sectionTitle">${pourpointMatrixObj[0].name}</div>
            <div>${tableMinDistanceMatrix}</div>
            <p>
                [i,j]<br>
                distance from i to j<br>
                > 0 if i is upstream of j<br>
                < 0 if i is downstream of j<br>
            </p>

            <div class="sectionTitle">${pourpointMatrixObj[1].name}</div>
            <div>${tableMaxDistanceMatrix}</div>
            <p>
                [i,j]<\ br>
                distance from i to j<br>
                > 0 if i is upstream of j<br>
                < 0 if i is downstream of j<br>
                Distances are single valued if only one path between i and j exists.<br>
                Distances are of the form (min, max) if more than one such path exists.
            </p>
        `
    }

    /**
     * Display the specific catchment on the map when hovering over the information table
    */
    private createInfoTableHoverEvents(pourpointDataObj: PourpointDataObj) {
        $("#pourpointFeatureTable tr").mouseenter( (event: JQuery.Event) => {
            const text = (<HTMLInputElement>event.currentTarget).firstChild.textContent;
            if (text != "id") {
                const feature: Feature<any> = pourpointDataObj.features.find( (feature:Feature<any>) => feature.properties.id == text);
                if(feature) {
                    const geometry: BaseGeometry[] = GeojsonUtils.convertFeaturesToGeometries([feature], {outlineWidth: 0, fillColor: '#252425', fillOpacity: 0.3});
                    this.addGeometries(geometry, this._layerOverview);
                }
            }
        });

        $("#pourpointFeatureTable tr").mouseleave( (event: JQuery.Event) => {      
            this.removeGeometries(this._layerOverview);
        });
    }

    /**
     * Return the information table
    */
    private createInfoTable(pourpointDataObj: PourpointDataObj): string {
        let table = `<table id="pourpointFeatureTable" class="pourpointTable">`;

        table += `<thread">`;
        Object.keys(pourpointDataObj.features[0].properties).forEach( (key: string) => { 
            table += `<th>${key}</th>`
        });
        table += `</thread">`;

        pourpointDataObj.features.forEach( (feature: Feature<any>) => {
            table += `<tr>`;
            Object.values(feature.properties).forEach( (property: string) =>{
                table += `<td>${property}</td>`;
            });
            table += `</tr>`;
        });

        table += `</table>`;

        return table
    }

    /**
     * Return the matrix table
    */
    private createMatrixTable(pourpointDataObj: PourpointDataObj) {
        let table = `<table class="pourpointTable">`;

        const matrix: MatrixPourpoint = pourpointDataObj.matrix;
        table += `<thread">`;
        table += `<th></th>`;
        matrix.headers.forEach( (key: string) => { 
            table += `<th>${key}</th>`
        });
        table += `</thread">`;

        matrix.headers.forEach( (key: string, index: number) => { 
            table += `<tr>`;
            table += `<td>${key}</td>`;
            matrix.values[index].forEach((value: string) => {
                table += `<td>${value}</td>`;
            });
            table += `</tr>`;
        });

        table += `</table>`;

        return table;
    }
}



export class InputPourpoint {

    private _id: string;
    private _code: number;
    private _point : XY;
    private _geo: BaseGeometry;

    constructor(point: XY, code: number, id: string) {
        this._code = code;
        this._id = id;
        this._point = point;
    }

    set geo(geo: BaseGeometry) {
        this._geo = geo;
    }

    get geo() {
        return this._geo;
    }

    get id(): string {
        return this._id;
    }

    get code(): number {
        return this._code;
    }

    get point(): XY {
        return this._point;
    }
        
}

export class MatrixPourpoint {
    
    private _headers: string[];
    private _values: [string[]]

    constructor(headers: string[], values: [string[]]) {
        this._headers = headers;
        this._values = values;
    }

    get headers() {
        return this._headers;
    }

    get values() {
        return this._values;
    }
}

export interface PourpointDataObj {
    code: string,
    name: string,
    tree?: string,
    features?: Feature<any>[]
    matrix?: MatrixPourpoint
}