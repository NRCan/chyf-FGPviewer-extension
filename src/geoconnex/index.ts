import { Extension } from "../extensionManager/Extension";
import { GeoconnexExtension } from "./GeoconnexExtension";
import { ExtensionsManager } from "../extensionManager/ExtensionsManager";
import Map from "api/map";

/**
 * Global object called by the "rz-extensions".
 * The fonction "init" contain the global map instance "api"
 */
(<any>window).geoconnex = {
    init: function(api: Map) {
        const manageExtension: ExtensionsManager = new ExtensionsManager(api, "Geoconnex");
        const gsip: Extension = new GeoconnexExtension(api, "GSIP",`https://geoconnex.ca/gsip/resources/catchment/catchments`);

        manageExtension.addExtensions([gsip]);
    }
};

