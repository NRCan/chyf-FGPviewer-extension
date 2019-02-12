import { expect } from "chai";
import { Feature } from "src/manageExtension/Feature";
import { GeojsonUtils } from "./GeojsonUtils";


/**
 * IMPORTANT - For test purposes, you must remove the "RZ.GEO" in the corresponding files
 * ex: RZ.GEO.Polygon -> Polygon
 * This is because the variable RZ is a window variable from the FGPV-VPGF
 */

describe("GeojsonUtils class tests", () => {

    const URL = "http://dev.geogratis.gc.ca:8012/chyf/";

    before( () => {
    })
    

    describe("getFeaturesFromGeoJSON", async () => {

        it("should return valid features", async () => {
            const json = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "catchment": "02OJ_CD"
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [
                                -73.274118,
                                45.12533
                            ]
                        }
                    }
                ]
            };
            const features: Feature<any>[] = GeojsonUtils.getFeaturesFromGeoJSON(json);
            expect(features[0].properties.catchment).to.not.be.undefined;
            expect(features[0].type).to.equal("Feature");
            expect(features[0].geometry.type).to.equal("Point");
        });

    });

});

