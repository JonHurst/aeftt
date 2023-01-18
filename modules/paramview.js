"use strict";

let deg = (rad) => rad * 180 / Math.PI;
let ft = (m) => 3.28084 * m;
let fpm = (mps) => mps * 196.85;
let nm = (m) => m * 0.000539957;
let kt = (mps) => mps * 1.94384;
let mps = (kt) => kt * 0.514444;

const zpad3 = v => ('00' + v).slice(-3);
const [X, Y, Z] = [0, 1, 2];

const $ = id => document.getElementById(id);

class ParamView {
    constructor(fm) {
        this.val_ias = $("pv-ias");
        this.val_altitude = $("pv-alt");
        this.val_vs = $("pv-vs");
        this.val_bearing = $("pv-tdz-qdm");
        this.val_distance = $("pv-tdz-dist");
        this.val_depression = $("pv-tdz-dep");
        this.val_rwy_qfu = $("pv-rwy-qfu");
        this.val_rwy_elev = $("pv-rwy-elev");
        this.model = fm;
    };


    reset() {};


    update() {
        this.val_ias.textContent = `${kt(this.model.ias).toFixed(0)} kt`;
        const pos = this.model.position;
        const rwy_pos = this.model.rwy_pos;
        const alt = pos[Z] < rwy_pos[Z] ? ft(rwy_pos[Z]) : ft(pos[Z]);
        this.val_altitude.textContent =
            `${(Math.round(alt / 10) * 10).toFixed(0)} ft`;
        this.val_vs.textContent =
            `${(Math.round(fpm(this.model.rod) / 50) * 50).toFixed(0)} fpm`;
        const dy = pos[Y] - rwy_pos[Y];
        const dx = pos[X] - rwy_pos[X];
        let bearing_rads = (3 * Math.PI / 2) - Math.atan2(dy, dx);
        bearing_rads = (bearing_rads >= 2 * Math.PI) ?
            bearing_rads - 2 * Math.PI : bearing_rads;
        this.val_bearing.textContent = `${zpad3(deg(bearing_rads).toFixed(0))}°`;
        const distance = Math.sqrt(dx**2 + dy**2);
        this.val_distance.textContent = `${nm(distance).toFixed(1)} nm`;
        const dep = pos[Z] < rwy_pos[Z] ? 0 : Math.atan2(pos[Z] - rwy_pos[Z], distance);
        this.val_depression.textContent = `${deg(dep).toFixed(1)}°`;
        this.val_rwy_qfu.textContent = `${zpad3(this.model.rwy_qfu)}°`;
        this.val_rwy_elev.textContent = `${Math.round(ft(rwy_pos[Z]))} ft`;
    };
};

export {ParamView};
