import { expect } from "chai";
import { XY } from "api/geometry";
import { geoconnexService, LinkedDataObj } from "./GeoconnexService";
import { Feature } from "../extensionManager/Feature";


describe("CHyFService class tests", () => {

    const URL = "https://geoconnex.ca";

    before( () => {
    })
    

    describe("getFeaturesCatchments", async () => {

        it("should return valid features", async () => {
            const url = `${URL}/gsip/resources/catchment/catchments`;
            const features: Feature<any>[] = await geoconnexService.getFeaturesCatchments(url);
            expect(features).to.not.be.undefined;
            expect(features[0].geometry.type).to.equal("Polygon");
        });

        it("should throw a error when the path is invalid", () => {
         const url = `${URL}/gsip/resoureeces/catchment/catchments`;
         const xy: XY = new XY(-73.1272315979004,46.03058062165159);
         expect( async () => await geoconnexService.getFeaturesCatchments(url) ).to.throw;
        });

    });

    describe("getLinkedDataObjs", async () => {

        it("should return valid linked data objs", async () => {
            const url = `${URL}/id/catchment/02OJ*CD`;
            const linkedDataObjs: LinkedDataObj[] = await geoconnexService.getLinkedDataObjs(url);
            expect(linkedDataObjs).to.not.be.undefined;
            expect(linkedDataObjs[0].type).to.equal("@id");
            expect(linkedDataObjs[0].uri).to.equal("https://geoconnex.ca/id/catchment/02OJ*CD");
            expect(linkedDataObjs[0].name).to.not.be.undefined;
            expect(linkedDataObjs[0].dataUris).to.not.be.undefined;
        });

    });

});

