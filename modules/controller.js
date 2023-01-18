"use strict";

import {Model} from './model.js';
import {scenarios} from '../scenarios.js';
import {NDView} from './ndview.js';
import {ParamView} from './paramview.js';

const CURRENT_VERSION = "0.9";

const $ = id => document.getElementById(id);
const zpad3 = v => ('00' + v).slice(-3);
const [X, Y, Z] = [0, 1, 2];

const kt = (mps) => mps * 1.94384;
const mps = (kt) => kt * 0.514444;
const ft = (m) => 3.28084 * m;

const conf_names = ["Conf 0", "Conf 1", "Conf 2", "Conf 3", "Full"];
const sb_names = ["SB 0", "SB ¼", "SB ½", "SB ¾", "SB 1"];


class Controller {

    constructor() {
        this.fm = new Model();
        this.views = [
            new NDView(this.fm),
            new ParamView(this.fm)
        ];
        this.curr_scenario = null;
        this.curr_wind = 0;
        this.last_timestamp = this.fm.elapsed_time;
        this.install_wiring();
        const _this = this;
        function animate() {
            if(_this.last_timestamp != _this.fm.elapsed_time) {
                _this.views.forEach(v => v.update());
                _this.last_timestamp = _this.fm.elapsed_time;
            };
            window.requestAnimationFrame(animate);
        };
        animate();
    }


    default_scenario() {
        this.curr_scenario = scenarios[0];
        this.curr_wind = 0;
        this.restart_scenario();
    }


    new_scenario() {
        //populate dialog
        const scenarios_dialog = $("scenarios");
        const _this = this;
        let buttons = scenarios.map((s) => {
            let button = document.createElement("Button");
            button.textContent = s.title;
            button.classList.add("dialog__choice-button");
            button.addEventListener("click", () => {
                scenarios_dialog.close();
                _this.curr_scenario = s;
                _this.pick_wind(s);
            });
            return button;
        });
        document.getElementById("scenario-list").replaceChildren(...buttons);
        scenarios_dialog.showModal();
    }


    pick_wind(s) {
        if(!s.wind || s.wind.length === 1) {
            this.curr_wind = 0;
            this.restart_scenario();
        }
        else {
            const wind_dialog = $("winds");
            const _this = this;
            let buttons = s.wind.map((w, c) => {
                let button = document.createElement("Button");
                button.textContent = w[2];
                button.classList.add("dialog__choice-button");
                button.addEventListener("click", () => {
                    wind_dialog.close();
                    _this.curr_wind = c;
                    _this.restart_scenario();
                });
                return button;
            });
            $("wind-list").replaceChildren(...buttons);
            wind_dialog.showModal();
        }
    }


    restart_scenario() {
        $("pause-message").classList.remove("hidden");
        this.fm.stop();
        this.fm.set_scenario(this.curr_scenario, this.curr_wind);
        initialise_controls(this.fm);
        this.views.forEach(v => {v.reset(); v.update();});
    }


    install_wiring() {
        const wiring = {
            "play-button": () => {
                $("pause-message").classList.add("hidden");
                this.fm.start();
            },
            "pause-button": () => {
                $("pause-message").classList.remove("hidden");
                this.fm.stop();
            },

            "scenarios-close-button": () => {
                $("scenarios").close();
                if(!this.curr_scenario) {
                    this.curr_scenario = scenarios[0];
                    this.curr_wind = 0;
                    this.restart_scenario();
                }
            },

            "winds-close-button": () => {
                $("winds").close();
                this.curr_wind = 0;
                this.restart_scenario();
            },

            "menu-button": () => {
                check_version();
                $("main_menu").showModal();
            },
            "mm-restart-current": () => this.restart_scenario(),
            "mm-new-scenario": () => this.new_scenario(),
            "mm-reload": () => window.location.reload(),
            "mm-background-info": () => window.open(
                'https://hursts.org.uk/aeftt/help/background.html'),

            "info-char-button": () => $("info-char").classList.remove("hidden"),
            "info-char-close": () => $("info-char").classList.add("hidden"),
            "info-glide-button": () => $("info-glide").classList.remove("hidden"),
            "info-glide-close": () => $("info-glide").classList.add("hidden"),

            "ndview-10nm": () => this.views[0].set_scale(10),
            "ndview-20nm": () => this.views[0].set_scale(20),

            "cb-hdg-45": () => change_target_heading(this.fm, -45),
            "cb-hdg-10": () => change_target_heading(this.fm, -10),
            "cb-hdg-1": () => change_target_heading(this.fm, -1),
            "cb-hdg+1": () => change_target_heading(this.fm, 1),
            "cb-hdg+10": () => change_target_heading(this.fm, 10),
            "cb-hdg+45": () => change_target_heading(this.fm, 45),

            "cb-spd-10": () => change_target_speed(this.fm, -10),
            "cb-spd-1": () => change_target_speed(this.fm, -1),
            "cb-spd+1": () => change_target_speed(this.fm, 1),
            "cb-spd+10": () => change_target_speed(this.fm, 10),

            "cb-gear": () => deploy_gear(this.fm),

            "cb-flap-": () => change_conf(this.fm, -1),
            "cb-flap+": () => change_conf(this.fm, 1),

            "cb-sb-": () => change_sb(this.fm, -1),
            "cb-sb+": () => change_sb(this.fm, 1),
        };
        Object.keys(wiring).forEach(id =>
            $(id).addEventListener("click", wiring[id].bind(this)));
    };

};


