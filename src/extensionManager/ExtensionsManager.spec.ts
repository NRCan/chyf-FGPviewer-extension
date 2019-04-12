import "jsdom-global/register";
import Map from "api/map";
import { ExtensionsManager } from "./ExtensionsManager";
import { Observable } from "rxjs";
import { XY, BaseGeometry } from "api/geometry";
import { expect } from "chai";
import * as $ from "jquery";
import { CHyFExtension } from "../chyf/CHyFExtension";
import { BaseLayer, LayerGroup } from "api/layers";

// @ts-ignore
global.$ = $;

describe("ManageExtension class tests", () => {

    let _map: Map;

    before( () => {

        // @ts-ignore - Mock layer
        const _layer: SimpleLayer = {
            _attributeArray: [],
            _geometryArray: [],
            _layersArray: [],
            addGeometry: function(geo: BaseGeometry) {
                this._geometryArray.push(geo);
            },
            get geometry() {
                return this._geometryArray;
            },
            getAttributes: function() {
                return this._attributeArray;
            },
            removeGeometry: function() {
                this._geometryArray = [];
            },
            addLayer: function(layer: BaseLayer) {
                this._layersArray.push(layer);
                return this._layersArray;
            }
        }

        //@ts-ignore - Mock Map
        _map = {
            click: Observable.create( (observer) => {
                observer.next( {
                    xy: new XY(-73.2480812072754,45.82245932513635)
                });
                observer.complete();
            }),
            get layers(): LayerGroup {
                return this.layersObj;
            },
            layersObj: _layer
        }
    });



    describe("init", () => {

        before( () => {
            $("body").after(
                `<ul class="rv-legend-list rv-legend-root rv-legend-level-0 ng-scope"></ul>`
            )
        });

        it("should return a new instance of the class", () => {
            const manageExtension: ExtensionsManager = new ExtensionsManager(_map, "Test");
            expect(manageExtension).to.not.be.null;
        });
    
        it("should create the base HTML component", () => {
            new ExtensionsManager(_map, "Test");
            expect($(".title-extensions").text()).to.not.be.empty;
        })

    });

    describe("addExtensions", () => {

        let manageExtension: ExtensionsManager;

        before( () => {
            $("body").after(
                `<ul class="rv-legend-list rv-legend-root rv-legend-level-0 ng-scope"></ul>`
            )
            manageExtension = new ExtensionsManager(_map, "Test");
        });

        it("should add the extension HTML component", () => {
            manageExtension.addExtensions([new CHyFExtension(null,"name","url")]);
            expect($(".panel-extensions > li > button")[0].id).to.equal("name");
        });

        it("should add a new layer extension", () => {
            manageExtension.addExtensions([new CHyFExtension(null,"name","url")]);
            expect(_map.layers._layersArray).to.not.be.empty;
        });

    });

    

});