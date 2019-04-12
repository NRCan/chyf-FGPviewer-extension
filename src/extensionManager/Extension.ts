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
    protected _layers: SimpleLayer[];
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
        this._layers = [];
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
     * Get a layer by its name. If no name specify, the main layer is used.
     * @param name - The layer's name
     * @return The layer
     */
    getLayer(name?: string): SimpleLayer {
        if(name == null) {
            return this._layers[0];
        } else {
            return this._layers.find( layer => layer.id == name);
        }
    }

    /**
     * Add a layer to the extension
     * @param name - The layer's name
     */
    async addLayer(name: string): Promise<SimpleLayer> {

        const layer = this._layers.find( (layer: SimpleLayer) => {
            return layer.id == name;
        });

        if(!layer) {
            const layers: SimpleLayer[] = await this._map.layers.addLayer(name);
            this._layers.push(layers[0]);
            return layers[0];
        } else {
            return layer;
        } 
    }

    /**
     * Get the extension's attributes. If no layer specify, the main layer is used.
     * @param layer - The layer to get attributes
     * @return The extension's attributes
     */
    getAttributes(layer?: SimpleLayer): any {
        if(layer == null) {
            return this._layers[0].getAttributes();
        }
        return layer.getAttributes();
    }

    /**
     * Set the extension layer's attributes. If no layer specify, the main layer is used.
     * @param attrs - The attributes to set
     * @param layer - The layer to get attributes
     */
    setAttributes(attrs: any, layer?: SimpleLayer) {

        if (!(attrs instanceof Object)) {
            throw new Error("The attributes must be a object");
        }

        if(layer == null) {
            return this._layers[0]._attributeArray = [attrs]; 
        } else {
            layer._attributeArray = [attrs]; 
        }
        
    }

    /**
     * Set the extension layer's attributes by feature properties. If no layer specify, the main layer is used.
     * @param features - The features to parse 
     * @param layer - The layer to get attributes
     */
    setAttributesByFeatures(features: Feature<any>[], layer?: SimpleLayer): void {
        let objs: any[] = [];
        features.forEach( (feature: Feature<any>) => {
            objs.push(feature.properties);
        });

        if(layer == null) {
            this._layers[0]._attributeArray = objs; 
        } else {
            layer._attributeArray = objs; 
        }
    }

    /**
     * Get the extension's geometries. If no layer specify, the main layer is used.
     * @param layer - The layer to get attributes
     * @return The extension's geometries
     */
    getGeometries(layer?: SimpleLayer): BaseGeometry[] {
        if(layer == null) {
            return this._layers[0].geometry; 
        }
        return layer.geometry;
    }

    /**
     * Set the extension layer's geometries. If no layer specify, the main layer is used.
     * @param geometries - The geometries to change to
     * @param layer - The layer to get attributes 
     */
    setGeometries(geometries: BaseGeometry | Array<BaseGeometry>, layer?: SimpleLayer) {

        if(layer == null) {
            // If the layer has geometries, remove them
            if(this._layers[0].geometry && this._layers[0].geometry.length !== 0) {
                this._layers[0].removeGeometry();
            }

            this._layers[0].addGeometry(geometries); 
        } else {
            // If the layer has geometries, remove them
            if(layer.geometry && layer.geometry.length !== 0) {
                layer.removeGeometry();
            }

            layer.addGeometry(geometries);
        }
    }

    /**
     * Add geometries to the layer. If no layer specify, the main layer is used.
     * @param geometries - The geometries to add
     * @param layer - The layer to get attributes
     */
    public addGeometries(geometries: BaseGeometry | BaseGeometry[], layer?: SimpleLayer) {
        if(layer == null) {
            this._layers[0].addGeometry(geometries);
        } else {
            layer.addGeometry(geometries);
        }
    }

    /**
     * Remove all geometries from a layer. If no layer specify, the main layer is used.
     * @param layer - The layer to get attributes
     */
    public removeGeometries(layer?: SimpleLayer, geometriesIds?: string[] | string) {
        if(layer == null) {
            this._layers[0].removeGeometry(geometriesIds);
        } else {
            layer.removeGeometry(geometriesIds);
        }
    }

    /**
     * Remove geometries for all layers
     */
    public removeAllGeometries() {
        this._layers.forEach( (layer: SimpleLayer) => {
            this.removeGeometries(layer);
        });
    }

    /**
     * Add a panel to the extension
     * @param panel - The panel to add
     */
    public addPanel(name: string): Panel {
        const exist = this._panels.find( (panel: Panel) => {
            return panel.id == name
        });

        if(exist) {
            return exist;
        }

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
     * Close a panel
     * @param panel - The panel to close
     */
    public closePanel(panel: Panel) {
        this._panels.forEach( (panel: Panel) => panel.close()); 
    }

    /**
     * Close all the panels
     */
    public closePanels() {
        try {
            this._panels.find( (panel: Panel) => panel.id == panel.id ).close(); 
        } catch(error) {

        }
        
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