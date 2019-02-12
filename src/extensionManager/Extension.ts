import { Map } from "api/map";
import { BaseGeometry } from "api/geometry";
import { SimpleLayer } from "api/layers";
import { MapClickEvent } from "api/events";
import { Panel } from "api/panel";
import { Feature } from "./Feature";

/**
 * All extensions must derive from this class. Not intented to be instantiated on its own.
 */
export abstract class Extension {

    protected _map: Map;
    protected _url: string;
    protected _layer: SimpleLayer;
    protected _panels: Panel[];
    // The id of the extension
    protected _name: string;

    //The HTML displayed name
    protected _nameHTML: string;

    constructor(map: Map, name: string, url: string) {
        this._url = url;
        this._nameHTML = name;

        // Remove space in the name
        this._name = name.replace(/\s/g, '');
        this._layer = null;
        this._panels = [];
        this._map = map;
    }

    /**
     * Return the extension's name
     * @return The extension's name
     */
    get name(): string {
        return this._name;
    }

    /**
     * Return the url of the endpoind
     * @return The endpoind's url
     */
    get url(): string {
        return this._url;
    }

    /**
     * Set the extension's layer
     * @param layer - The layer to set
     */
    set layer(layer: SimpleLayer) {
        this._layer = layer;
    }

    /**
     * Get the extension's attributes
     * @return The extension's attributes
     */
    get attributes(): any {
        return this._layer.getAttributes();
    }

    /**
     * Set the extension layer's attributes
     * @param attrs - The attributes to set
     */
    set attributes(attrs: any) {
        if(!this._layer) {
            throw new Error("The extension's layer is null");
        }

        if (!(attrs instanceof Object)) {
            throw new Error("The attributes must be a object");
        }

        this._layer._attributeArray = [attrs]; 
    }

    /**
     * Set the extension layer's attributes by feature properties
     * @param features - The features to parse 
     */
    setAttributesByFeatures(features: Feature<any>[]): void {
        let objs: any[] = [];
        features.forEach( (feature: Feature<any>) => {
            objs.push(feature.properties);
        });

        this._layer._attributeArray = objs; 
    }

    /**
     * Get the extension's geometries
     * @return the extension's geometries
     */
    get geometries(): BaseGeometry[] {
        return this._layer.geometry;
    }

    /**
     * Set the extension layer's geometries 
     * @param geometries - The geometries to change to
     */
    set geometries(geometries: BaseGeometry[]) {

        // If the layer has geometries, remove them
        if(this._layer.geometry && this._layer.geometry.length !== 0) {
            this._layer.removeGeometry();
        }

        this._layer.addGeometry(geometries);
    }

    /**
     * Add geometries to the layer
     * @param geometries - The geometries to add
     */
    public addGeometries(geometries: BaseGeometry[]) {
        this._layer.addGeometry(geometries);
    }

    /**
     * Remove all geometries from a layer
     */
    public removeGeometries() {
        this._layer.removeGeometry();
    }

    /**
     * Add a panel to the extension
     * @param panel - The panel to add
     */
    public addPanel(name: string): Panel {
        const panel: Panel = this._map.createPanel(name);
        this._panels.push(panel)
        return panel;
    }

    /**
     * Find a panel by it id
     * @param id - The panel's name
     */
    public getPanel(id: string) {
        return this._panels.find( (panel:Panel) => {
            return panel.id == id;
        });
    }

    /**
     *  Get the HTML element of the extension
     */
    get HTMLElement(): string {
        return `<button id="${this._name}">${this._nameHTML}</button>`;
    }

    /**
     * Get the display style of the geometries
     * @return The render style
     */
    public abstract renderStyleGeometries(): RenderStyle;

    /**
     * If the extension continues to be active after clicking on map
     */
    public abstract persist(): boolean;

    /**
     * Call needed action from click event
     */
    public abstract async actionBtn(map: Map): Promise<void>;

    public abstract async actionMap(map: Map, mapClickEvent: MapClickEvent): Promise<void>;

}

// interface for geometries style
export interface RenderStyle {
    outlineWidth: number;
    fillColor: string;
    fillOpacity: number;
}