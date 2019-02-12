import Axios, { AxiosResponse } from "axios";
import { Feature } from "../extensionManager/Feature";
import { GeojsonUtils } from "../utils/GeojsonUtils";

/**
 * Service for the Geoconnex HTML request
 */
class GeoconnexService {

    constructor(){}
    
    /**
     * Get a list of features from catchments
     * @param url - The url of the request
     */
    public async getFeaturesCatchments(url: string): Promise<Feature<CatchmentsProperties>[]> {
        try {
            const response: AxiosResponse = await Axios.get(url);
            const feature: Feature<CatchmentsProperties>[] = GeojsonUtils.getFeaturesFromGeoJSON(response.data);
            return feature;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    /**
     * Get linked data objects from a linked data graph url
     * @param url - The linked data graph url
     */
    public async getLinkedDataObjs(url: string): Promise<LinkedDataObj[]> {
        try {
            const response: AxiosResponse = await Axios.get(url);
            const linkedDataObjs: LinkedDataObj[] = await this.convertGraphToLinkedDataObjs(response.data, url);
            return linkedDataObjs;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    /**
     * Get the json data from a url
     * @param url - The url of the request
     */
    private async getByUrl(url: string): Promise<any> {
        try {
            const response: AxiosResponse = await Axios.get(url);
            return response.data;
        } catch (error) {
            throw new Error("File not found");
        }
    }

    /**
     * Convert a graph json to linked data objects
     * @param json - The json to convert
     * @param url - The linked data graph url
     */
    private async convertGraphToLinkedDataObjs(json: LinkedDataGraph, url: string): Promise<LinkedDataObj[]> {

        let linkedDataObjs: LinkedDataObj[] = [];
        let obj: LinkedDataObj[] = [];

        // Get the section of the json with the right informations
        const linkedDataJson: LinkedDataJson = this.getSectionDataFromGraph(json, url);

        // Parse every entries of the section and convert them to a linked data object for convenience

        obj = await this.getLinkedDataObjsByType("@id", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);
        
        obj = await this.getLinkedDataObjsByType("contains", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("mesures", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("near", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("inside", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("drains", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        obj = await this.getLinkedDataObjsByType("drains-into", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);
    
        obj = await this.getLinkedDataObjsByType("overlaps", linkedDataJson);
        linkedDataObjs = linkedDataObjs.concat(obj);

        return linkedDataObjs;
    }

    /**
     * Get linked data objects by type
     * @param type - The type of the entry
     * @param data - The section of the json to parse
     */
    private async getLinkedDataObjsByType(type: string, data: LinkedDataJson): Promise<LinkedDataObj[]>  {
        let linkedDataObjs: LinkedDataObj[] = [];

        // If the type is not in the section, return
        if(!data[type]) {
            return [];
        }

        // Is there are many instance of the type
        let length = data[type] instanceof Array ? data[type].length: 1;

        for(let i = 0; i < length; i++) {

            // Get the uri from a array or a string
            let uri: string = data[type] instanceof Array ? data[type][i]: data[type];

            // Get informations of the entry uri
            const json: LinkedDataGraph = await this.getByUrl(uri);

            // Get the right section
            const linkedDataJson: LinkedDataJson = this.getSectionDataFromGraph(json, uri);
   
            // Get the name
            const name = linkedDataJson.label[0]["@value"];

            // Get dataUris
            let dataUris: string[] = [];
            if(linkedDataJson.seeAlso instanceof Array) {
                linkedDataJson.seeAlso.forEach ( (uri: string) => {
                    dataUris.push(`${uri}?f=geojson`);
                });
            } else {
                dataUris.push(`${linkedDataJson.seeAlso}?f=geojson`);
            }

            // Create the linked data object
            linkedDataObjs.push ({
                type: type,
                name: name,
                uri: uri,
                dataUris: dataUris
            });
        }
        return linkedDataObjs;
    }

    /**
     * Return the section of the json needed
     * @param json - The json to parse
     * @param id - The id to find
     */
    private getSectionDataFromGraph(json: LinkedDataGraph, id: string): LinkedDataJson {
        let linkedData: LinkedDataJson = null;
        json["@graph"].forEach( (data: LinkedDataJson) => {
            if(data["@id"] === id) {
                linkedData = data;
            }
        });
        return linkedData;
    }

}

export interface LinkedDataObj {
    type: string,
    name: string,
    uri: string,
    dataUris: string[];
};

export interface LinkedDataGraph {
    "@graph": LinkedDataJson[]
};

export interface LinkedDataJson {
    "@id": string,
            "@type": string[],
            "contains": string[],
            "drains": string[],
            "drains-into": string[],
            "inside": string[],
            "overlaps": string,
            "mesures": string,
            "near": string[],
            "name": string,
            "label": {
                "@language": string,
                "@value": string
            }[],
            "seeAlso": string | string[],
            "sameAs": string | string[]
}

export interface CatchmentsProperties {
    uri: string,
    type: string,
    id: string,
    name: string,
    legal: string,
    "drains-to": string
};

export let geoconnexService: GeoconnexService = new GeoconnexService();