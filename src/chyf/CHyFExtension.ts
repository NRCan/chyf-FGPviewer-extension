import { Map } from "api/map";
import { Extension, RenderStyle } from "../extensionManager/Extension";
import { BaseGeometry } from "api/geometry";
import { MapClickEvent } from "api/events";
import { Feature } from "../extensionManager/Feature";
import { chyfService } from "./ChyfService";
import { GeojsonUtils } from "../utils/GeojsonUtils";

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
        this.geometries = geometries;

        // Trigger the layer click event for display the enhancedTable
        // The enhancedTable rz-extension must be include
        map.layers._click.next(this._layer);
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