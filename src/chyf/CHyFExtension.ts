import { Map } from "api/map";
import { Extension, RenderStyle } from "../extensionManager/Extension";
import { BaseGeometry } from "api/geometry";
import { MapClickEvent } from "api/events";
import { Feature } from "../extensionManager/Feature";
import { chyfService } from "./ChyfService";
import { GeojsonUtils } from "../utils/GeojsonUtils";
import { Panel } from "api/panel";

const PANEL_TABLE_NAME = "panelTableName";

/**
 * Hydraulic's extensions
 */
export class CHyFExtension extends Extension {

    private _features: Feature<any>[];

    constructor(map: Map, name: string, url: string) {
        super(map, name, url);
        this._features = [];
    }

    public renderStyleGeometries(): RenderStyle {
        return {    
                    outlineWidth: 0,
                    fillColor: '#000000',
                    fillOpacity: 0.3
                };
    }

    public persist(): boolean {
        return false;
    }

    public async actionBtn(map: Map): Promise<void> { 
        map.mapI.setMapCursor("crosshair");
    }

    public async actionMap(map: Map, mapClickEvent: MapClickEvent): Promise<void> {

        let removeHoles: boolean = false;
        if($("#removeHoles")) {
            removeHoles = (<any>($("#removeHoles")[0])).checked;
        }

        this._features = await chyfService.getFeatureByPoint(this._url, mapClickEvent.xy, removeHoles);
        this.setAttributesByFeatures(this._features);
        const geometries: BaseGeometry[] = GeojsonUtils.convertFeaturesToGeometries(this._features, this.renderStyleGeometries());
        this.setGeometries(geometries);

        let panelTable: Panel = this.createTablePanel();
        const HTMLTable = this.createInfoTable();
        this.setBodyPanel(panelTable, HTMLTable);
        panelTable.open();
    }

        /**
     * Return the information table
    */
    private createInfoTable(): string {
        let table = `<table id="pourpointFeatureTable" class="pourpointTable">`;

        table += `<thread">`;
        Object.keys(this._features[0].properties).forEach( (key: string) => { 
            table += `<th>${key}</th>`
        });
        table += `</thread">`;

        this._features.forEach( (feature: Feature<any>) => {
            table += `<tr>`;
            Object.values(feature.properties).forEach( (property: string) =>{
                table += `<td>${property}</td>`;
            });
            table += `</tr>`;
        });

        table += `</table>`;

        return table
    }

    private createTablePanel(): Panel {
        const pourpointPanel = this.addPanel(PANEL_TABLE_NAME);
        const title = new pourpointPanel.container("<h2>Information</h2>");
        const closeBtn = new pourpointPanel.button("X");

        pourpointPanel.panelContents.css({left: "410px", width: "60%", height: "250px"});
        closeBtn.element.css("float", "right");

        pourpointPanel.setControls([title, closeBtn]);
        return pourpointPanel;
    }

    private setBodyPanel(panel: Panel, info: string) {
        panel.setBody(info);
    }
}

export interface ResponseChyfJSON {
    ID: number,
    geometry: {
        type: string,
        coordinates: any
    },
    properties: {
        area?: number
    },
    responseMetadata?: {
        executionTime: number
    },
    type?: string
}