function initialise_controls(fm) {
    $("ndview-10nm").checked = true;
    $("cb-hdg-disp").textContent = zpad3(fm.target_heading) + "°";
    $("cb-spd-disp").textContent = `${Math.round(kt(fm.target_ias))}kt`;
    $("cb-flap-disp").textContent = conf_names[fm.conf];
    $("cb-sb-disp").textContent = sb_names[fm.sb];

    const gear_button = $("cb-gear");
    gear_button.classList.remove("cb-gearbutton--deploying");
    if(fm.gear_deployed()) {
        gear_button.setAttribute("disabled", "disabled");
        gear_button.classList.add("cb-gearbutton--deployed");
    }
    else {
        gear_button.removeAttribute("disabled");
        gear_button.classList.remove("cb-gearbutton--deployed");
    }
}


function change_target_heading(fm, inc) {
    if(!fm.running) return;
    const success = fm.increment_target_heading(inc);
    if(!success) {
        flash_control_bar($("cb-heading-group"));
    }
    $("cb-hdg-disp").textContent = zpad3(fm.target_heading) + "°";
}


function change_target_speed(fm, inc) {
    if(!fm.running) return;
    const success = fm.increment_target_ias(mps(inc));
    if(!success) {
        flash_control_bar($("cb-speed-group"));
    }
    $("cb-spd-disp").textContent = `${Math.round(kt(fm.target_ias))}kt`;
}


function deploy_gear(fm) {
    if(!fm.running || !fm.can_extend_gear()) return;
    const gear_button = $("cb-gear");
    gear_button.setAttribute("disabled", "disabled");
    gear_button.classList.add("cb-gearbutton--deploying");
    window.setTimeout(() => {
        gear_button.classList.replace(
            "cb-gearbutton--deploying",
            "cb-gearbutton--deployed");
        fm.extend_gear();
        // extending gear may alter target ias
        $("cb-spd-disp").textContent = `${Math.round(kt(fm.target_ias))}kt`;

    }, 3000);
}


function change_conf(fm, inc) {
    if(!fm.running) return;
    const success = fm.increment_conf(inc);
    if(!success) {
        flash_control_bar($("cb-conf-group"));
    }
    $("cb-flap-disp").textContent = conf_names[fm.conf];
    // may cause speedbrake autoretract
    $("cb-sb-disp").textContent = sb_names[fm.sb];
}


function change_sb(fm, inc) {
    if(!fm.running) return;
    const success = fm.increment_sb(2 * inc); // only use zero, half and full
    if(!success) {
        flash_control_bar($("cb-sb-group"));
    }
    $("cb-sb-disp").textContent = sb_names[fm.sb];
}


function flash_control_bar(bar) {
    bar.animate({backgroundColor: ["yellow", "white"]}, 1000);
}


function check_version() {
    window.fetch("version.json")
        .then((res) => {
            if(!res.ok) throw Error(`Error: ${res.status}`);
            return res.json();
        })
        .then((json) => {
            if(json.version !== CURRENT_VERSION)
                $("mm-version-warning").classList.remove("hidden");
        })
        .catch(err => console.log(err));
}


export {Controller};
