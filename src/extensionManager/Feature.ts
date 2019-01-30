
/**
 * Represent the data structure of a geo feature
 */
export class Feature<T> {
    private _type: string;
    private _properties: T;
    private _geometry: {
        type: string,
        coordinates: any
    }
    private _id: string | number;

    constructor(type: string, properties: T, geometry: any, id: string | number) {
        this._type = type;
        this._properties = properties;
        this._geometry = geometry;
        this._id = id;
    }

    set type(type: string) {
        this._type = type;
    }

    get type() {
        return this._type;
    }

    set properties(properties: T) {
        this._properties = properties;
    }

    get properties() {
        return this._properties;
    }

    set geometry(geometry: any) {
        this._geometry = geometry;
    }

    get geometry() {
        return this._geometry;
    }

    get id() {
        return this._id;
    }
}