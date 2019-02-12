import { Extension } from "../extensionManager/Extension";
import { CHyFExtension } from "./CHyFExtension";
import { ExtensionsManager } from "../extensionManager/ExtensionsManager";
import Map from "api/map";

/**
 * Global object called by the "rz-extensions".
 * The fonction "init" contain the global map instance "api"
 */
(<any>window).chyf = {
    init: function(api: Map) {
        const manageExtension: ExtensionsManager = new ExtensionsManager(api, "CHyF");
        const flowpathUpstream: Extension = new CHyFExtension(api, "Flowpaths Upstream", "http://dev.geogratis.gc.ca:8012/chyf/eflowpath/upstreamOf.json");
        const flowpathDownstream: Extension = new CHyFExtension(api, "Flowpaths Downstream", "http://dev.geogratis.gc.ca:8012/chyf/eflowpath/downstreamOf.json");
        const upstream: Extension = new CHyFExtension(api, "Drainages Upstream","http://dev.geogratis.gc.ca:8012/chyf/drainageArea/upstreamOf.json");
        const downstream: Extension = new CHyFExtension(api, "Drainages Downstream","http://dev.geogratis.gc.ca:8012/chyf/drainageArea/downstreamOf.json");

        manageExtension.addHTMLComponent(`<div class="list-extensions">Remove Holes: <input id="removeHoles" type="checkbox" value="holes"></div>`);
        manageExtension.addExtensions([upstream, downstream, flowpathUpstream, flowpathDownstream]);
    }
};

