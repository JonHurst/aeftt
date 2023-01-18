"use strict";

import {Controller} from './modules/controller.js';


function register_service_worker() {
    if (!'serviceWorker' in navigator) return;
    navigator.serviceWorker.register('sw.js').then(
        function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ',
                        registration.scope);
        },
        function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
}

let controller;

function main() {
    window.addEventListener("resize", onresize);
    onresize();
    controller = new Controller();
    if(window.localStorage.getItem("dont_show")) {
        controller.new_scenario();
        document.getElementById("grid").style.display = "grid";
    }
    else {
        controller.default_scenario();
        document.getElementById("tour-finish").onclick = () => {
            document.getElementById("tour").classList.add("hidden");
            ["ControlBar", "ParamView", "MenuBar", "RunwayInfo",
             "ndview", "ndview-range-control", "Characteristics"].forEach(e => {
                 document.getElementById(e).classList.remove("blurred");
             });
            if(document.getElementById("dont_show").checked)
                window.localStorage.setItem("dont_show", "true");
            controller.new_scenario();
        };
        tour_step(0);
        document.getElementById("grid").style.display = "grid";
    }
    register_service_worker();
}


function onresize(event) {
    const grid_width = 80;
    const grid_height = 58;
    const m = document.getElementById("measure");
    const remw = m.offsetWidth / grid_width;
    const remv = m.offsetHeight / grid_height;
    const rem = Math.min(remw, remv);
    document.documentElement.style.fontSize = `${rem}px`;
}


function tour_step(step) {
    const tour = document.getElementById("tour");
    tour.classList.remove("tour--bottom-left");
    tour.classList.remove("hidden");
    const messages = Array.from(document.getElementsByClassName("tour-msg"));
    ["ControlBar", "ParamView", "MenuBar", "RunwayInfo",
     "ndview", "ndview-range-control", "Characteristics"].forEach(e => {
        document.getElementById(e).classList.add("blurred");
    });
    messages.forEach(e => e.classList.add("hidden"));
    messages[step].classList.remove("hidden");
    document.getElementById("tour-next").onclick = () => tour_step(++step);
    switch(step) {
    case 0:
    case 1:
        break;
    case 2:
        document.getElementById("ndview").classList.remove("blurred");
        document.getElementById("ndview-range-control").classList.remove("blurred");
        tour.classList.add("tour--bottom-left");
        break;
    case 3:
        document.getElementById("ControlBar").classList.remove("blurred");
        break;
    case 4:
        document.getElementById("ParamView").classList.remove("blurred");
        document.getElementById("RunwayInfo").classList.remove("blurred");
        break;
    case 5:
        document.getElementById("Characteristics").classList.remove("blurred");
        break;
    case 6:
        document.getElementById("MenuBar").classList.remove("blurred");
        break;
    case 7:
        ["dont_show_group", "tour-next", "tour-finish"].forEach(
            id => document.getElementById(id).classList.toggle("hidden"));
    }

}


window.addEventListener("load", main);
