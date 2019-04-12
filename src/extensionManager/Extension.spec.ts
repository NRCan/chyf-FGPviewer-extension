import { expect } from "chai";
import { CHyFExtension } from "../chyf/CHyFExtension";
import { BaseGeometry, XY, Point, Polygon } from "api/geometry";
import { Extension } from "./Extension";
import { SimpleLayer } from "api/layers";


describe("Extension class tests", () => {

    let _extension: Extension;
    let _layer: SimpleLayer;

    before( () => {

        // @ts-ignore - Mock layer
        _layer = {
            _geometryArray: [],
            addGeometry: function(geo: BaseGeometry) {
                this._geometryArray.push(geo);
            },
            get geometry() {
                return this._geometryArray;
            },
            removeGeometry: function() {
                this._geometryArray = [];
            }
        }

        _extension = new CHyFExtension(null,"extension",`${URL}/drainageArea/upstreamOf.json`);
        _extension.layer = _layer;
        
    });

    describe("setGeometries", () => {

        it("should remove the old geometries and add the news", async () => {
            const point1: Point = new Point(0, new XY(45,65));
            const polygon1: Polygon = new Polygon(1, [point1]);
            const point2: Point = new Point(2, new XY(40,60));
            const polygon2: Polygon = new Polygon(3, [point2]);
            
            _extension.geometries = [polygon1, polygon2];

            const point3: Point = new Point(4, new XY(35,55));
            const polygon3: Polygon = new Polygon(6, [point3]);
            _extension.geometries = [polygon3];

            expect(_extension.geometries.length).to.equal(1);
            expect(_extension.geometries[0][0]._id).to.equal('6');
            
        });

    });

});