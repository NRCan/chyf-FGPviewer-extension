import { Feature } from "../extensionManager/Feature";
import { BaseGeometry, Polygon, XY } from "api/geometry";
import * as inside from "point-in-polygon";

// Use window global variable from the FGPV-VPGF
declare const RZ: any;

/**
 * The utilities for GeoJSON
 */
export class GeojsonUtils {
    
    /**
     * Parse a geoJSON and get features from it
     * @param json - The json to parse
     */
    public static getFeaturesFromGeoJSON(json: any): Feature<any>[] {
        let features: Feature<any>[] = [];

        if(json.type === "FeatureCollection") {
            json.features.forEach( (feature: Feature<any>) => {
                const id = Math.floor((Math.random() * 1000000) + 1);
                features.push(new Feature(feature.type, feature.properties, feature.geometry, id));
            });
        } else {
            const id = Math.floor((Math.random() * 1000000) + 1);
            features.push(new Feature(json.type, json.properties, json.geometry, id));
        }

        return features;
    }

    /**
     * Convert features to geometries.
     * @param features - The features to convert
     * @param renderStyleGeometries - The style of the geometries
     */
    public static convertFeaturesToGeometries(features: Feature<any>[], renderStyleGeometries: any): BaseGeometry[] {

        let geometries: BaseGeometry[] = [];

        features.forEach ( (feature: Feature<any>) => {

            let points:XY[] = [];
            let polygons: Polygon[] = [];

            // The id of the geometry is the same as the id of the feature.
            try 
            {
                switch (feature.geometry.type) {
                    case "Point":
                    const xy: XY = new RZ.GEO.XY(feature.geometry.coordinates[0],feature.geometry.coordinates[1]);
                        geometries.push(new RZ.GEO.Point(feature.id, xy, renderStyleGeometries));
                        break;
                    case "Polygon":
                        points.push(feature.geometry.coordinates[0]);
                        geometries.push(new RZ.GEO.Polygon(feature.id, points, renderStyleGeometries));
                        break;
                    case "MultiPolygon":
                        feature.geometry.coordinates.forEach ( (coordinates: any[]) => {
                            points.push(coordinates[0]);
                            let id = Math.floor((Math.random() * 1000000) + 1);
                            polygons.push(new RZ.GEO.Polygon(id, points, renderStyleGeometries));
                            points = [];
                        }); 
                        geometries.push(new RZ.GEO.MultiPolygon(feature.id, polygons, renderStyleGeometries));
                        break;
                    case "LineString":
                        feature.geometry.coordinates.forEach( (coordinate: any[]) => {
                            points.push(new RZ.GEO.XY(coordinate[0], coordinate[1]))
                        });
                        geometries.push(new RZ.GEO.LineString(feature.id, points, renderStyleGeometries));
                        break;
                }
            } catch (error) {
                throw new Error(`Cannot parse the data : ${error.message}`);
            }

        });

        return geometries;
    }

    /**
     * Get a geometry from a point on map
     * @param xy - The point on map
     * @param features - The features list
     * @param geometries - The geometries list
     */
    public static getGeometryFromPoint(xy: XY, features: Feature<any>[], geometries: BaseGeometry[]): BaseGeometry | null {
        let geo = null;
        let found = false;
        features.forEach( (feature: Feature<any>) => {

            let polygon = feature.geometry.coordinates[0];
            if (!found && inside([xy.x, xy.y], polygon)) {
                geo = geometries.find( (geo) => {
                    return geo.id == feature.id;
                });
                found = true;
            }
        });

        return geo;
    };

    /**
     * Get the geometry from the feature
     * @param geometry - The geometry to convert
     * @param features - The list of features
     */
    public static convertGeometryToFeature(geometry: BaseGeometry, features: Feature<any>[]): Feature<any> {
        return features.find( (feature: Feature<any>) => {
            return geometry.id == feature.id;
        });
    }

}