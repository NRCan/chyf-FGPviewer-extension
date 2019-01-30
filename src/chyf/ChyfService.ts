import { Feature } from "../extensionManager/Feature";
import Axios, { AxiosResponse } from "axios";
import { XY } from "api/geometry";
import { GeojsonUtils } from "../utils/GeojsonUtils";

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
}

export let chyfService = new ChyfService();

export interface chyfProperties {
    area?: number
}