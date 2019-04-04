class Loader {

    start() {
        $("body").append(`<div id="loader"></div>`)
    }

    stop() {
        $("#loader").remove()
    }

}

export let loader = new Loader();