import { expect } from "chai";
import { XY } from "api/geometry";
import { chyfService } from "./ChyfService";
import { Feature } from "../extensionManager/Feature";


describe("CHyFService class tests", () => {

    const URL = "http://dev.geogratis.gc.ca:8012/chyf/";

    before( () => {
    })
    

    describe("getFeatureByPoint", async () => {

        it("should return valid features", async () => {
            const url = `${URL}/drainageArea/downstreamOf.json`;
            const xy: XY = new XY(-73.1272315979004,46.03058062165159);
            const features: Feature<any>[] = await chyfService.getFeatureByPoint(url, xy, false);
            expect(features).to.not.be.undefined;
            expect(features[0].geometry.type).to.equal("Polygon");
        });

        it("should throw a error when the path is invalid", () => {
         const url = `${URL}/drainageArea/downstreeamOf.json`;
         const xy: XY = new XY(-73.1272315979004,46.03058062165159);
         expect( async () => await chyfService.getFeatureByPoint(url, xy, false) ).to.throw;
        });

    });

});

