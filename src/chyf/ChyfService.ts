import { Feature } from "../extensionManager/Feature";
import Axios, { AxiosResponse } from "axios";
import { XY } from "api/geometry";
import { GeojsonUtils } from "../utils/GeojsonUtils";
import { InputPourpoint, MatrixPourpoint } from "./PourpointExtension";

/**
 * Service for the CHyF HTML request
 */
class ChyfService {

    constructor(){}

    /**
     * Get a list of features from a point on map
     * @param url - The url for the request
     * @param xy - The point on map
     * @param removeHoles - Is removeHoles
     */
    public async getFeatureByPoint(url: string, xy: XY, removeHoles: boolean): Promise<Feature<any>[]> {
        try {
            url = `${url}?point=${xy.x},${xy.y}&removeHoles=${removeHoles}`;
            const response: AxiosResponse = await Axios.get(url)
            const features: Feature<chyfProperties>[] = GeojsonUtils.getFeaturesFromGeoJSON(response.data);
            return features;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    /**
     * Get a json for specific input pourpoints
     * @param url - The url
     * @param inputs - The input pourpoints
     * @param opts - Options (Output layers)
     * @param removeHoles - If remove holes
     * @param includeStats - If include all statistics
     * @return - list of pourpoint data objects
     */
    public async getPourpointData(url: string, inputs: InputPourpoint[], opts: string[], removeHoles: boolean, includeStats: boolean): Promise<PourpointDataObj[]> {
        try {
            url = this.createPourpointUrl(url, inputs, opts, removeHoles, includeStats);
            const response: AxiosResponse = await Axios.get(url)
            const pourpointDataObjs: PourpointDataObj[] = this.parsePourpointJson(response.data);
            return pourpointDataObjs;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    /**
     * Parse the json to return a list of pourpoint data objects
     */
    private parsePourpointJson(json: any): PourpointDataObj[] {
        let pourpointDataObjs: any[] = [];

        json.forEach( (section: any) => {
            if (section.type == "FeatureCollection") {
                pourpointDataObjs.push({code: section.key, name: section.name, features: GeojsonUtils.getFeaturesFromGeoJSON(section)});
            } 
            else if(section.key == "prt") {
                pourpointDataObjs.push({code:section.key, name:section.name, tree: section.tree})
            } 
            else {
                pourpointDataObjs.push({code:section.key,  name:section.name, matrix: new MatrixPourpoint(section.headers, section.values)});
            }
        }) 

        return pourpointDataObjs
    }

    /**
     * Create a url for the pourpoint API
     */
    private createPourpointUrl(url: string, inputs: InputPourpoint[], opts: string[], removeHoles: boolean, includeStats: boolean): string {
        url = `${url}?points=`;
        inputs.forEach( (input: InputPourpoint) => {
            url += `${input.id},${input.point.x}, ${input.point.y},${input.code},`;
        });
        url += `&output=`;
        opts.forEach( (opt: String) => {
            url += `${opt},`;
        });
        url += `&removeHoles=${removeHoles}&includeStats=${includeStats}`;
        return url;
    }
}

export let chyfService = new ChyfService();

export interface chyfProperties {
    area?: number
}

export interface PourpointDataObj {
    code: string,
    name: string,
    tree?: string,
    features?: Feature<any>[]
    matrix?: MatrixPourpoint
}